from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List

ENV_FILE = Path(__file__).parent.parent / ".env"

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5180"

    def get_allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = str(ENV_FILE)

settings = Settings()
