from fastapi import APIRouter, Depends
import datetime
from ..database import supabase
from ..auth import require_admin
from ..models.schemas import UpdateQueueStatusRequest

router = APIRouter(prefix="/queue", tags=["queue"])

@router.get("/")
def get_queue(date: str = None, user=Depends(require_admin)):
    target = date or datetime.date.today().isoformat()
    res = supabase.from_("op_records").select("*, appointments!inner(*, patients(*))") \
        .eq("appointments.date", target).neq("appointments.status", "cancelled").order("token_number").execute()
    return res.data

@router.patch("/status")
def update_queue_status(body: UpdateQueueStatusRequest, user=Depends(require_admin)):
    res = supabase.from_("op_records").update({"queue_status": body.status}) \
        .eq("id", body.op_id).execute()
    return res.data[0]
