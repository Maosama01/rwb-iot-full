import os
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.services import device_access
from sqlalchemy import select
from app.db.models.sensor_reading import SensorReading
from app.core.config import get_settings

settings = get_settings()

try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class AskRequest(BaseModel):
    device_id: uuid.UUID
    question: str

class AskResponse(BaseModel):
    answer: str

@router.post("/ask", response_model=AskResponse)
async def ask_assistant(
    req: AskRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> AskResponse:
    await device_access.assert_device_member(db, req.device_id, current_user.id)
    
    # Fetch recent telemetry context
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.device_id == req.device_id)
        .order_by(SensorReading.time.desc())
        .limit(1)
    )
    latest = result.scalars().first()
    
    context = "No telemetry data available yet."
    if latest:
        context = (
            f"Current Device Telemetry:\n"
            f"- Temperature: {latest.temperature_c}°C\n"
            f"- Humidity: {latest.humidity_pct}%\n"
            f"- CO2: {latest.co2_ppm} ppm\n"
            f"- pH Level: {latest.ph_level}\n"
        )
        
    system_instruction = (
        "You are 'Rawbin AI', an expert eco-composting assistant. "
        "You help users optimize their smart composter health. "
        "Keep your answers concise, practical, and conversational. "
        "Use the provided telemetry context to give personalized advice. "
        "Important rules on what can be put in the Rawbin: "
        "Users CAN put: fruit and veggie scraps, coffee grounds, eggshells, grains, and YES, they CAN put dairy products (like cheese or milk, though in moderation to avoid smell if it's too wet). "
        "Users CANNOT put: large bones, metal, plastic, glass, pet waste, or synthetic materials. "
        "CRITICAL: Understand and seamlessly process Hindi/Indian dish and vegetable names written in English (Hinglish) such as palak, bhindi, paneer, roti, dal, sabzi, karela, etc. Treat them just like their English equivalents. "
        "SPELLING TOLERANCE: Be extremely forgiving with spelling mistakes. If a user misspells a food name (e.g., 'majhli' instead of 'machhli', 'panir' instead of 'paneer'), infer the most likely food item they meant and answer based on that. "
        "When asked if an item can be composted, quickly say yes or no, and provide a short tip."
    )
    
    api_key = settings.GEMINI_API_KEY
    if not has_genai or not api_key:
        # Mock fallback
        return AskResponse(answer=f"If I had an API key, I'd say: Based on your current temp ({latest.temperature_c if latest else 'unknown'}°C), your compost is looking great! (Provide GEMINI_API_KEY to enable real AI)")
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"{context}\n\nUser Question: {req.question}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )
        
        return AskResponse(answer=response.text or "I'm not sure how to answer that.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
