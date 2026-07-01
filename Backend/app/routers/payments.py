import hmac
import hashlib
import urllib3
import requests as http
from fastapi import APIRouter, Depends, HTTPException
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from pydantic import BaseModel
from ..database import supabase
from ..auth import get_user_role
from ..config import settings
from ..logger import logger
from .appointments import generate_op_number

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_API = "https://api.razorpay.com/v1"


def _rzp_post(path: str, payload: dict) -> dict:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(500, "Razorpay not configured")
    res = http.post(
        f"{RAZORPAY_API}{path}",
        json=payload,
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
        verify=False,  # test-mode only
        timeout=10,
    )
    if not res.ok:
        logger.error("Razorpay error %s: %s", res.status_code, res.text)
        raise HTTPException(500, "Payment gateway error")
    return res.json()


class CreateOrderRequest(BaseModel):
    appointment_id: str
    amount: int  # in rupees


class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    appointment_id: str


@router.post("/create-order")
def create_order(body: CreateOrderRequest, user=Depends(get_user_role)):
    order = _rzp_post("/orders", {
        "amount": body.amount * 100,
        "currency": "INR",
        "receipt": f"appt_{body.appointment_id[:8]}",
    })

    try:
        supabase.from_("payments").update({"razorpay_order_id": order["id"]}) \
            .eq("appointment_id", body.appointment_id).execute()
    except Exception:
        pass

    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}


@router.post("/verify")
def verify_payment(body: VerifyRequest, user=Depends(get_user_role)):
    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode()
    expected = hmac.new(settings.razorpay_key_secret.encode(), msg, hashlib.sha256).hexdigest()

    if expected != body.razorpay_signature:
        logger.warning("Invalid Razorpay signature for appt %s", body.appointment_id)
        raise HTTPException(400, "Invalid payment signature")

    supabase.from_("appointments").update({"status": "confirmed"}) \
        .eq("id", body.appointment_id).execute()

    try:
        supabase.from_("payments").update({
            "status": "paid",
            "razorpay_payment_id": body.razorpay_payment_id,
        }).eq("appointment_id", body.appointment_id).execute()
    except Exception:
        supabase.from_("payments").update({"status": "paid"}) \
            .eq("appointment_id", body.appointment_id).execute()

    existing = supabase.from_("op_records").select("id, op_number") \
        .eq("appointment_id", body.appointment_id).limit(1).execute()
    if not existing.data:
        op_res = supabase.from_("op_records").insert({
            "appointment_id": body.appointment_id,
            "op_number": generate_op_number(),
        }).execute()
        op = op_res.data[0]
    else:
        op = existing.data[0]

    logger.info("Payment verified for appt %s, op: %s", body.appointment_id, op.get("op_number"))
    return {"success": True, "op_number": op.get("op_number")}
