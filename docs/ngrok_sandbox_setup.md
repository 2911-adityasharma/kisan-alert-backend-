# Local Expose & Twilio Sandbox Webhook Configuration Guide

Follow these steps to expose your local FastAPI backend to the public internet using `ngrok` and link it to your Twilio WhatsApp Sandbox for real-time interactive testing.

---

## Step 1: Start the Local FastAPI Backend

First, launch your local FastAPI server. Open a terminal in the `kisan-alert-backend` directory and run:

```bash
# Activate your virtual environment
.\venv\Scripts\activate

# Run the FastAPI server using uvicorn
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will now be running locally at `http://127.0.0.1:8000`. You can access the API documentation at `http://127.0.0.1:8000/docs`.

---

## Step 2: Expose the Backend Externally via ngrok

Since Twilio needs to hit a public HTTPS endpoint, use `ngrok` to tunnel requests to your local machine:

1. **Install ngrok:** If you don't have ngrok installed, download it from [ngrok.com](https://ngrok.com/) or install it via package managers:
   - **Windows (Chocolatey):** `choco install ngrok`
   - **macOS (Homebrew):** `brew install ngrok`

2. **Tunnel Port 8000:** Open a new terminal window and run:
   ```bash
   ngrok http 8000
   ```

3. **Copy Forwarding URL:** Locate the `Forwarding` line in your ngrok output. It will look like:
   ```text
   Forwarding   https://a1b2-34-56-78-90.ngrok-free.app -> http://localhost:8000
   ```
   Copy the `https://...ngrok-free.app` URL.

---

## Step 3: Configure the Twilio WhatsApp Sandbox

1. **Go to Twilio Console:** Log into your [Twilio Console](https://console.twilio.com/).
2. **Access Sandbox:** In the left sidebar, navigate to:
   **Messaging** -> **Try it out** -> **Send a WhatsApp message**
3. **Sandbox Settings:** Click on the **Sandbox settings** tab at the top of the WhatsApp page.
4. **Update Webhook URL:**
   - Find the input box labeled **WHEN A MESSAGE COMES IN** (under the "Inbound Sandbox" section).
   - Paste your copied ngrok HTTPS URL and append `/webhook/whatsapp`. E.g.:
     ```text
     https://a1b2-34-56-78-90.ngrok-free.app/webhook/whatsapp
     ```
   - Ensure the dropdown menu next to it is set to **POST**.
5. **Save Configuration:** Scroll down and click the **Save** button.

---

## Step 4: Perform Real-time Testing

1. **Join the Sandbox:** Send the activation code displayed on the Twilio Sandbox page (e.g., `join word-word`) to your Twilio Sandbox WhatsApp number (usually `+1 415 523 8886`) from your personal phone.
2. **Step 1 - Trigger Onboarding:** Send a text message like `hello`.
   - **Expected behavior:** Your local FastAPI server terminal will log the incoming webhook request. Because your phone is not yet in the DB, it will register you as a new farmer (onboarding stage `"new"`) and reply:
     > *"Welcome to Kisan Alert! 🌾 Please reply with your Village ID or Village Name to complete registration."*
3. **Step 2 - Complete Onboarding:** Reply with a village name/code, e.g., `village_01`.
   - **Expected behavior:** The backend updates your onboarding stage to `"active"`, sets your `village_id`, generates a default farm plot, queries the village defaults, fetches local weather data, calls Gemini AI, and responds to you with a welcome message and a crop advisory formatted in your default language (Telugu: `"te"`).
4. **Step 3 - Active Advisory:** Send any subsequent text message.
   - **Expected behavior:** The backend identifies you as `"active"`, fetches your registered plot, and sends updated weather-based crop suggestions.
