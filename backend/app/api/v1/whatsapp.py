"""
app/api/v1/whatsapp.py
──────────────────────
Twilio WhatsApp Webhook endpoint.
"""
from fastapi import APIRouter, Request, Response
from sqlalchemy import select
from twilio.twiml.messaging_response import MessagingResponse

import logging
from app.api.deps import DbSession
from app.db.models.exchange import Exchange
from app.db.models.user import User
from app.core.firebase import get_firebase_app

try:
    from firebase_admin import messaging
except ImportError:
    messaging = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

@router.post("/webhook")
async def twilio_whatsapp_webhook(request: Request, db: DbSession):
    """
    Receives incoming WhatsApp messages from Twilio.
    """
    form_data = await request.form()
    from_number = form_data.get("From", "")
    body = form_data.get("Body", "").strip().upper()

    if from_number.startswith("whatsapp:"):
        phone = from_number.replace("whatsapp:", "")
    else:
        phone = from_number

    resp = MessagingResponse()
    msg = resp.message()

    import re
    from app.db.models.marketplace_offer import MarketplaceOffer

    if body.startswith("OFFER"):
        # Expected format: OFFER <compost> FOR <reward> TYPE <action_type>
        # Example: OFFER 5kg FOR seeds TYPE drop_off
        match = re.search(r"OFFER\s+(.+?)\s+FOR\s+(.+?)\s+TYPE\s+(PICK_UP|DROP_OFF|PICKUP|DROPOFF)", body, re.IGNORECASE)
        if match:
            compost_req, reward, action_type_raw = match.groups()
            action_type_raw = action_type_raw.upper()
            action_type = "pick_up" if "PICK" in action_type_raw else "drop_off"
            
            offer = MarketplaceOffer(
                vendor_phone=phone,
                vendor_name="WhatsApp Vendor",
                vendor_type="nursery",
                action_type=action_type,
                reward_type=reward.lower(),
                compost_required=compost_req,
                plant_offered=reward,
                is_active=True
            )
            db.add(offer)
            await db.commit()
            msg.body(f"Offer created! You are offering {reward} for {compost_req} via {action_type.replace('_', ' ')}.")
        else:
            msg.body("Invalid offer format. Please use: OFFER <compost_amount> FOR <reward> TYPE <pick_up|drop_off>. Example: OFFER 5kg FOR seeds TYPE pick_up")

    elif body in ["YES", "हाँ", "हा", "HAA", "HAN", "HAAN"]:
        # Find the most recent pending exchange for this vendor
        result = await db.execute(
            select(Exchange)
            .where(Exchange.vendor_phone == phone)
            .where(Exchange.status == "pending")
            .order_by(Exchange.created_at.desc())
        )
        exchange = result.scalars().first()
        if exchange:
            exchange.status = "accepted"
            await db.commit()
            msg.body("Exchange accepted! The user has been notified.")
            
            # Send Push Notification to User
            user_result = await db.execute(select(User).where(User.id == exchange.user_id))
            user = user_result.scalars().first()
            if user and user.firebase_push_token:
                fb_app = get_firebase_app()
                if fb_app and messaging:
                    try:
                        message = messaging.Message(
                            notification=messaging.Notification(
                                title="✅ Request Accepted!",
                                body=f"{exchange.vendor_name} accepted your {exchange.action_type.replace('_', '-')} request."
                            ),
                            token=user.firebase_push_token,
                        )
                        messaging.send(message, app=fb_app)
                        logger.info("Sent push notification to user", extra={"user_id": str(user.id)})
                    except Exception as e:
                        logger.error("Failed to send push notification", exc_info=True)
            
        else:
            msg.body("We couldn't find any pending exchanges for you right now.")
    else:
        msg.body("I didn't understand that. Please reply YES to accept a pending exchange request.")

    return Response(content=str(resp), media_type="application/xml")
