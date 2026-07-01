from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import date as date_type
from typing import Optional
from ..database import supabase
from ..auth import require_admin, get_user_role
from ..logger import logger

router = APIRouter(prefix="/leaves", tags=["leaves"])

class LeaveRequest(BaseModel):
    date: date_type
    reason: str = ""
    start_time: Optional[str] = None
    end_time: Optional[str] = None

@router.get("/")
def get_leaves(user=Depends(get_user_role)):
    res = supabase.from_("doctor_leaves").select("*").order("date").execute()
    return res.data

@router.post("/")
def add_leave(body: LeaveRequest, user=Depends(require_admin)):
    payload: dict = {"date": str(body.date), "reason": body.reason}
    if body.start_time is not None:
        payload["start_time"] = body.start_time
    if body.end_time is not None:
        payload["end_time"] = body.end_time
    try:
        res = supabase.from_("doctor_leaves").insert(payload).execute()
    except Exception:
        # start_time/end_time columns may not exist yet; fall back to date-only
        payload.pop("start_time", None)
        payload.pop("end_time", None)
        res = supabase.from_("doctor_leaves").insert(payload).execute()
    logger.info("Leave added: %s by admin %s", body.date, user["id"])
    return res.data[0]

@router.delete("/{leave_id}")
def delete_leave(leave_id: str, user=Depends(require_admin)):
    supabase.from_("doctor_leaves").delete().eq("id", leave_id).execute()
    logger.info("Leave deleted: %s by admin %s", leave_id, user["id"])
    return {"deleted": True}
