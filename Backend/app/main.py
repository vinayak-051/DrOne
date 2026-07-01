from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .routers import appointments, patients, queue, medical_records, analytics, leaves, payments
from .config import settings
from .logger import logger

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="DrOne API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred"})

app.include_router(appointments.router)
app.include_router(patients.router)
app.include_router(queue.router)
app.include_router(medical_records.router)
app.include_router(analytics.router)
app.include_router(leaves.router)
app.include_router(payments.router)

@app.on_event("startup")
def startup():
    logger.info("DrOne API started")

@app.get("/health")
def health():
    return {"status": "ok"}
