from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import date as date_type

VALID_TIME_SLOTS = {
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00",
}

class BookAppointmentRequest(BaseModel):
    date: date_type
    time_slot: str
    payment_method: Literal["online"]
    amount: float = 500

    @field_validator("date")
    @classmethod
    def date_not_past(cls, v):
        if v < date_type.today():
            raise ValueError("Cannot book an appointment in the past")
        return v

    @field_validator("time_slot")
    @classmethod
    def valid_slot(cls, v):
        if v not in VALID_TIME_SLOTS:
            raise ValueError(f"Invalid time slot: {v}")
        return v

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0 or v > 50000:
            raise ValueError("Amount must be between 1 and 50000")
        return v


class ConfirmAppointmentRequest(BaseModel):
    appointment_id: str


class UpdateQueueStatusRequest(BaseModel):
    op_id: str
    status: Literal["waiting", "in_progress", "completed"]


class AddMedicalRecordRequest(BaseModel):
    patient_id: str
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    appointment_id: Optional[str] = None



class UpdatePatientRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Literal["male", "female", "other"]] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip() if v else v

    @field_validator("age")
    @classmethod
    def valid_age(cls, v):
        if v is not None and not (1 <= v <= 120):
            raise ValueError("Age must be between 1 and 120")
        return v
