from fastapi import APIRouter, Depends, Query, HTTPException
from ..database import supabase
from ..auth import get_user_role, require_admin
from ..models.schemas import UpdatePatientRequest

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/me")
def get_my_patient(user=Depends(get_user_role)):
    res = supabase.from_("patients").select("*").eq("user_id", user["id"]).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Patient profile not found")
    return res.data[0]

@router.patch("/me")
def update_my_patient(body: UpdatePatientRequest, user=Depends(get_user_role)):
    patient = supabase.from_("patients").select("id").eq("user_id", user["id"]).limit(1).execute()
    if not patient.data:
        raise HTTPException(404, "Patient profile not found")
    res = supabase.from_("patients").update(body.model_dump(exclude_none=True)) \
        .eq("id", patient.data[0]["id"]).execute()
    return res.data[0]

@router.get("/")
def get_all_patients(user=Depends(require_admin)):
    res = supabase.from_("patients").select("*").order("name").execute()
    return res.data

@router.get("/search")
def search_patients(q: str = Query(..., min_length=2), user=Depends(require_admin)):
    res = supabase.from_("patients").select("*, appointments(*, op_records(*))") \
        .or_(f"name.ilike.%{q}%,phone.ilike.%{q}%").limit(20).execute()

    op_res = supabase.from_("op_records").select("*, appointments(*, patients(*))") \
        .ilike("op_number", f"%{q}%").execute()
    op_patients = [r["appointments"]["patients"] for r in op_res.data
                   if r.get("appointments") and r["appointments"].get("patients")]

    combined = res.data + op_patients
    seen, unique = set(), []
    for p in combined:
        if p and p["id"] not in seen:
            seen.add(p["id"])
            unique.append(p)
    return unique
