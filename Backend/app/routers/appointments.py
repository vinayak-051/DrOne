from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ..database import supabase
from ..auth import get_user_role, require_admin
from ..models.schemas import BookAppointmentRequest, ConfirmAppointmentRequest, RescheduleRequest
from ..logger import logger
import datetime, io

router = APIRouter(prefix="/appointments", tags=["appointments"])

def generate_op_number() -> str:
    import uuid
    year = datetime.datetime.now().year
    short = uuid.uuid4().hex[:6].upper()
    return f"OP-{year}-{short}"


def _build_op_pdf(appt: dict) -> bytes:
    from reportlab.lib.pagesizes import A5
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A5, leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    hospital = ParagraphStyle("hospital", fontSize=18, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=colors.HexColor("#1d4ed8"), spaceAfter=2)
    sub     = ParagraphStyle("sub",      fontSize=9,  fontName="Helvetica",      alignment=TA_CENTER, textColor=colors.grey, spaceAfter=12)
    op_num  = ParagraphStyle("op_num",   fontSize=28, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=colors.HexColor("#1e3a8a"), spaceAfter=4)
    op_lbl  = ParagraphStyle("op_lbl",   fontSize=9,  fontName="Helvetica",      alignment=TA_CENTER, textColor=colors.grey, spaceAfter=16)
    field_l = ParagraphStyle("field_l",  fontSize=9,  fontName="Helvetica",      textColor=colors.grey)
    field_v = ParagraphStyle("field_v",  fontSize=11, fontName="Helvetica-Bold", textColor=colors.HexColor("#111827"), spaceAfter=8)
    note    = ParagraphStyle("note",     fontSize=8,  fontName="Helvetica",      alignment=TA_CENTER, textColor=colors.grey)

    _opr = appt.get("op_records") or {}
    op = _opr[0] if isinstance(_opr, list) else _opr
    patient = appt.get("patients") or {}

    story = [
        Paragraph("DrOne Hospital", hospital),
        Paragraph("Outpatient Department", sub),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#dbeafe")),
        Spacer(1, 10*mm),
        Paragraph(op.get("op_number", "—"), op_num),
        Paragraph("OP Number", op_lbl),
        HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")),
        Spacer(1, 6*mm),
        Paragraph("Patient Name", field_l),
        Paragraph(patient.get("name", "—"), field_v),
        Paragraph("Appointment Date", field_l),
        Paragraph(appt.get("date", "—"), field_v),
        Paragraph("Time Slot", field_l),
        Paragraph(appt.get("time_slot", "—"), field_v),
        Paragraph("Phone", field_l),
        Paragraph(patient.get("phone", "—"), field_v),
        HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")),
        Spacer(1, 6*mm),
        Paragraph("Please arrive 10 minutes before your appointment.<br/>Bring this slip and a valid ID proof.", note),
    ]
    doc.build(story)
    return buf.getvalue()

def _get_patient_id(user_id: str) -> str:
    res = supabase.from_("patients").select("id").eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Patient profile not found")
    return res.data[0]["id"]

from ..models.schemas import VALID_TIME_SLOTS as _ALL_SLOTS

def _get_leave(date: str):
    res = supabase.from_("doctor_leaves").select("*").eq("date", date).limit(1).execute()
    return res.data[0] if res.data else None

def _is_leave_day(date: str) -> bool:
    return bool(_get_leave(date))


@router.get("/")
def get_appointments(user=Depends(get_user_role)):
    query = supabase.from_("appointments").select(
        "*, patients(*), op_records(*), payments(*)"
    ).order("date", desc=True)
    if user["role"] == "patient":
        patient_id = _get_patient_id(user["id"])
        query = query.eq("patient_id", patient_id)
    res = query.execute()
    return res.data


@router.get("/slots")
def get_available_slots(date: str, user=Depends(get_user_role)):
    leave = _get_leave(date)
    sorted_slots = sorted(_ALL_SLOTS)

    def _booked_slots(date: str) -> list:
        res = supabase.from_("appointments").select("time_slot") \
            .eq("date", date).neq("status", "cancelled").execute()
        return [r["time_slot"] for r in (res.data or [])]

    if leave:
        start = leave.get("start_time")
        end = leave.get("end_time")
        if start and end:
            blocked_by_leave = [s for s in sorted_slots if start <= s <= end]
            booked = list(set(_booked_slots(date) + blocked_by_leave))
            return {"booked": booked, "is_leave": False, "leave_range": f"{start} – {end}"}
        else:
            return {"booked": [], "is_leave": True}

    return {"booked": _booked_slots(date), "is_leave": False}


@router.post("/book")
def book_appointment(body: BookAppointmentRequest, user=Depends(get_user_role)):
    if _is_leave_day(str(body.date)):
        raise HTTPException(400, "Doctor is unavailable on this date")
    patient_id = _get_patient_id(user["id"])
    appt_res = supabase.from_("appointments").insert({
        "patient_id": patient_id,
        "date": str(body.date),
        "time_slot": body.time_slot,
        "status": "pending",
        "payment_method": body.payment_method,
    }).execute()
    appt = appt_res.data[0]
    appt_id = appt["id"]

    try:
        supabase.from_("payments").insert({
            "appointment_id": appt_id,
            "amount": body.amount,
            "status": "pending",
            "method": body.payment_method,
        }).execute()
    except Exception as e:
        supabase.from_("appointments").delete().eq("id", appt_id).execute()
        logger.error("Booking rollback for appt %s: %s", appt_id, e)
        raise HTTPException(500, "Booking failed, please try again")

    logger.info("Appointment booked: %s by patient %s", appt_id, patient_id)
    return {"appointment": appt}


@router.post("/confirm")
def confirm_appointment(body: ConfirmAppointmentRequest, user=Depends(require_admin)):
    supabase.from_("appointments").update({"status": "confirmed"}) \
        .eq("id", body.appointment_id).execute()
    supabase.from_("payments").update({"status": "paid"}) \
        .eq("appointment_id", body.appointment_id).execute()
    op = supabase.from_("op_records").insert({
        "appointment_id": body.appointment_id,
        "op_number": generate_op_number(),
    }).execute()
    logger.info("Appointment confirmed: %s by admin %s", body.appointment_id, user["id"])
    return op.data[0]


@router.get("/{appointment_id}")
def get_appointment(appointment_id: str, user=Depends(get_user_role)):
    res = supabase.from_("appointments").select(
        "*, patients(*), op_records(*), payments(*)"
    ).eq("id", appointment_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Appointment not found")
    appt = res.data[0]
    if user["role"] == "patient":
        patient_id = _get_patient_id(user["id"])
        if appt["patient_id"] != patient_id:
            raise HTTPException(403, "Forbidden")
    return appt


@router.patch("/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: str, body: RescheduleRequest, user=Depends(get_user_role)):
    appt_res = supabase.from_("appointments").select("patient_id, status") \
        .eq("id", appointment_id).limit(1).execute()
    if not appt_res.data:
        raise HTTPException(404, "Appointment not found")
    appt = appt_res.data[0]
    if appt["status"] not in ["pending", "confirmed"]:
        raise HTTPException(400, "Cannot reschedule a cancelled or completed appointment")
    if user["role"] == "patient":
        patient_id = _get_patient_id(user["id"])
        if appt["patient_id"] != patient_id:
            raise HTTPException(403, "Forbidden")
    if _is_leave_day(str(body.date)):
        raise HTTPException(400, "Doctor is unavailable on this date")
    conflict = supabase.from_("appointments").select("id") \
        .eq("date", str(body.date)).eq("time_slot", body.time_slot) \
        .neq("status", "cancelled").neq("id", appointment_id) \
        .limit(1).execute()
    if conflict.data:
        raise HTTPException(400, "This slot is already booked")
    supabase.from_("appointments").update({
        "date": str(body.date),
        "time_slot": body.time_slot,
    }).eq("id", appointment_id).execute()
    logger.info("Appointment rescheduled: %s by %s", appointment_id, user["id"])
    return {"rescheduled": True}


@router.patch("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, user=Depends(get_user_role)):
    if user["role"] == "patient":
        patient_id = _get_patient_id(user["id"])
        appt_res = supabase.from_("appointments").select("patient_id, status") \
            .eq("id", appointment_id).limit(1).execute()
        if not appt_res.data:
            raise HTTPException(404, "Appointment not found")
        appt = appt_res.data[0]
        if appt["patient_id"] != patient_id:
            raise HTTPException(403, "Forbidden")
        if appt["status"] == "cancelled":
            raise HTTPException(400, "Already cancelled")
    supabase.from_("appointments").update({"status": "cancelled"}) \
        .eq("id", appointment_id).execute()
    logger.info("Appointment cancelled: %s by %s", appointment_id, user["id"])
    return {"status": "cancelled"}


@router.get("/{appointment_id}/op-slip.pdf")
def download_op_slip(appointment_id: str, user=Depends(get_user_role)):
    res = supabase.from_("appointments").select(
        "*, patients(*), op_records(*), payments(*)"
    ).eq("id", appointment_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Appointment not found")
    appt = res.data[0]
    if user["role"] == "patient":
        patient_id = _get_patient_id(user["id"])
        if appt["patient_id"] != patient_id:
            raise HTTPException(403, "Forbidden")
    _opr = appt.get("op_records") or {}
    op = _opr[0] if isinstance(_opr, list) else _opr
    if not op or not op.get("op_number"):
        raise HTTPException(400, "OP number not yet generated for this appointment")
    pdf_bytes = _build_op_pdf(appt)
    op_number = op["op_number"]
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{op_number}.pdf"'},
    )
