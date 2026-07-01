from fastapi import APIRouter, Depends
from ..database import supabase
from ..auth import require_admin
import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
def get_analytics(user=Depends(require_admin)):
    today = datetime.date.today().isoformat()
    month_start = datetime.date.today().replace(day=1).isoformat()
    week_ago = (datetime.date.today() - datetime.timedelta(days=6)).isoformat()

    today_appts = supabase.from_("appointments").select("id, status") \
        .eq("date", today).execute()
    month_appts = supabase.from_("appointments").select("id, status") \
        .gte("date", month_start).execute()
    payments = supabase.from_("payments").select("amount, status, created_at") \
        .gte("created_at", f"{month_start}T00:00:00").execute()
    ops = supabase.from_("op_records").select("id") \
        .gte("created_at", f"{week_ago}T00:00:00").execute()

    daily_revenue: dict = {}
    for i in range(6, -1, -1):
        d = (datetime.date.today() - datetime.timedelta(days=i)).isoformat()
        daily_revenue[d] = 0
    for p in payments.data:
        d = p["created_at"][:10]
        if d in daily_revenue and p["status"] == "paid":
            daily_revenue[d] += p.get("amount", 0) or 0

    total_revenue = sum(p.get("amount", 0) or 0 for p in payments.data if p["status"] == "paid")

    status_counts: dict = {}
    for a in month_appts.data:
        status_counts[a["status"]] = status_counts.get(a["status"], 0) + 1

    payment_counts: dict = {}
    for p in payments.data:
        payment_counts[p["status"]] = payment_counts.get(p["status"], 0) + 1

    return {
        "today_count": len(today_appts.data),
        "month_count": len(month_appts.data),
        "total_revenue": total_revenue,
        "op_count": len(ops.data),
        "revenue_chart": [{"date": k, "revenue": v} for k, v in daily_revenue.items()],
        "status_breakdown": [{"name": k.capitalize(), "value": v} for k, v in status_counts.items()],
        "payment_breakdown": [{"name": k.capitalize(), "value": v} for k, v in payment_counts.items()],
    }
