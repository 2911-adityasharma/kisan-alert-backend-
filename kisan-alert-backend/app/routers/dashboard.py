import logging
import random
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.db import get_farmer_by_phone, get_plot_for_farmer
from app.services.weather import weather_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# Mock lists that are localized or easy to translate
MOCK_SCHEMES = [
    {
        "name": "PM-KISAN", 
        "amount": "₹6,000/yr", 
        "deadline": "Apply by Aug 15", 
        "color": "#2E7D32",
        "nameHi": "पीएम-किसान",
        "nameTe": "పీఎం-కిసాన్"
    },
    {
        "name": "PM Fasal Bima", 
        "amount": "Upto ₹2L", 
        "deadline": "Kharif 2026", 
        "color": "#1976D2",
        "nameHi": "पीएम फसल बीमा",
        "nameTe": "పీఎం ఫసల్ బీమా"
    },
    {
        "name": "Kisan Credit Card", 
        "amount": "₹3L loan", 
        "deadline": "0% interest", 
        "color": "#6A1B9A",
        "nameHi": "किसान क्रेडिट कार्ड",
        "nameTe": "किसान क्रेडिट कार्ड"
    }
]

MOCK_OFFICER = {
    "name": "Rajesh Patil",
    "role": "Agricultural Officer",
    "roleHi": "कृषि अधिकारी",
    "roleTe": "వ్యవసాయ అధికారి",
    "distance": "2.3 km away",
    "phone": "+919422012345",
    "available": True
}

# Determine crop name translations
CROP_TRANSLATIONS = {
    "Wheat": {"hi": "गेहूं", "te": "గోధుమ", "en": "Wheat"},
    "Rice": {"hi": "धान / चावल", "te": "వరి", "en": "Rice"},
    "Cotton": {"hi": "कपास", "te": "ప్రత్తి", "en": "Cotton"},
    "Soybean": {"hi": "सोयाबीन", "te": "సోయాబీన్", "en": "Soybean"},
    "Groundnut": {"hi": "मूंगफली", "te": "వేరుశనగ", "en": "Groundnut"}
}

@router.get("", summary="Get farmer dashboard data")
async def get_dashboard(phone: str):
    """
    Returns dashboard data for a farmer including current weather, 
    Mandi prices, schemes, officer info, alerts, and seasonal advisories.
    """
    clean_phone = phone.strip().replace(" ", "").replace("-", "")
    farmer = get_farmer_by_phone(clean_phone)
    
    # Fallback to guest mode or mock user if not registered
    if not farmer:
        logger.warning("No farmer found for phone %s. Returning demo guest dashboard.", clean_phone)
        farmer = {
            "name": "Guest Farmer",
            "phone": clean_phone,
            "village_id": "village_anantapur",
            "language": "en",
            "onboarding_stage": "guest"
        }
        plots = []
    else:
        plots = get_plot_for_farmer(farmer["id"])

    lang = farmer.get("language", "te")

    # 1. Weather details
    weather_data = {}
    try:
        snapshot = await weather_service.get_field_snapshot()
        if "error" not in snapshot:
            weather_data = {
                "temp": snapshot.get("current", {}).get("temp_c", 32),
                "condition": snapshot.get("current", {}).get("condition", "Clear"),
                "humidity": f"{snapshot.get('current', {}).get('humidity_pct', 65)}%",
                "wind": f"{int(snapshot.get('current', {}).get('wind_speed_ms', 4) * 3.6)} km/h",
                "rain_prob": f"{snapshot.get('forecast', {}).get('rainfall_next_5d_mm', 5.0):.1f} mm"
            }
        else:
            logger.warning("Error in weather snapshot: %s", snapshot["error"])
            raise Exception("Weather error")
    except Exception:
        # Graceful fallback values
        weather_data = {
            "temp": 34,
            "condition": "Partly Cloudy",
            "humidity": "72%",
            "wind": "14 km/h",
            "rain_prob": "2.5 mm"
        }

    # 2. MANDI PRICES (mocked with slight dynamic variation based on date)
    day_of_month = datetime.now().day
    random.seed(day_of_month) # stable daily variation
    
    mandi_prices = [
        {
            "crop": "Wheat",
            "cropLocal": CROP_TRANSLATIONS["Wheat"].get(lang, "Wheat"),
            "price": f"₹{2100 + random.randint(10, 80)}",
            "change": "+1.8%" if random.choice([True, False]) else "-0.5%",
            "up": random.choice([True, False]),
            "emoji": "🌾"
        },
        {
            "crop": "Rice",
            "cropLocal": CROP_TRANSLATIONS["Rice"].get(lang, "Rice"),
            "price": f"₹{1930 + random.randint(10, 60)}",
            "change": "+2.1%" if random.choice([True, False]) else "-0.8%",
            "up": random.choice([True, False]),
            "emoji": "🌾"
        },
        {
            "crop": "Cotton",
            "cropLocal": CROP_TRANSLATIONS["Cotton"].get(lang, "Cotton"),
            "price": f"₹{6150 + random.randint(50, 150)}",
            "change": "+3.4%",
            "up": True,
            "emoji": "🌿"
        },
        {
            "crop": "Soybean",
            "cropLocal": CROP_TRANSLATIONS["Soybean"].get(lang, "Soybean"),
            "price": f"₹{4750 + random.randint(20, 100)}",
            "change": "+1.5%",
            "up": True,
            "emoji": "🫘"
        }
    ]

    # 3. ALERTS list
    alerts = [
        {
            "type": "weather",
            "icon": "🌧️",
            "color": "#1976D2",
            "bg": "#E3F2FD",
            "title": "Heavy Rain Warning" if lang == "en" else ("भारी वर्षा चेतावनी" if lang == "hi" else "భారీ వర్షపాత హెచ్చరిక"),
            "desc": "Heavy rainfall expected in next 48 hours" if lang == "en" else ("अगले 48 घंटों में भारी बारिश की संभावना" if lang == "hi" else "రాబోయే 48 గంటల్లో భారీ వర్షపాతం అంచనా"),
            "time": "2h ago",
            "important": True
        },
        {
            "type": "disease",
            "icon": "⚠️",
            "color": "#D32F2F",
            "bg": "#FFEBEE",
            "title": "Blast Disease Alert" if lang == "en" else ("धान झुलसा रोग चेतावनी" if lang == "hi" else "అగ్గి తెగులు హెచ్చరిక"),
            "desc": "Paddy blast detected in 3 nearby villages" if lang == "en" else ("3 नजदीकी गांवों में धान झुलसा रोग पाया गया" if lang == "hi" else "సమీపంలోని 3 గ్రామాలలో వరి అగ్గి తెగులు గుర్తించబడింది"),
            "time": "5h ago",
            "important": True
        }
    ]

    # 4. Seasonal advisory
    crop_info = plots[0].get("crop_current", "Crops") if plots else "Crops"
    advisories = {
        "te": f"ఈ వారం {CROP_TRANSLATIONS.get(crop_info, {}).get('te', crop_info)} పంట విత్తడానికి అనుకూలమైనది. సరైన మొలకల పెరుగుదలకు విత్తే ముందు డి.ఎ.పి (DAP) ఎరువును వేయండి.",
        "hi": f"यह सप्ताह {CROP_TRANSLATIONS.get(crop_info, {}).get('hi', crop_info)} बोने के लिए उपयुक्त है। सर्वोत्तम परिणामों के लिए बुवाई से पहले डीएपी उर्वरक डालें।",
        "en": f"This week is ideal for sowing {CROP_TRANSLATIONS.get(crop_info, {}).get('en', crop_info)}. Apply DAP fertilizer before sowing for best results."
    }
    seasonal_advisory = advisories.get(lang, advisories["en"])

    # 5. Build localized schemes
    schemes = []
    for s in MOCK_SCHEMES:
        name = s["nameTe"] if lang == "te" else (s["nameHi"] if lang == "hi" else s["name"])
        schemes.append({
            "name": name,
            "amount": s["amount"],
            "deadline": s["deadline"],
            "color": s["color"]
        })

    # 6. Build localized officer details
    officer = {
        "name": MOCK_OFFICER["name"],
        "role": MOCK_OFFICER["roleTe"] if lang == "te" else (MOCK_OFFICER["roleHi"] if lang == "hi" else MOCK_OFFICER["role"]),
        "distance": MOCK_OFFICER["distance"],
        "phone": MOCK_OFFICER["phone"],
        "available": MOCK_OFFICER["available"]
    }

    return {
        "success": True,
        "farmer": farmer,
        "plot": plots[0] if plots else None,
        "weather": weather_data,
        "mandi_prices": mandi_prices,
        "alerts": alerts,
        "schemes": schemes,
        "officer": officer,
        "seasonal_advisory": seasonal_advisory
    }
