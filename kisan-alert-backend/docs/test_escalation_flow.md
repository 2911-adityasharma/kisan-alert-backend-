# End-to-End Escalation Flow Test Guide

This guide lets you manually test the full cycle:  
**WhatsApp photo ➜ Gemini Vision ➜ Pending escalation ➜ Officer review ➜ WhatsApp reply to farmer**

---

## Prerequisites

| Item | Detail |
|------|--------|
| Server running | `uvicorn app.main:app --reload --port 8000` |
| ngrok tunnel | `ngrok http 8000` — copy the HTTPS URL |
| Twilio Sandbox | Set Webhook URL to `https://<ngrok>.ngrok.io/webhook/whatsapp` |
| Env vars set | `.env` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `GEMINI_API_KEY`, `FIREBASE_CREDENTIALS_JSON` |

---

## Step 1 — Register a farmer (if not already done)

Send from your WhatsApp Sandbox number:
```
Hello
```
Expected reply: "Welcome to Kisan Alert! Please reply with your village name."

Send:
```
Sangareddy
```
Expected reply: Crop advice for Sangareddy.

---

## Step 2 — Simulate a photo upload via WhatsApp

Send any crop photo from your registered WhatsApp number.  
Expected reply (in farmer's language, e.g. Telugu):
> ధన్యవాదాలు, మీ ఫోటో అందింది. వ్యవసాయ అధికారి త్వరలో సమీక్షించి మీకు సమాచారం అందిస్తారు.

Check server logs — you should see:
```
INFO: Image attachment detected from +91...
INFO: Running Gemini Vision diagnosis on media from https://api.twilio.com/...
INFO: Diagnosis complete: <first 80 chars>
INFO: Escalation created: id=<esc_id>, status=pending
```

---

## Step 3 — View pending escalations (officer dashboard)

```bash
curl -s http://localhost:8000/escalations/pending | python -m json.tool
```

**Example response:**
```json
[
  {
    "id": "abc123",
    "photo_url": "https://api.twilio.com/...",
    "ai_diagnosis": "మీ పంటకు ఆకు తెగులు వ్యాధి ఉంది...",
    "farmer_phone": "+919876543210",
    "farmer_name": "Ramesh Kumar",
    "plot_id": "plot_xyz",
    "created_at": "2024-01-15T10:30:00"
  }
]
```

Note the `id` field — you will use it in Step 4.

---

## Step 4 — Approve and send reply to farmer

```bash
# Replace ESC_ID with the actual id from Step 3
ESC_ID="abc123"

curl -s -X POST http://localhost:8000/escalations/${ESC_ID}/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "officer_note": "AI diagnosis confirmed — leaf blight pattern visible.",
    "final_message": "Your crop shows signs of leaf blight. Apply Mancozeb 75% WP at 2g/litre and ensure good drainage. Avoid water stagnation near roots."
  }' | python -m json.tool
```

**Expected response:**
```json
{
  "id": "abc123",
  "plot_id": "plot_xyz",
  "photo_url": "https://...",
  "ai_diagnosis": "...",
  "status": "approved",
  "officer_note": "AI diagnosis confirmed — leaf blight pattern visible.",
  "final_message": "Your crop shows signs of leaf blight...",
  "whatsapp_sent": true,
  "farmer_phone": "+919876543210"
}
```

The farmer will receive a WhatsApp message instantly.

---

## Step 5 — Officer modifies the AI diagnosis

```bash
curl -s -X POST http://localhost:8000/escalations/${ESC_ID}/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "modified",
    "officer_note": "AI partially correct; added dosage correction.",
    "final_message": "మీ పంటకు ఆకు తెగులు వ్యాధి ఉంది. మాంకోజెబ్ 75% WP ను 2గ్రా/లీటరుకు కలిపి చల్లండి."
  }' | python -m json.tool
```

---

## Step 6 — Reject a low-quality photo

```bash
curl -s -X POST http://localhost:8000/escalations/${ESC_ID}/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "officer_note": "Photo is blurry — cannot diagnose.",
    "final_message": ""
  }' | python -m json.tool
```

`whatsapp_sent` will be `false` — farmer is not contacted on rejection.

---

## Error cases to test

| Scenario | Expected HTTP |
|----------|--------------|
| Resolve already-resolved escalation | `409 Conflict` |
| Approve without `final_message` | `422 Unprocessable Entity` |
| Resolve with unknown escalation ID | `404 Not Found` |
| Image from unregistered farmer | `200` + WhatsApp registration prompt |

```bash
# 409 — resolve the same escalation twice
curl -X POST http://localhost:8000/escalations/${ESC_ID}/resolve \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","officer_note":"","final_message":""}'

# 422 — missing final_message
curl -X POST http://localhost:8000/escalations/anyid/resolve \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","officer_note":"ok","final_message":""}'

# 404
curl -X POST http://localhost:8000/escalations/nonexistent/resolve \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","officer_note":"","final_message":""}'
```

---

## Quick health check

```bash
curl http://localhost:8000/health
# {"status":"healthy"}

curl http://localhost:8000/docs
# Opens Swagger UI with all routes documented
```
