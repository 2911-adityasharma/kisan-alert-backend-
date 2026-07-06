"""
Vision service — crop disease/pest/nutrient diagnosis using Gemini vision model.

Flow:
1. Download the image from a Twilio media URL using Basic Auth
   (Twilio credentials are required to fetch media stored on their servers).
2. Base64-encode the raw bytes and submit to Gemini together with a
   structured diagnostic prompt.
3. Return the model's plain-text response (3-4 sentences, in the target language).

The function is deliberately synchronous at the HTTP download layer so it can be
awaited from an async FastAPI route without spawning extra threads.
"""

import base64
import logging
from typing import Optional

import httpx
from google import genai
from google.genai import types as genai_types

from app.config import settings

logger = logging.getLogger(__name__)

# Gemini vision-capable model
VISION_MODEL = "gemini-2.5-flash"

# Diagnosis prompt template — filled with the target language at call time
_PROMPT_TEMPLATE = """You are an expert agricultural scientist specialising in crop health for small Indian farms.

A farmer has sent you a photo of their crop. Carefully examine the image and:
1. Identify any visible pest damage, fungal/bacterial disease, or nutrient deficiency symptoms.
2. State the most likely cause (be specific — e.g. "early blight caused by Alternaria solani").
3. Suggest 1-2 immediate practical actions the farmer can take using locally available inputs.
4. Mention any urgent warning signs (e.g. if the issue can spread quickly).

Keep your response to 3-4 sentences. Write entirely in {language_name}. 
Do NOT use markdown, bullet points, or headers — plain conversational text only.
"""

_LANGUAGE_NAMES = {
    "te": "Telugu",
    "hi": "Hindi",
    "en": "English",
}


async def diagnose_photo(image_url: str, language: str = "te") -> str:
    """
    Download a crop photo from a Twilio media URL and run Gemini Vision
    disease/pest/nutrient diagnosis on it.

    Args:
        image_url: The Twilio MediaUrl0 value (requires Basic Auth to fetch).
        language:  ISO 639-1 code for the response language — 'te', 'hi', or 'en'.

    Returns:
        Plain-text diagnostic response from Gemini (3-4 sentences in the
        target language), or a safe error string if anything fails so the
        webhook can still respond gracefully.
    """
    # ── 1. Download the image ──────────────────────────────────────────────
    image_bytes: Optional[bytes] = None
    mime_type: str = "image/jpeg"

    try:
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token  = settings.TWILIO_AUTH_TOKEN

        if not account_sid or not auth_token:
            logger.error("Twilio credentials missing — cannot download media.")
            return _fallback_message(language)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                image_url,
                auth=(account_sid, auth_token),
                follow_redirects=True,
            )
            response.raise_for_status()
            image_bytes = response.content
            content_type = response.headers.get("content-type", "image/jpeg")
            # Strip parameters like "; charset=utf-8"
            mime_type = content_type.split(";")[0].strip() or "image/jpeg"

        logger.info(
            "Downloaded media from Twilio: %d bytes, mime=%s", len(image_bytes), mime_type
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s while downloading media from %s: %s",
            exc.response.status_code, image_url, exc.response.text,
        )
        return _fallback_message(language)
    except httpx.RequestError as exc:
        logger.error("Network error downloading media from %s: %s", image_url, exc)
        return _fallback_message(language)
    except Exception as exc:
        logger.error("Unexpected error downloading media: %s", exc, exc_info=True)
        return _fallback_message(language)

    # ── 2. Build Gemini prompt ─────────────────────────────────────────────
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not set — cannot run vision diagnosis.")
        return _fallback_message(language)

    language_name = _LANGUAGE_NAMES.get(language, "English")
    prompt_text   = _PROMPT_TEMPLATE.format(language_name=language_name)

    # Encode the raw bytes as a Gemini inline image part
    image_b64  = base64.standard_b64encode(image_bytes).decode("utf-8")
    image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    text_part  = genai_types.Part.from_text(text=prompt_text)

    # ── 3. Call Gemini Vision ──────────────────────────────────────────────
    try:
        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model    = VISION_MODEL,
            contents = genai_types.Content(parts=[image_part, text_part], role="user"),
            config   = genai_types.GenerateContentConfig(
                temperature = 0.2,   # Low temperature for factual diagnosis
                top_p       = 0.9,
            ),
        )
        diagnosis = (response.text or "").strip()
        if not diagnosis:
            logger.warning("Gemini returned an empty diagnosis response.")
            return _fallback_message(language)

        logger.info("Gemini vision diagnosis completed (%d chars).", len(diagnosis))
        return diagnosis

    except Exception as exc:
        logger.error("Gemini Vision API error: %s", exc, exc_info=True)
        return _fallback_message(language)


def _fallback_message(language: str) -> str:
    """Return a user-friendly error string in the farmer's language."""
    messages = {
        "te": "మీ పంట ఫోటో చేరింది, కానీ విశ్లేషణలో లోపం వచ్చింది. వ్యవసాయ అధికారి త్వరలో సమీక్షిస్తారు.",
        "hi": "आपकी फसल की फोटो मिल गई, लेकिन विश्लेषण में कोई समस्या आई। कृषि अधिकारी जल्द समीक्षा करेंगे।",
        "en": "Your crop photo was received, but analysis encountered an issue. An agriculture officer will review it shortly.",
    }
    return messages.get(language, messages["en"])


# ── Module-level singleton ─────────────────────────────────────────────────────
class VisionService:
    """Service to analyze crop images using Gemini Vision model for disease detection."""

    async def analyze_crop_image(self, image_url: str, language: str = "te") -> str:
        """
        Analyze a crop image using Gemini Vision and return a plain-text diagnosis.
        Delegates to the module-level diagnose_photo function.
        """
        return await diagnose_photo(image_url, language)
