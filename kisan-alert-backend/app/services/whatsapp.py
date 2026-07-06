import logging
from twilio.rest import Client
from app.config import settings

logger = logging.getLogger(__name__)


def send_whatsapp_message(to_phone: str, body: str) -> dict:
    """
    Send a WhatsApp message using the Twilio Python SDK.

    Args:
        to_phone: The recipient's phone number (with or without 'whatsapp:' prefix).
        body: The message body to send.

    Returns:
        A dictionary containing the message SID and status, or an error description.
    """
    try:
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        from_number = settings.TWILIO_WHATSAPP_NUMBER

        if not account_sid or not auth_token:
            logger.error("Twilio credentials are not set in the configuration.")
            return {"error": "Twilio credentials not configured", "status": "failed"}

        # Ensure the numbers have the 'whatsapp:' prefix
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"
            
        if not to_phone.startswith("whatsapp:"):
            to_phone = f"whatsapp:{to_phone}"

        logger.info(f"Sending WhatsApp message to {to_phone} from {from_number}")
        
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_phone
        )
        
        logger.info(f"WhatsApp message sent successfully. SID: {message.sid}")
        return {"sid": message.sid, "status": message.status}
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_phone}: {e}", exc_info=True)
        return {"error": str(e), "status": "failed"}


class WhatsAppService:
    """Service to send alerts and advisory messages to farmers via Twilio WhatsApp API."""

    async def send_message(self, recipient_number: str, message: str) -> dict:
        """
        Send a WhatsApp message to a farmer's phone number using Twilio Client.
        """
        return send_whatsapp_message(recipient_number, message)
