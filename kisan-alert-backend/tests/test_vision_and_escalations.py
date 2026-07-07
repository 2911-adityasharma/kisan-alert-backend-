"""
Test suite for:
  - vision.diagnose_photo  (mocked HTTP download + Gemini)
  - whatsapp_webhook NumMedia > 0 branch
  - escalations router: GET /pending and POST /{id}/resolve
"""
import sys
import os
import unittest
from unittest.mock import MagicMock, AsyncMock, patch

backend_path = r"c:\Users\ssr\Desktop\Kisan-Alert\kisan-alert-backend"
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Vision service unit tests
# ─────────────────────────────────────────────────────────────────────────────
class TestDiagnosePhoto(unittest.IsolatedAsyncioTestCase):

    @patch("app.services.vision.httpx.AsyncClient")
    @patch("app.services.vision.genai.Client")
    @patch("app.services.vision.settings")
    async def test_successful_diagnosis(self, mock_settings, mock_genai_cls, mock_httpx_cls):
        """Happy path: download succeeds, Gemini returns diagnosis text."""
        from app.services.vision import diagnose_photo

        # Settings
        mock_settings.TWILIO_ACCOUNT_SID = "AC_test"
        mock_settings.TWILIO_AUTH_TOKEN  = "token_test"
        mock_settings.GEMINI_API_KEY     = "gemini_key"

        # HTTP download mock
        mock_resp = MagicMock()
        mock_resp.content      = b"\xff\xd8\xff"  # minimal JPEG bytes
        mock_resp.headers      = {"content-type": "image/jpeg"}
        mock_resp.raise_for_status = MagicMock()
        mock_http_ctx = AsyncMock()
        mock_http_ctx.__aenter__ = AsyncMock(return_value=mock_http_ctx)
        mock_http_ctx.__aexit__  = AsyncMock(return_value=False)
        mock_http_ctx.get        = AsyncMock(return_value=mock_resp)
        mock_httpx_cls.return_value = mock_http_ctx

        # Gemini response mock
        mock_gen_resp = MagicMock()
        mock_gen_resp.text = "మీ పంటకు ఆకు తెగులు వ్యాధి ఉంది."
        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_gen_resp)
        mock_genai_cls.return_value = mock_client

        result = await diagnose_photo("https://media.twilio.com/photo.jpg", "te")
        self.assertIn("తెగులు", result)

    @patch("app.services.vision.settings")
    async def test_missing_twilio_credentials_returns_fallback(self, mock_settings):
        """Returns graceful fallback when Twilio credentials are absent."""
        from app.services.vision import diagnose_photo
        mock_settings.TWILIO_ACCOUNT_SID = ""
        mock_settings.TWILIO_AUTH_TOKEN  = ""
        mock_settings.GEMINI_API_KEY     = "gemini_key"

        result = await diagnose_photo("https://media.twilio.com/photo.jpg", "en")
        self.assertIn("officer", result.lower())

    @patch("app.services.vision.httpx.AsyncClient")
    @patch("app.services.vision.settings")
    async def test_http_error_returns_fallback(self, mock_settings, mock_httpx_cls):
        """Returns graceful fallback when image download HTTP fails."""
        import httpx
        from app.services.vision import diagnose_photo

        mock_settings.TWILIO_ACCOUNT_SID = "AC_test"
        mock_settings.TWILIO_AUTH_TOKEN  = "token_test"
        mock_settings.GEMINI_API_KEY     = "gemini_key"

        mock_http_ctx = AsyncMock()
        mock_http_ctx.__aenter__ = AsyncMock(return_value=mock_http_ctx)
        mock_http_ctx.__aexit__  = AsyncMock(return_value=False)
        mock_resp_err = MagicMock()
        mock_resp_err.status_code = 403
        mock_resp_err.text = "Forbidden"
        mock_http_ctx.get = AsyncMock(
            side_effect=httpx.HTTPStatusError("403", request=MagicMock(), response=mock_resp_err)
        )
        mock_httpx_cls.return_value = mock_http_ctx

        result = await diagnose_photo("https://media.twilio.com/photo.jpg", "hi")
        self.assertIn("अधिकारी", result)  # Hindi fallback


# ─────────────────────────────────────────────────────────────────────────────
# 2. Webhook NumMedia > 0 branch
# ─────────────────────────────────────────────────────────────────────────────
class TestWebhookMediaBranch(unittest.TestCase):

    @patch("app.routers.whatsapp_webhook.diagnose_photo")
    @patch("app.routers.whatsapp_webhook.create_escalation")
    @patch("app.routers.whatsapp_webhook.create_plot")
    @patch("app.routers.whatsapp_webhook.get_plot_for_farmer")
    @patch("app.routers.whatsapp_webhook.get_farmer_by_phone")
    @patch("app.routers.whatsapp_webhook.send_whatsapp_message")
    def test_media_message_creates_escalation_and_acks(
        self, mock_send, mock_get_farmer, mock_get_plot,
        mock_create_plot, mock_create_esc, mock_diagnose
    ):
        """Inbound image: diagnoses, creates escalation, sends ACK not diagnosis."""
        mock_get_farmer.return_value = {
            "id": "farmer_1", "language": "en", "village_id": "v01"
        }
        mock_get_plot.return_value = [{"id": "plot_1", "soil_data_ref": "v01"}]
        mock_diagnose.return_value = AsyncMock(return_value="Leaf blight detected.")

        # AsyncMock for the coroutine
        import asyncio

        async def fake_diagnose(image_url, language):
            return "Leaf blight detected."

        mock_diagnose.side_effect = fake_diagnose
        mock_create_esc.return_value = {"id": "esc_1", "status": "pending"}

        payload = {
            "From": "whatsapp:+919876543210",
            "Body": "",
            "NumMedia": "1",
            "MediaUrl0": "https://api.twilio.com/media/crop.jpg",
            "ProfileName": "Ramesh",
        }
        resp = client.post("/webhook/whatsapp", data=payload)
        self.assertEqual(resp.status_code, 200)

        # Escalation was created
        mock_create_esc.assert_called_once_with(
            plot_id="plot_1",
            photo_url="https://api.twilio.com/media/crop.jpg",
            ai_diagnosis="Leaf blight detected.",
        )
        # ACK was sent (not the diagnosis)
        mock_send.assert_called_once()
        sent_body = mock_send.call_args[1]["body"]
        self.assertIn("officer", sent_body.lower())
        self.assertNotIn("Leaf blight", sent_body)

    @patch("app.routers.whatsapp_webhook.get_farmer_by_phone")
    @patch("app.routers.whatsapp_webhook.send_whatsapp_message")
    def test_unknown_farmer_image_prompts_register(self, mock_send, mock_get_farmer):
        """Image from unregistered farmer gets a registration prompt."""
        mock_get_farmer.return_value = None

        payload = {
            "From": "whatsapp:+910000000000",
            "Body": "",
            "NumMedia": "1",
            "MediaUrl0": "https://api.twilio.com/media/crop.jpg",
            "ProfileName": "Unknown",
        }
        resp = client.post("/webhook/whatsapp", data=payload)
        self.assertEqual(resp.status_code, 200)
        mock_send.assert_called_once()
        self.assertIn("రిజిస్టర్", mock_send.call_args[1]["body"])  # Telugu "register" prompt


# ─────────────────────────────────────────────────────────────────────────────
# 3. Escalations router
# ─────────────────────────────────────────────────────────────────────────────
class TestEscalationsRouter(unittest.TestCase):

    @patch("app.routers.escalations.list_pending_escalations")
    @patch("app.routers.escalations.get_plot_by_id")
    @patch("app.routers.escalations.get_farmer_by_id")
    def test_get_pending_returns_list(self, mock_get_farmer, mock_get_plot, mock_list):
        """GET /escalations/pending returns properly shaped list."""
        mock_list.return_value = [{
            "id": "esc_1",
            "photo_url": "https://twilio.com/photo.jpg",
            "ai_diagnosis": "Blast disease",
            "plot_id": "plot_1",
            "status": "pending",
            "created_at": None,
        }]
        mock_get_plot.return_value = {"id": "plot_1", "farmer_id": "farmer_1"}
        mock_get_farmer.return_value = {"id": "farmer_1", "phone": "+91999", "name": "Ramesh"}

        resp = client.get("/escalations/pending")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], "esc_1")
        self.assertEqual(data[0]["farmer_phone"], "+91999")
        self.assertEqual(data[0]["farmer_name"], "Ramesh")
        self.assertEqual(data[0]["ai_diagnosis"], "Blast disease")

    @patch("app.routers.escalations.list_pending_escalations")
    def test_get_pending_empty(self, mock_list):
        """GET /escalations/pending returns empty list when none pending."""
        mock_list.return_value = []
        resp = client.get("/escalations/pending")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    @patch("app.routers.escalations.get_escalation_by_id")
    @patch("app.routers.escalations.resolve_escalation")
    @patch("app.routers.escalations.get_plot_by_id")
    @patch("app.routers.escalations.get_farmer_by_id")
    @patch("app.routers.escalations.send_whatsapp_message")
    def test_resolve_approved_sends_whatsapp(
        self, mock_send, mock_farmer, mock_plot, mock_resolve, mock_get_esc
    ):
        """POST /escalations/{id}/resolve with 'approved' triggers WhatsApp dispatch."""
        mock_get_esc.return_value = {
            "id": "esc_1", "status": "pending", "plot_id": "plot_1",
            "photo_url": "http://photo.jpg", "ai_diagnosis": "Blast",
        }
        mock_resolve.return_value = True
        mock_plot.return_value = {"id": "plot_1", "farmer_id": "farmer_1"}
        mock_farmer.return_value = {"id": "farmer_1", "phone": "+919876543210", "name": "Ramesh"}
        mock_send.return_value = {"sid": "SM123", "status": "queued"}

        resp = client.post("/escalations/esc_1/resolve", json={
            "status": "approved",
            "officer_note": "Looks accurate",
            "final_message": "Your crop has blast disease. Apply Tricyclazole.",
        })
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], "approved")
        self.assertTrue(body["whatsapp_sent"])
        mock_send.assert_called_once_with(
            to_phone="+919876543210",
            body="Your crop has blast disease. Apply Tricyclazole.",
        )

    @patch("app.routers.escalations.get_escalation_by_id")
    @patch("app.routers.escalations.resolve_escalation")
    def test_resolve_rejected_no_whatsapp(self, mock_resolve, mock_get_esc):
        """POST resolve with 'rejected' does NOT send WhatsApp."""
        mock_get_esc.return_value = {
            "id": "esc_2", "status": "pending", "plot_id": "plot_2",
            "photo_url": "http://photo2.jpg", "ai_diagnosis": "Unclear",
        }
        mock_resolve.return_value = True

        resp = client.post("/escalations/esc_2/resolve", json={
            "status": "rejected",
            "officer_note": "Photo too blurry",
            "final_message": "",
        })
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], "rejected")
        self.assertFalse(body["whatsapp_sent"])

    @patch("app.routers.escalations.get_escalation_by_id")
    def test_resolve_already_resolved_returns_409(self, mock_get_esc):
        """Resolving an already-resolved escalation returns 409 Conflict."""
        mock_get_esc.return_value = {
            "id": "esc_3", "status": "approved", "plot_id": "plot_3",
            "photo_url": "", "ai_diagnosis": "",
        }
        resp = client.post("/escalations/esc_3/resolve", json={
            "status": "rejected", "officer_note": "", "final_message": "",
        })
        self.assertEqual(resp.status_code, 409)

    @patch("app.routers.escalations.get_escalation_by_id")
    def test_resolve_approved_without_message_returns_422(self, mock_get_esc):
        """Approving without final_message returns 422 Unprocessable Entity."""
        mock_get_esc.return_value = {
            "id": "esc_4", "status": "pending", "plot_id": "plot_4",
            "photo_url": "", "ai_diagnosis": "",
        }
        resp = client.post("/escalations/esc_4/resolve", json={
            "status": "approved",
            "officer_note": "Good photo",
            "final_message": "",   # empty — should fail
        })
        self.assertEqual(resp.status_code, 422)

    def test_resolve_missing_escalation_returns_404(self):
        """POST resolve for non-existent ID returns 404."""
        with patch("app.routers.escalations.get_escalation_by_id", return_value=None):
            resp = client.post("/escalations/nonexistent/resolve", json={
                "status": "approved",
                "officer_note": "note",
                "final_message": "msg",
            })
        self.assertEqual(resp.status_code, 404)


if __name__ == "__main__":
    unittest.main()
