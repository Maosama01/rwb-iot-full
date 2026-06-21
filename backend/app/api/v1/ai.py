import os
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.services import device_access
from sqlalchemy import select
from app.db.models.sensor_reading import SensorReading

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
        "Use the provided telemetry context to give personalized advice."
    )
    
    api_key = os.environ.get("GEMINI_API_KEY")
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
