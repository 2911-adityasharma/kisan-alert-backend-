import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.db import (
    get_farmer_by_phone,
    create_farmer,
    create_plot,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SendOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")

class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")
    otp: str = Field(..., description="6-digit OTP code")

class RegisterFarmerRequest(BaseModel):
    phone: str
    name: str
    village_id: str
    language: str = "te"
    lat: float = 17.3850
    lng: float = 78.4867
    crop_current: str = "None"
    plot_size: Optional[float] = None
    soil_data_ref: Optional[str] = None


@router.post("/otp/send", summary="Request OTP code")
async def send_otp(body: SendOtpRequest):
    """
    Simulates sending OTP code. Returns success.
    In demo mode, OTP is always '123456'.
    """
    phone = body.phone.strip().replace(" ", "").replace("-", "")
    if len(phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid phone number. Must be at least 10 digits."
        )
    
    logger.info("Sending OTP verification code to phone number: %s", phone)
    # In production, integrate with a real SMS gateway like Twilio SMS / MSG91.
    return {"success": True, "message": "OTP sent successfully. Use code '123456' for verification."}


@router.post("/otp/verify", summary="Verify OTP and check registration")
async def verify_otp(body: VerifyOtpRequest):
    """
    Verifies OTP and returns user info if already registered, 
    or onboarding_required status if new.
    """
    phone = body.phone.strip().replace(" ", "").replace("-", "")
    otp = body.otp.strip()
    
    if otp != "123456":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect OTP. Please try '123456' in demo mode."
        )
    
    farmer = get_farmer_by_phone(phone)
    if not farmer:
        logger.info("Phone %s verified, but no farmer record found. Onboarding required.", phone)
        return {
            "success": True,
            "onboarding_required": True,
            "phone": phone
        }
    
    logger.info("Farmer %s logged in successfully.", farmer["name"])
    return {
        "success": True,
        "onboarding_required": False,
        "farmer": farmer,
        "token": f"demo-token-{farmer['id']}"
    }


@router.post("/register", summary="Register and onboard a new farmer")
async def register_farmer(body: RegisterFarmerRequest):
    """
    Creates a new farmer profile and default plot in Firestore.
    """
    phone = body.phone.strip().replace(" ", "").replace("-", "")
    
    # Check if user already exists
    existing = get_farmer_by_phone(phone)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A farmer with this phone number is already registered."
        )
    
    # 1. Create farmer
    farmer = create_farmer(
        phone=phone,
        name=body.name.strip(),
        village_id=body.village_id.strip(),
        language=body.language
    )
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register farmer in database."
        )
    
    # 2. Update onboarding stage to active
    from app.services.db import update_farmer_onboarding
    update_farmer_onboarding(farmer["id"], stage="active")
    farmer["onboarding_stage"] = "active"

    # 3. Create plot
    soil_ref = body.soil_data_ref or f"village_default:{body.village_id}"
    plot = create_plot(
        farmer_id=farmer["id"],
        lat=body.lat,
        lng=body.lng,
        crop_current=body.crop_current,
        soil_data_ref=soil_ref
    )
    if not plot:
        logger.error("Failed to create default plot for registered farmer %s", farmer["id"])
    
    return {
        "success": True,
        "farmer": farmer,
        "plot": plot,
        "token": f"demo-token-{farmer['id']}"
    }
