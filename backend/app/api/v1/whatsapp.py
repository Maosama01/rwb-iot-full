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

    if body in ["YES", "हाँ", "हा", "HAA", "HAN", "HAAN"]:
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
