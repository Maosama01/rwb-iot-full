"""
app/api/v1/marketplace.py
─────────────────────────
Endpoints for the marketplace screen (exchanges).
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select, func

from twilio.rest import Client

from app.api.deps import DbSession, CurrentUser
from app.db.models.exchange import Exchange
from app.db.models.marketplace_offer import MarketplaceOffer
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/marketplace", tags=["marketplace"])
settings = get_settings()

class ExchangeRequest(BaseModel):
    vendor_phone: str
    vendor_name: str
    compost_amount: str
    reward_type: str
    action_type: str
    vendor_type: str

@router.get("/offers")
async def get_offers(db: DbSession):
    """Get all active marketplace offers."""
    result = await db.execute(
        select(MarketplaceOffer)
        .where(MarketplaceOffer.is_active == True)
        .order_by(MarketplaceOffer.created_at.desc())
    )
    offers = result.scalars().all()
    
    import random
    colors = ['#D2691E', '#2E8B57', '#4682B4', '#8B4513']
    
    return {
        "offers": [
            {
                "id": str(o.id),
                "nurseryName": o.vendor_name,
                "vendorPhone": o.vendor_phone,
                "plantOffered": o.plant_offered,
                "compostRequired": o.compost_required,
                "distance": f"{random.uniform(0.5, 3.5):.1f} km away",
                "timeEst": "5 mins drive" if o.action_type == "drop_off" else "Moving",
                "availableSlots": ["Today 4PM-6PM", "Tomorrow 10AM-12PM"],
                "imageColor": random.choice(colors),
                "actionType": o.action_type,
                "vendorType": o.vendor_type,
                "rewardType": o.reward_type,
                "validUntil": "Today 6:00 PM"
            }
            for o in offers
        ]
    }

@router.get("/exchanges/count")
async def get_exchanges_count(db: DbSession, current_user: CurrentUser):
    """Get the number of completed or accepted exchanges for the user."""
    result = await db.execute(
        select(func.count(Exchange.id))
        .where(Exchange.user_id == current_user.id)
        .where(Exchange.status.in_(["accepted", "completed"]))
    )
    count = result.scalar() or 0
    return {"count": count}

@router.get("/exchanges/me")
async def get_my_exchanges(db: DbSession, current_user: CurrentUser):
    """Get all exchanges for the current user."""
    result = await db.execute(
        select(Exchange)
        .where(Exchange.user_id == current_user.id)
        .order_by(Exchange.created_at.desc())
    )
    exchanges = result.scalars().all()
    return {
        "exchanges": [
            {
                "id": str(e.id),
                "vendor_name": e.vendor_name,
                "status": e.status,
                "compost_amount": e.compost_amount,
                "reward_type": e.reward_type,
                "action_type": e.action_type,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in exchanges
        ]
    }

@router.post("/exchanges")
async def create_exchange(
    req: ExchangeRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Create a new exchange and notify the vendor via WhatsApp."""
    exchange = Exchange(
        user_id=current_user.id,
        vendor_phone=req.vendor_phone,
        vendor_name=req.vendor_name,
        compost_amount=req.compost_amount,
        reward_type=req.reward_type,
        action_type=req.action_type,
        vendor_type=req.vendor_type,
        status="pending"
    )
    db.add(exchange)
    await db.commit()
    await db.refresh(exchange)

    # Attempt to send WhatsApp message if Twilio is configured
    twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
    twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
    twilio_phone = getattr(settings, "TWILIO_FROM_NUMBER", "+14155238886")

    if twilio_sid and twilio_token:
        try:
            client = Client(twilio_sid, twilio_token)
            action_en = "pick-up" if req.action_type == "pick_up" else "drop-off"
            action_hi = "पिक-अप" if req.action_type == "pick_up" else "ड्रॉप-ऑफ़"
            
            reward_hi_map = {
                "plant": "पौधा",
                "seeds": "बीज",
                "discount": "50 रुपये की छूट"
            }
            reward_hi = reward_hi_map.get(req.reward_type, req.reward_type)
            
            msg_body = (
                f"New {action_en} request from {current_user.display_name} "
                f"for {req.compost_amount} of compost.\n"
                f"Reward: {req.reward_type}.\n"
                f"Reply YES to accept.\n\n"
                f"───\n\n"
                f"नमस्ते! {current_user.display_name} ने {req.compost_amount} खाद के लिए {action_hi} का अनुरोध किया है।\n"
                f"बदले में: {reward_hi}।\n"
                f"स्वीकार करने के लिए 'हाँ' या 'YES' रिप्लाई करें।"
            )
            client.messages.create(
                body=msg_body,
                from_=f"whatsapp:{twilio_phone}",
                to=f"whatsapp:{req.vendor_phone}"
            )
        except Exception as e:
            logger.error("Failed to send WhatsApp message", exc_info=True)

    return {"status": "success", "exchange_id": str(exchange.id)}
