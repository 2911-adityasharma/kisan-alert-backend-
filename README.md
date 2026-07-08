# 🌾 Kisan Alert

> **AI-powered multilingual agricultural advisory platform** — helping farmers detect crop diseases, receive AI-driven crop recommendations, and stay ahead of weather threats via WhatsApp.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Background Jobs](#background-jobs)
- [Frontend Pages](#frontend-pages)
- [Testing](#testing)
- [Deployment](#deployment)
- [Future Roadmap](#future-roadmap)

---

## Overview

**Kisan Alert** is a production-grade hackathon MVP built to empower Indian farmers with AI advisory tools. It bridges the gap between cutting-edge AI (Google Gemini) and rural agriculture by offering:

- 📸 **Crop disease diagnosis** from a photo using Gemini Vision
- 🌱 **AI crop recommendations** based on soil, weather, and satellite data
- ⛈️ **Automated weather alerts** via WhatsApp in the farmer's native language
- 👩‍💼 **Officer Dashboard** for reviewing, approving, and dispatching AI responses
- 🌍 **Multilingual support** — English, Hindi, Telugu (extensible)

The system requires **no custom ML model training** — Gemini AI acts as the primary reasoning engine via prompt engineering.

---

## Core Features

| Feature | Description |
|---|---|
| 🌾 **Farmer Registration** | Onboarding with name, phone, village, language preference, and plot GPS location |
| 🌿 **Crop Recommendation** | Gemini-powered recommendations based on soil NPK, pH, weather, and NDVI |
| 🔬 **Disease Diagnosis** | Farmer uploads a crop image → Gemini Vision analyses → officer reviews → WhatsApp alert |
| 🌦️ **Weather Alerts** | Automated 5-day rainfall forecast checks; low-rain alerts sent via WhatsApp |
| 🛰️ **Satellite Monitoring** | NDVI-based crop health monitoring via Agromonitoring API |
| 🌱 **Soil Health** | Village-level soil defaults (N, P, K, pH, Organic Carbon) via Firestore |
| 🧑‍💼 **Officer Dashboard** | RSK officers can approve/modify/reject AI diagnoses before dispatch to farmer |
| 💬 **Kisan Dost (AI Chat)** | Conversational AI assistant for general farming queries |
| 📲 **WhatsApp Webhook** | Bidirectional WhatsApp conversation via Twilio Sandbox |

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | **FastAPI** (Python, fully async) |
| AI / Advisory | **Google Gemini 2.5 Flash** (google-genai) |
| Vision | **Gemini Vision** (multimodal image analysis) |
| Database | **Firebase Firestore** (firebase-admin) |
| Auth | **Firebase Authentication** |
| Messaging | **Twilio WhatsApp** (twilio) |
| Weather / Soil | **Agromonitoring API** |
| Background Jobs | **APScheduler** (AsyncIOScheduler, every 6 hours) |
| Storage | Supabase + local static/uploads/ |
| Server | **Uvicorn** |

### Frontend

| Layer | Technology |
|---|---|
| Framework | **React 18** + **TypeScript** |
| Build Tool | **Vite 6** |
| Styling | **TailwindCSS 4** |
| UI Components | **shadcn/ui** (Radix UI primitives) |
| Icons | **Lucide React** + MUI Icons |
| Routing | **React Router 7** |
| Forms | **React Hook Form** |
| Charts | **Recharts** |
| Animations | **Motion** (Framer Motion) |
| Toasts | **Sonner** |

---

## Project Structure

```
kisan alert app/
├── kisan-alert-backend/          # FastAPI backend
│   ├── app/
│   │   ├── main.py               # App factory, CORS, routers, APScheduler lifespan
│   │   ├── config.py             # Pydantic settings (env vars)
│   │   ├── routers/
│   │   │   ├── auth.py           # Farmer registration & login
│   │   │   ├── recommend.py      # AI crop recommendation endpoint
│   │   │   ├── scan.py           # Crop disease image upload & diagnosis
│   │   │   ├── dashboard.py      # Officer dashboard (list / approve / reject)
│   │   │   ├── escalations.py    # Escalation management (pending → resolved)
│   │   │   ├── chat.py           # Kisan Dost AI chat endpoint
│   │   │   └── whatsapp_webhook.py # Twilio inbound WhatsApp handler
│   │   └── services/
│   │       ├── db.py             # Firestore CRUD (farmers, plots, escalations)
│   │       ├── advisor.py        # Gemini crop advisory & recommendation logic
│   │       ├── vision.py         # Gemini Vision disease diagnosis
│   │       ├── weather.py        # Agromonitoring weather & forecast fetching
│   │       ├── soil.py           # Soil health data retrieval
│   │       ├── whatsapp.py       # Twilio WhatsApp message sender
│   │       └── scheduler.py      # APScheduler drought-alert job (every 6h)
│   ├── firebase/                 # Firebase service account key (gitignored)
│   ├── static/uploads/           # Uploaded crop images
│   ├── tests/                    # Pytest test suite
│   ├── docs/
│   │   ├── firestore_model.md    # Firestore schema reference
│   │   └── ngrok_sandbox_setup.md # WhatsApp sandbox local testing guide
│   ├── requirements.txt
│   ├── .env.example
│   └── pytest.ini
│
├── Krishi-alert-frontend/        # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── main.tsx          # React entry point
│   │   │   ├── routes.ts         # React Router route definitions
│   │   │   ├── Root.tsx          # Root layout with auth guard
│   │   │   └── components/
│   │   │       ├── SplashScreen.tsx
│   │   │       ├── LanguageSelection.tsx
│   │   │       ├── Onboarding.tsx
│   │   │       ├── Login.tsx
│   │   │       ├── AppLayout.tsx
│   │   │       ├── HomeDashboard.tsx
│   │   │       ├── CameraScreen.tsx
│   │   │       ├── AIProcessing.tsx
│   │   │       ├── DiagnosisResult.tsx
│   │   │       ├── KisanDost.tsx
│   │   │       ├── GovernmentAlerts.tsx
│   │   │       └── Profile.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                         # Project-level documentation
├── PROJECT-CONTEXT.md            # Full project context & architecture
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **pnpm** (or npm)
- A **Firebase project** with Firestore enabled
- A **Google Gemini API key**
- A **Twilio account** with WhatsApp Sandbox enabled
- An **Agromonitoring API key**

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd kisan-alert-backend

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your real API keys

# 5. Add Firebase service account key
# Save as: firebase/serviceAccountKey.json
# Update FIREBASE_CREDENTIALS_PATH in .env

# 6. Start the dev server
uvicorn app.main:app --reload
```

Backend: **http://localhost:8000** | Swagger docs: **http://localhost:8000/docs**

---

### Frontend Setup

```bash
cd Krishi-alert-frontend
pnpm install      # or: npm install
npm run dev       # or: pnpm dev
```

Frontend: **http://localhost:5173**

---

## Environment Variables

Copy kisan-alert-backend/.env.example to .env:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Agromonitoring
AGROMONITORING_API_KEY=your-agromonitoring-api-key
AGROMONITORING_POLYGON_ID=your-polygon-id

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=firebase/serviceAccountKey.json

# Alert Thresholds
LOW_RAIN_THRESHOLD_MM=2.0
```

> ⚠️ **Never commit .env** — only .env.example belongs in source control.

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Health check |
| POST | /auth/register | Register a new farmer |
| POST | /auth/login | Farmer login |
| POST | /recommend/ | AI crop recommendation |
| POST | /scan/ | Upload crop image for disease diagnosis |
| GET | /dashboard/escalations | List pending AI diagnoses (officer) |
| POST | /escalations/{id}/approve | Approve a diagnosis and dispatch to farmer |
| POST | /escalations/{id}/reject | Reject a diagnosis |
| POST | /escalations/{id}/modify | Modify and dispatch a custom message |
| POST | /chat/ | Kisan Dost AI chat |
| POST | /whatsapp/webhook | Twilio inbound webhook |
| POST | /admin/trigger-alerts | Manually trigger the drought alert job |

### Response Format

Success:
```json
{ "success": true, "message": "...", "data": {} }
```

Error:
```json
{ "success": false, "error": "...", "details": "..." }
```

---

## Data Model

### farmers

| Field | Type | Description |
|---|---|---|
| phone | String | Unique phone number (WhatsApp ID) |
| name | String | Farmer display name |
| village_id | String | Reference to farmer's village |
| language | String | Preferred language (default: "te") |
| onboarding_stage | String | Registration stage (default: "new") |
| created_at | Timestamp | Registration timestamp |

### plots

| Field | Type | Description |
|---|---|---|
| farmer_id | String | FK → farmers |
| lat / lng | Number | GPS coordinates |
| crop_current | String | Currently sown crop |
| soil_data_ref | String | Soil dataset reference |
| poly_id | String | Agromonitoring polygon ID (optional) |
| created_at | Timestamp | Plot registration timestamp |

### village_defaults

| Field | Type | Description |
|---|---|---|
| n_kg_ha | Number | Nitrogen (kg/ha) |
| p_kg_ha | Number | Phosphorus (kg/ha) |
| k_kg_ha | Number | Potassium (kg/ha) |
| ph | Number | Soil pH (0–14) |
| organic_carbon | Number | Organic carbon (%) |

### escalations

| Field | Type | Description |
|---|---|---|
| plot_id | String | FK → plots |
| photo_url | String | Crop disease image URL |
| ai_diagnosis | String | Gemini Vision output |
| status | String | pending / approved / modified / rejected |
| officer_note | String | Officer comments (optional) |
| final_message | String | Message dispatched to farmer |
| created_at | Timestamp | Creation timestamp |
| resolved_at | Timestamp/null | Resolution timestamp |

> Full schema: [docs/firestore_model.md](docs/firestore_model.md)

---

## Background Jobs

**APScheduler AsyncIOScheduler** runs every **6 hours** on startup.

### Drought Alert — check_and_alert()

1. Fetches all plots from Firestore
2. Queries 5-day rainfall forecast from Agromonitoring per plot
3. If rainfall < LOW_RAIN_THRESHOLD_MM (default 2.0 mm):
   - Looks up farmer phone & language preference
   - Sends WhatsApp alert in Telugu / Hindi / English
4. Returns summary: plots_checked, alerts_sent, alerts_skipped, errors

**Trigger on demand:**
```
POST /admin/trigger-alerts
```

---

## Frontend Pages

| Route | Component | Description |
|---|---|---|
| / | SplashScreen | Animated app intro |
| /language | LanguageSelection | Pick preferred language |
| /onboarding | Onboarding | Multi-step farmer registration |
| /login | Login | Phone authentication |
| /app | HomeDashboard | Main dashboard |
| /app/scan | CameraScreen | Crop disease image scan |
| /processing | AIProcessing | AI analysis loading |
| /result | DiagnosisResult | Diagnosis results |
| /app/chat | KisanDost | AI farming assistant chat |
| /app/alerts | GovernmentAlerts | Weather and government alerts |
| /app/profile | Profile | Farmer profile settings |

---

## Testing

```bash
cd kisan-alert-backend

pytest              # Run all tests
pytest -v           # Verbose output
pytest tests/test_scheduler.py -v   # Specific file
```

---

## Deployment

```bash
# Backend → Google Cloud Run
gcloud run deploy kisan-alert-backend \
  --source ./kisan-alert-backend \
  --region asia-south1 \
  --allow-unauthenticated

# Frontend → Firebase Hosting
cd Krishi-alert-frontend
npm run build
firebase deploy --only hosting
```

> For local WhatsApp Sandbox testing with ngrok, see [docs/ngrok_sandbox_setup.md](docs/ngrok_sandbox_setup.md).

---

## Future Roadmap

- [ ] Offline / PWA mode for low-connectivity areas
- [ ] IVR / Voice support for low-literacy farmers
- [ ] Real-time voice chat in regional languages
- [ ] BigQuery analytics dashboards for government
- [ ] IoT sensor integration (soil moisture, temperature)
- [ ] Gemini-powered yield prediction
- [ ] Market price and MSP alerts
- [ ] PMFBY crop insurance guidance
- [ ] Government scheme and subsidy notifications
- [ ] Community leader / village aggregated mode

---

## Contributing

- Keep **AI prompts separated** from business logic (see services/advisor.py)
- All endpoints must be **async**; use **Pydantic** for validation
- **Never hardcode** Firestore document IDs
- Every API response must follow the { success, message, data } envelope
- Design for **multilingual support** from the ground up

---

Built with ❤️ for Indian Farmers  
Powered by Google Gemini · Firebase · FastAPI · React
