import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from google import genai
from google.genai import types as genai_types

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Kisan Dost AI Chat"])

GEMINI_MODEL = "gemini-2.5-flash"

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    text: str = Field(..., description="content of the message")

class ChatRequest(BaseModel):
    message: str = Field(..., description="the user's message query")
    language: str = Field("te", description="ISO 639-1 code ('te', 'hi', or 'en')")
    history: Optional[List[ChatMessage]] = Field(default=None, description="previous chat context")

_LANG_NAMES = {
    "te": "Telugu",
    "hi": "Hindi",
    "en": "English"
}

_SYSTEM_PROMPT = """You are Kisan Dost (किसान दोस्त / కిసాన్ దోస్త్), a wise, practical, and highly friendly agricultural AI assistant designed by the Ministry of Agriculture, Govt. of India.
Your mission is to help Indian smallholder farmers with their everyday agricultural questions:
1. Provide accurate, practical crop advice, disease management solutions, fertilizer/pesticide dosage, and irrigation schedules.
2. Recommend locally available, cost-effective inputs (e.g. neem cake, organic manure, specific standard chemical percentages).
3. If they ask about weather or schemes, explain things clearly and simply.
4. Keep your responses short (under 4-5 sentences), warm, and supportive.
5. Use easy-to-understand conversational language. Avoid overly complex technical jargon.

Write your response entirely in {language_name}. Do NOT use markdown code blocks or bullet points — write in clear paragraphs so it reads well on a phone screen.
"""

@router.post("", summary="Chat with Kisan Dost AI assistant")
async def chat_with_assistant(body: ChatRequest):
    """
    Sends the user's message alongside the system prompt to Gemini 2.5 Flash 
    and returns a conversational response in the target language.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not set.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not configured."
        )

    lang_name = _LANG_NAMES.get(body.language, "English")
    system_instruction = _SYSTEM_PROMPT.format(language_name=lang_name)
    
    # Format chat history for Gemini if present
    contents = []
    if body.history:
        for msg in body.history:
            role = "user" if msg.role == "user" else "model"
            contents.append(genai_types.Content(
                parts=[genai_types.Part.from_text(text=msg.text)],
                role=role
            ))
            
    # Append the current query
    contents.append(genai_types.Content(
        parts=[genai_types.Part.from_text(text=body.message)],
        role="user"
    ))

    logger.info("Sending chat query to Gemini in language: %s", lang_name)
    
    try:
        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
                top_p=0.9
            )
        )
        ai_reply = (response.text or "").strip()
        if not ai_reply:
            raise Exception("Empty response from Gemini")
            
        return {
            "success": True,
            "text": ai_reply
        }
        
    except Exception as exc:
        logger.error("Gemini Chat error: %s", exc, exc_info=True)
        # Structured friendly fallback
        fallbacks = {
            "te": "క్షమించండి, ప్రస్తుతం నేను సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి కొద్దిసేపట్లో మళ్ళీ ప్రయత్నించండి.",
            "hi": "क्षमा करें, मैं इस समय उत्तर देने में असमर्थ हूँ। कृपया कुछ देर बाद फिर से प्रयास करें।",
            "en": "Sorry, I am unable to reply at this moment. Please try again shortly."
        }
        return {
            "success": True,
            "text": fallbacks.get(body.language, fallbacks["en"])
        }
