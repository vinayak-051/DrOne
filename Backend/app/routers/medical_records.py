import mimetypes
import time
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from ..database import supabase
from ..auth import get_user_role, require_admin
from ..models.schemas import AddMedicalRecordRequest
from ..logger import logger

router = APIRouter(prefix="/medical", tags=["medical"])

ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def _assert_patient_access(user: dict, patient_id: str):
    if user["role"] == "patient":
        res = supabase.from_("patients").select("id").eq("user_id", user["id"]).limit(1).execute()
        if not res.data or res.data[0]["id"] != patient_id:
            raise HTTPException(403, "Forbidden")


@router.get("/records/{patient_id}")
def get_records(patient_id: str, user=Depends(get_user_role)):
    _assert_patient_access(user, patient_id)
    res = supabase.from_("medical_records").select("*") \
        .eq("patient_id", patient_id).order("created_at", desc=True).execute()
    return res.data


@router.get("/reports/{patient_id}")
def get_reports(patient_id: str, user=Depends(get_user_role)):
    _assert_patient_access(user, patient_id)
    res = supabase.from_("reports").select("*") \
        .eq("patient_id", patient_id).order("created_at", desc=True).execute()
    return res.data


@router.post("/records")
def add_record(body: AddMedicalRecordRequest, user=Depends(require_admin)):
    res = supabase.from_("medical_records").insert(body.model_dump(exclude_none=True)).execute()
    logger.info("Medical record added for patient %s by admin %s", body.patient_id, user["id"])
    return res.data[0]


@router.post("/reports/upload")
async def upload_report(
    patient_id: str = Form(...),
    category: str = Form("other"),
    file: UploadFile = File(...),
    user=Depends(require_admin),
):
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 10 MB)")

    mime = file.content_type or mimetypes.guess_type(file.filename)[0] or ""
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"File type not allowed: {mime}")

    ext = mimetypes.guess_extension(mime) or f".{file.filename.rsplit('.', 1)[-1]}"
    path = f"{patient_id}/{int(time.time())}{ext}"

    try:
        supabase.storage.from_("reports").upload(path, contents, {"content-type": mime})
        public_url = supabase.storage.from_("reports").get_public_url(path)
        res = supabase.from_("reports").insert({
            "patient_id": patient_id,
            "file_url": public_url,
            "file_name": file.filename,
            "uploaded_by": user["id"],
            "category": category,
        }).execute()
    except Exception as e:
        logger.error("Report upload failed for patient %s: %s", patient_id, e)
        raise HTTPException(500, "Upload failed, please try again")

    logger.info("Report uploaded for patient %s by admin %s", patient_id, user["id"])
    return res.data[0]
