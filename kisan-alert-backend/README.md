# Kisan Alert Backend

**AI-powered agricultural advisory platform for Indian small farmers.**
Delivers real-time crop recommendations, disease diagnosis, and drought alerts via WhatsApp in Telugu, Hindi, and English.

---

## Architecture Overview

```
┌──────────────────┐     Twilio      ┌────────────────────┐    Firestore
│  Farmer's Phone  │◄──────────────►│  FastAPI Backend    │◄────────────►  Cloud Firestore
│  (WhatsApp)      │  (inbound/out) │                    │               (farmers, plots,
└──────────────────┘                │  ┌──────────────┐  │                escalations,
                                    │  │ Webhook      │  │                village_defaults)
┌──────────────────┐                │  │ Router       │  │
│  Officer         │  REST API      │  ├──────────────┤  │    Gemini API
│  Dashboard       │◄──────────────►│  │ Escalations  │  │◄────────────►  gemini-2.5-flash
│  (React/Next.js) │                │  │ Router       │  │               (advice + vision)
└──────────────────┘                │  ├──────────────┤  │
                                    │  │ Recommend    │  │    Agromonitoring
                                    │  │ Router       │  │◄────────────►  Weather, Soil,
                                    │  ├──────────────┤  │               UV, Satellite
                                    │  │ Scheduler    │  │
                                    │  │ (APScheduler)│  │
                                    │  └──────────────┘  │
                                    └────────────────────┘
```

### Request Flows

| Flow | Trigger | Steps |
|------|---------|-------|
| **Onboarding** | Farmer sends first WhatsApp message | Register farmer → ask for village → store village → send first advisory |
| **Advisory** | Active farmer sends any text | Look up plot → resolve soil data → fetch weather → Gemini recommendation → format in farmer's language → WhatsApp reply |
| **Photo Diagnosis** | Farmer sends a crop photo | Download image (Twilio Basic Auth) → Gemini Vision diagnosis → create pending escalation → ack to farmer (diagnosis NOT sent) |
| **Escalation Review** | Officer calls `POST /escalations/{id}/resolve` | Approve/modify/reject → on approve: send officer-reviewed message to farmer via WhatsApp |
| **Drought Alert** | APScheduler runs every 6 hours | Scan all plots → check 5-day rainfall forecast → if < 10 mm → WhatsApp alert in farmer's language |
| **On-demand Alert** | `POST /admin/trigger-alerts` | Same as above, triggered manually for demos |

---

## Project Structure

```
kisan-alert-backend/
├── app/
│   ├── main.py                # FastAPI app with lifespan (APScheduler start/stop)
│   ├── config.py              # pydantic-settings: all env vars
│   ├── services/
│   │   ├── db.py              # Firestore CRUD (farmers, plots, escalations, village_defaults)
│   │   ├── weather.py         # Agromonitoring API (forecast, current, soil, UV)
│   │   ├── soil.py            # Soil nutrient resolution (SHC or village defaults)
│   │   ├── advisor.py         # Gemini crop recommendation (structured JSON)
│   │   ├── vision.py          # Gemini Vision crop disease diagnosis
│   │   ├── whatsapp.py        # Twilio WhatsApp send
│   │   └── scheduler.py       # APScheduler drought alert job
│   ├── routers/
│   │   ├── whatsapp_webhook.py  # POST /webhook/whatsapp — Twilio inbound
│   │   ├── escalations.py       # GET /escalations/pending, POST /{id}/resolve
│   │   └── recommend.py         # POST /recommend/crop — REST API for recommendations
│   └── models/                  # Pydantic schemas (shared)
├── data/
│   └── village_defaults.json  # Village soil NPK/pH defaults (3 demo villages)
├── scripts/
│   └── seed_firestore.py      # Seed Firestore with 3 demo farmers, plots, village_defaults
├── tests/
│   ├── conftest.py            # Firebase mock stubs for test isolation
│   ├── test_scheduler.py      # 14 tests: alert logic + admin endpoint
│   └── test_vision_and_escalations.py  # 12 tests: vision + webhook + escalations
├── docs/
│   └── test_escalation_flow.md  # cURL guide for escalation lifecycle
├── .env.example               # All required environment variables
├── .gitignore                 # Python + secrets exclusions
├── requirements.txt           # Pinned dependencies
├── pytest.ini                 # Test configuration
└── README.md                  # This file
```

---

## Setup Instructions

### Prerequisites

- **Python 3.11+**
- **Firebase project** with Firestore enabled
- **Twilio account** with WhatsApp Sandbox activated
- **Google AI Studio** API key (Gemini)
- **Agromonitoring** free-tier API key + registered polygon

### 1. Clone and install

```bash
cd kisan-alert-backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your real credentials (see Environment Variables below)
```

### 3. Seed demo data (optional)

```bash
python -m scripts.seed_firestore
# → Seeds 3 farmers, 3 plots, 3 village_defaults into Firestore
```

### 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 5. Expose to Twilio (for WhatsApp testing)

```bash
ngrok http 8000
# Copy the https:// URL
```

In Twilio Console → Messaging → WhatsApp Sandbox → set webhook to:
```
https://<ngrok-id>.ngrok-free.app/webhook/whatsapp
```

### 6. Run tests

```bash
python -m pytest tests/ -v
# 26 tests, no Firebase credentials required (fully mocked)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key for Gemini 2.5 Flash |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | Twilio WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `AGROMONITORING_API_KEY` | ✅ | Agromonitoring.com API key |
| `AGROMONITORING_POLYGON_ID` | ✅ | Default polygon ID for weather lookups |
| `FIREBASE_PROJECT_ID` | ⚠️ | Firebase project ID (optional if using service account key) |
| `FIREBASE_CREDENTIALS_PATH` | ⚠️ | Path to Firebase service account JSON (falls back to ADC) |
| `SUPABASE_URL` | ❌ | Supabase project URL (reserved for future SHC integration) |
| `SUPABASE_KEY` | ❌ | Supabase anon/service key (reserved) |
| `LOW_RAIN_THRESHOLD_MM` | ❌ | Drought alert threshold in mm (default: `10.0`) |

---

## API Reference

### Health Check

```
GET /health
→ {"status": "healthy"}
```

### WhatsApp Webhook (Twilio)

```
POST /webhook/whatsapp
POST /whatsapp/webhook    (alias)

Content-Type: application/x-www-form-urlencoded
Body: Twilio's standard inbound message payload (From, Body, NumMedia, MediaUrl0, ...)
Response: 200 with empty TwiML <Response></Response>
```

### Escalations API (Officer Dashboard)

#### List pending escalations

```
GET /escalations/pending

Response 200:
[
  {
    "id": "abc123",
    "photo_url": "https://api.twilio.com/...",
    "ai_diagnosis": "మీ పంటకు ఆకు తెగులు వ్యాధి...",
    "farmer_phone": "919876543210",
    "farmer_name": "Ravi Kumar",
    "plot_id": "plot_ravi_01",
    "created_at": "2024-07-06T10:30:00"
  }
]
```

#### Resolve an escalation

```
POST /escalations/{escalation_id}/resolve

Request Body:
{
  "status": "approved" | "modified" | "rejected",
  "officer_note": "Internal note (stored, not sent)",
  "final_message": "Message to send to farmer (required for approved/modified)"
}

Response 200:
{
  "id": "abc123",
  "plot_id": "plot_ravi_01",
  "photo_url": "...",
  "ai_diagnosis": "...",
  "status": "approved",
  "officer_note": "Looks correct",
  "final_message": "...",
  "whatsapp_sent": true,
  "farmer_phone": "919876543210"
}

Error responses:
  404  Escalation not found
  409  Already resolved (not pending)
  422  final_message empty on approve/modified
  500  Database write failed
```

### Crop Recommendation API

```
POST /recommend/crop

Request Body:
{
  "village_id": "village_anantapur",
  "soil_data_ref": "village_default:village_anantapur",
  "season": "kharif",
  "language": "te",
  "previous_crops": ["rice"],
  "farm_size_acres": 3.0,
  "farmer_notes": "I have a borewell"
}

Response 200:
{
  "success": true,
  "field_snapshot": { ... },
  "soil_nutrients": { "n": 180, "p": 22, ... },
  "recommendation": {
    "recommendations": [
      {
        "crop": "Groundnut (TAG-24)",
        "reason": "...",
        "sowing_window": "15 Jun - 10 Jul",
        "water_need": "400-500 mm/season",
        "expected_yield": "1.5-2.0 tonnes/ha",
        "warnings": ["Monitor for leaf spot in humid weeks"]
      }
    ],
    "irrigation_advice": "...",
    "fertiliser_advice": "...",
    "general_advisory": "...",
    "data_quality_notes": []
  }
}
```

### Admin: Trigger Drought Alerts

```
POST /admin/trigger-alerts

Response 200:
{
  "plots_checked": 3,
  "alerts_sent": 1,
  "alerts_skipped": 2,
  "errors": 0,
  "detail": [
    {
      "plot_id": "plot_ravi_01",
      "farmer_id": "farmer_ravi",
      "crop": "Groundnut",
      "action": "alert_sent",
      "rain_mm": 4.2,
      "error": null
    }
  ]
}
```

---

## Production Path

> **This is a demo/hackathon build.** Below are the known shortcuts and their production replacements.

### Weather & Soil Data

| Demo | Production |
|------|------------|
| **Agromonitoring free tier** — single shared polygon, 5-day forecast | **Google Earth Engine (GEE)** — per-plot NDVI, soil moisture, 10-day forecast via Copernicus/ERA5 |
| **Hardcoded village soil NPK** from `village_defaults.json` | **Soil Health Card (SHC) API** — real NPK/pH/OC per plot from government lab reports |
| **Single polygon for all plots** — all plots share one weather reading | **Per-plot polygons** — register each farm's GPS boundary as its own Agromonitoring polygon |

### Messaging & Language

| Demo | Production |
|------|------------|
| **Twilio WhatsApp Sandbox** — limited to pre-joined test numbers | **Gupshup / Twilio Production** — approved WhatsApp Business API with message templates |
| **Gemini-native multilingual** — model generates responses directly in te/hi/en | **Bhashini STT/TTS** — government India-stack speech pipeline for voice messages; Gemini for text only |
| **Text-only WhatsApp** — farmer must type messages | **Voice note support** — transcribe farmer's voice via Bhashini ASR, reply with TTS audio |

### AI & Vision

| Demo | Production |
|------|------------|
| **Gemini 2.5 Flash** — generic crop diagnosis prompt | **Fine-tuned vision model** — trained on Indian pest/disease datasets (PlantVillage, IARI) |
| **AI diagnosis held for officer review** — all photos are escalated | **Confidence-gated routing** — high-confidence diagnoses auto-sent; low-confidence escalated |

### Infrastructure

| Demo | Production |
|------|------------|
| **Firestore** — simple document store, no indexes | **Firestore + composite indexes** on (farmer_id, created_at), (status, created_at) for dashboard queries |
| **APScheduler in-process** — runs inside the FastAPI process | **Cloud Scheduler + Cloud Tasks** — decoupled, survives process restarts |
| **No auth on admin endpoints** — `/admin/trigger-alerts` is open | **Firebase Auth / API keys** — role-based access for officer dashboard |
| **CORS `*`** — wide open for frontend dev convenience | **Restrict CORS** to production frontend domain only |
| **ngrok for webhooks** — ephemeral tunnel | **Cloud Run / GKE** — stable URL with auto-scaling |

---

## License

Internal project — not licensed for public distribution.
