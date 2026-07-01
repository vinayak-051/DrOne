import time
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import settings
from .database import supabase
from .logger import logger

bearer = HTTPBearer()

_jwks_cache: dict = {}
_jwks_loaded_at: float = 0
_JWKS_TTL = 3600  # 1 hour

def _load_jwks(force: bool = False) -> dict:
    global _jwks_loaded_at
    now = time.time()
    if not force and _jwks_cache and (now - _jwks_loaded_at) < _JWKS_TTL:
        return _jwks_cache
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(url, timeout=5)
    resp.raise_for_status()
    _jwks_cache.clear()
    for key in resp.json().get("keys", []):
        _jwks_cache[key["kid"]] = key
    _jwks_loaded_at = now
    logger.info("JWKS refreshed (%d keys)", len(_jwks_cache))
    return _jwks_cache


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "HS256")

        if kid:
            jwks = _load_jwks()
            if kid not in jwks:
                jwks = _load_jwks(force=True)
            public_key = jwks.get(kid)
            if not public_key:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown key id")
            payload = jwt.decode(token, public_key, algorithms=[alg], options={"verify_aud": False})
        else:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"id": user_id, "email": payload.get("email", "")}
    except JWTError as e:
        logger.warning("JWT validation failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_user_role(user=Depends(get_current_user)):
    res = supabase.from_("users").select("role").eq("id", user["id"]).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="User profile not found")
    return {**user, "role": res.data[0]["role"]}

def require_admin(user=Depends(get_user_role)):
    if user["role"] != "admin":
        logger.warning("Non-admin access attempt by user %s", user["id"])
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_patient(user=Depends(get_user_role)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patient access required")
    return user
