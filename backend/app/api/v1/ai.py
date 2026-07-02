import os
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.services import device_access
from sqlalchemy import select, func
from app.db.models.sensor_reading import SensorReading
from app.db.models.compost_item_cache import CompostItemCache
from app.core.config import get_settings

settings = get_settings()

try:
    from google import genai
    from google.genai import types
    import base64
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

class CheckItemRequest(BaseModel):
    item_name: str

class CheckItemResponse(BaseModel):
    compostable: bool
    category: str
    title: str
    description: str
    tips: list[str]

@router.post("/check-item", response_model=CheckItemResponse)
async def check_item(
    req: CheckItemRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> CheckItemResponse:
    """Check if an item is compostable using Gemini, returning structured JSON."""
    
    # 1. Check Hybrid Cache
    item_name_lower = req.item_name.strip().lower()
    result = await db.execute(
        select(CompostItemCache).where(func.lower(CompostItemCache.item_name) == item_name_lower)
    )
    cached_item = result.scalars().first()
    
    if cached_item:
        return CheckItemResponse(
            compostable=cached_item.compostable,
            category=cached_item.category,
            title=cached_item.title,
            description=cached_item.description,
            tips=cached_item.tips
        )
    
    system_instruction = (
        "You are 'Rawbin AI', an expert eco-composting assistant. "
        "The user will provide a food or waste item (in English, Hindi, Spanish, or a misspelling). "
        "Determine if it is compostable in a home composter. "
        "Rules: "
        "- Yes: fruit/veggie scraps, coffee grounds, eggshells, grains, dairy (cheese/milk). "
        "- No: large bones, metal, plastic, glass, pet waste, synthetic materials. "
        "Output ONLY a valid JSON object exactly matching this schema: "
        "{"
        "  \"compostable\": boolean,"
        "  \"category\": \"greens\" | \"browns\" | \"no\","
        "  \"title\": \"Short Title (e.g. Banana Peels)\","
        "  \"description\": \"1 sentence explaining why\","
        "  \"tips\": [\"Tip 1\", \"Tip 2\"]"
        "}"
    )

    api_key = settings.GEMINI_API_KEY
    if not has_genai or not api_key:
        # Mock fallback and Cache it for testing!
        data = {
            "compostable": True,
            "category": "greens",
            "title": f"{req.item_name} (Mock)",
            "description": "Since the API key is missing, I am assuming this is compostable.",
            "tips": ["Add some browns", "Mock tip"]
        }
        
        new_cache = CompostItemCache(
            item_name=item_name_lower,
            compostable=data["compostable"],
            category=data["category"],
            title=data["title"],
            description=data["description"],
            tips=data["tips"]
        )
        db.add(new_cache)
        await db.commit()
        
        return CheckItemResponse(**data)

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=req.item_name,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        import json
        data = json.loads(response.text)
        
        # 2. Save to Hybrid Cache
        new_cache = CompostItemCache(
            item_name=item_name_lower,
            compostable=data["compostable"],
            category=data["category"],
            title=data["title"],
            description=data["description"],
            tips=data["tips"]
        )
        db.add(new_cache)
        await db.commit()
        
        return CheckItemResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CheckItemVoiceRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/mp4"

@router.post("/check-item-voice", response_model=CheckItemResponse)
async def check_item_voice(
    req: CheckItemVoiceRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> CheckItemResponse:
    """Check if an item spoken in an audio file is compostable."""
    system_instruction = (
        "You are 'Rawbin AI', an expert eco-composting assistant. "
        "Listen to the audio. The user will speak the name of a food or waste item (in English, Hindi, or any Indian regional language). "
        "Transcribe the food item they spoke, and then determine if it is compostable in a home composter. "
        "Rules: "
        "- Yes: fruit/veggie scraps, coffee grounds, eggshells, grains, dairy (cheese/milk). "
        "- No: large bones, metal, plastic, glass, pet waste, synthetic materials. "
        "Output ONLY a valid JSON object exactly matching this schema: "
        "{"
        "  \"compostable\": boolean,"
        "  \"category\": \"greens\" | \"browns\" | \"no\","
        "  \"title\": \"Transcribed Food Name (e.g. Banana Peels)\","
        "  \"description\": \"1 sentence explaining why\","
        "  \"tips\": [\"Tip 1\", \"Tip 2\"]"
        "}"
    )

    api_key = settings.GEMINI_API_KEY
    if not has_genai or not api_key:
        raise HTTPException(status_code=500, detail="Gemini API is not configured.")

    try:
        client = genai.Client(api_key=api_key)
        
        # Use the mime type provided by the frontend (web=webm, native=mp4)
        mime_type = req.mime_type

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(
                    data=base64.b64decode(req.audio_base64),
                    mime_type=mime_type,
                ),
                "What food item is spoken here? Is it compostable?"
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        import json
        data = json.loads(response.text)
        
        item_name_lower = data["title"].strip().lower()
        
        # Check if it already exists to prevent UniqueViolationError
        existing = await db.execute(select(CompostItemCache).where(CompostItemCache.item_name == item_name_lower))
        if not existing.scalars().first():
            new_cache = CompostItemCache(
                item_name=item_name_lower,
                compostable=data["compostable"],
                category=data["category"],
                title=data["title"],
                description=data["description"],
                tips=data["tips"]
            )
            db.add(new_cache)
            await db.commit()
        
        return CheckItemResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ExtractIngredientsRequest(BaseModel):
    image_base64: str

@router.post("/extract-ingredients", response_model=list[str])
async def extract_ingredients(
    req: ExtractIngredientsRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> list[str]:
    """Extract ingredients from an image using Gemini."""
    system_instruction = (
        "You are an AI that only outputs a JSON array of strings. "
        "Look at the image and list the food ingredients visible. "
        "Keep the names simple and concise (e.g., 'carrots', 'milk'). "
        "Output ONLY a valid JSON array of strings, like: [\"item1\", \"item2\"]"
    )

    api_key = settings.GEMINI_API_KEY
    if not has_genai or not api_key:
        return ["mock carrot", "mock onion", "mock milk"]

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(
                    data=base64.b64decode(req.image_base64),
                    mime_type='image/jpeg',
                ),
                "What food ingredients do you see?"
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        import json
        data = json.loads(response.text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecipeIngredient(BaseModel):
    name: str

class GenerateRecipesRequest(BaseModel):
    ingredients: list[str]
    image_base64: Optional[str] = None

class RecipeResponse(BaseModel):
    title: str
    tag: str
    time: str
    servings: str
    difficulty: str
    uses_items: list[str]
    extra_items: str
    instructions: list[str]
    compost_tip: str
    youtube_link: str

@router.post("/generate-recipes", response_model=list[RecipeResponse])
async def generate_recipes(
    req: GenerateRecipesRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> list[RecipeResponse]:
    """Generate recipes from ingredients or a base64 image using Gemini, returning structured JSON."""
    system_instruction = (
        "You are 'Rawbin AI', a zero-waste culinary expert. "
        "The user will provide a list of leftover ingredients, and optionally an image of their fridge. "
        "If an image is provided, identify the ingredients in the image and add them to the list. "
        "Generate exactly 2 creative, zero-waste INDIAN recipes using these ingredients. "
        "The recipes MUST be authentic Indian cuisine (e.g. Sabzi, Curry, Dal, Paratha, etc.) that adapt the leftovers. "
        "Also provide a highly accurate YouTube search link for the recipe so they can watch a tutorial. "
        "Output ONLY a valid JSON array of objects exactly matching this schema: "
        "["
        "  {"
        "    \"title\": \"Recipe Title\","
        "    \"tag\": \"e.g. ⭐ Zero Waste Pick\","
        "    \"time\": \"e.g. 15 min\","
        "    \"servings\": \"e.g. 2 servings\","
        "    \"difficulty\": \"e.g. Easy\","
        "    \"uses_items\": [\"item 1\", \"item 2\"],"
        "    \"extra_items\": \"e.g. + olive oil + salt\","
        "    \"instructions\": [\"1. Step one\", \"2. Step two\"],"
        "    \"compost_tip\": \"1 sentence compost tip\","
        "    \"youtube_link\": \"https://www.youtube.com/results?search_query=authentic+indian+paneer+masala+recipe\""
        "  }"
        "]"
    )

    api_key = settings.GEMINI_API_KEY
    if not has_genai or not api_key:
        return [
            RecipeResponse(
                title="Mock AI Recipe",
                tag="⭐ Mock Pick",
                time="10 min",
                servings="1",
                difficulty="Easy",
                uses_items=req.ingredients[:3] if req.ingredients else ["Mock item"],
                extra_items="+ mock oil",
                instructions=["1. Mock step 1", "2. Mock step 2"],
                compost_tip="Provide GEMINI_API_KEY to get real recipes.",
                youtube_link="https://www.youtube.com"
            )
        ]

    try:
        client = genai.Client(api_key=api_key)
        
        contents = []
        if req.image_base64:
            contents.append(
                types.Part.from_bytes(
                    data=base64.b64decode(req.image_base64),
                    mime_type='image/jpeg',
                )
            )
        
        ingredient_text = ", ".join(req.ingredients) if req.ingredients else "What ingredients do you see?"
        contents.append(ingredient_text)

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                response_mime_type="application/json",
            ),
        )
        
        import json
        data = json.loads(response.text)
        return [RecipeResponse(**r) for r in data]
    except Exception as e:
        import traceback
        import logging
        logging.error(f"AI Generation Error: {e}")
        logging.error(traceback.format_exc())
        if 'response' in locals():
            logging.error(f"Response text was: {response.text}")
            
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            # Fallback mock response for when the user's API key hits the free tier daily limit
            logging.warning("Gemini API rate limit exceeded. Falling back to mock recipes.")
            return [
                {
                    "title": "Rustic Farmhouse Hash",
                    "tag": "zero waste",
                    "uses_items": ["apple", "cheese", "bread"],
                    "extra_items": "butter, herbs, salt, pepper",
                    "time": "15 mins",
                    "servings": "2",
                    "difficulty": "Easy",
                    "youtube_link": "https://www.youtube.com/results?search_query=how+to+make+rustic+hash+with+leftover+bread",
                    "instructions": [
                        "Tear the leftover bread into bite-sized chunks.",
                        "Dice the apple into small cubes.",
                        "Melt butter in a skillet over medium heat.",
                        "Toast the bread chunks until golden brown, then add the diced apple.",
                        "Sprinkle shredded cheese over the top and cover until melted.",
                        "Garnish with herbs and serve hot."
                    ],
                    "compost_tip": "Compost the apple core and any stems from the fresh herbs."
                }
            ]
        raise HTTPException(status_code=500, detail=error_msg)

