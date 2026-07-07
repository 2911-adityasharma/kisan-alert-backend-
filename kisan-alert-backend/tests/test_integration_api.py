import sys
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

class TestIntegrationApi(unittest.TestCase):

    def setUp(self):
        from app.config import settings
        self.old_key = settings.GEMINI_API_KEY
        settings.GEMINI_API_KEY = "dummy_key_for_testing"

    def tearDown(self):
        from app.config import settings
        settings.GEMINI_API_KEY = self.old_key

    # ── Auth Endpoints ────────────────────────────────────────────────────────
    
    def test_send_otp_success(self):
        """POST /api/auth/otp/send returns success for valid phone."""
        resp = client.post("/api/auth/otp/send", json={"phone": "919876543210"})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["success"])

    def test_send_otp_invalid_phone(self):
        """POST /api/auth/otp/send returns 422 for short phone."""
        resp = client.post("/api/auth/otp/send", json={"phone": "123"})
        self.assertEqual(resp.status_code, 422)

    @patch("app.routers.auth.get_farmer_by_phone")
    def test_verify_otp_registered(self, mock_get_farmer):
        """POST /api/auth/otp/verify returns onboarding_required=False if farmer exists."""
        mock_get_farmer.return_value = {
            "id": "farmer_ravi",
            "name": "Ravi Kumar",
            "phone": "919876543210",
            "village_id": "village_anantapur",
            "language": "te",
            "onboarding_stage": "active"
        }
        
        resp = client.post("/api/auth/otp/verify", json={"phone": "919876543210", "otp": "123456"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["onboarding_required"])
        self.assertEqual(data["farmer"]["name"], "Ravi Kumar")

    @patch("app.routers.auth.get_farmer_by_phone")
    def test_verify_otp_new_farmer(self, mock_get_farmer):
        """POST /api/auth/otp/verify returns onboarding_required=True if phone not found."""
        mock_get_farmer.return_value = None
        
        resp = client.post("/api/auth/otp/verify", json={"phone": "919876543299", "otp": "123456"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["onboarding_required"])

    def test_verify_otp_incorrect(self):
        """POST /api/auth/otp/verify returns 401 for bad OTP."""
        resp = client.post("/api/auth/otp/verify", json={"phone": "919876543210", "otp": "000000"})
        self.assertEqual(resp.status_code, 401)

    @patch("app.routers.auth.get_farmer_by_phone")
    @patch("app.routers.auth.create_farmer")
    @patch("app.routers.auth.create_plot")
    @patch("app.services.db.update_farmer_onboarding")
    def test_register_farmer(self, mock_update, mock_create_plot, mock_create_farmer, mock_get_phone):
        """POST /api/auth/register creates farmer and plot documents."""
        mock_get_phone.return_value = None
        mock_create_farmer.return_value = {
            "id": "new_farmer_id",
            "name": "New Farmer",
            "phone": "919876543299",
            "village_id": "village_sehore",
            "language": "hi",
            "onboarding_stage": "new"
        }
        mock_create_plot.return_value = {
            "id": "new_plot_id",
            "farmer_id": "new_farmer_id",
            "crop_current": "Soybean"
        }
        mock_update.return_value = True

        payload = {
            "phone": "919876543299",
            "name": "New Farmer",
            "village_id": "village_sehore",
            "language": "hi",
            "crop_current": "Soybean",
            "plot_size": 2.5
        }
        resp = client.post("/api/auth/register", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["farmer"]["id"], "new_farmer_id")
        self.assertEqual(data["plot"]["id"], "new_plot_id")

    # ── Dashboard Endpoint ────────────────────────────────────────────────────

    @patch("app.routers.dashboard.get_farmer_by_phone")
    @patch("app.routers.dashboard.get_plot_for_farmer")
    @patch("app.routers.dashboard.weather_service.get_field_snapshot", new_callable=AsyncMock)
    def test_dashboard_registered_farmer(self, mock_weather, mock_get_plots, mock_get_farmer):
        """GET /api/dashboard retrieves dynamic weather, prices, and advisory details."""
        mock_get_farmer.return_value = {
            "id": "farmer_ravi",
            "name": "Ravi Kumar",
            "phone": "919876543210",
            "village_id": "village_anantapur",
            "language": "te"
        }
        mock_get_plots.return_value = [{"id": "plot_ravi_01", "crop_current": "Groundnut"}]
        mock_weather.return_value = {
            "current": {"temp_c": 31.5, "condition": "Clear", "humidity_pct": 60, "wind_speed_ms": 4.5},
            "forecast": {"rainfall_next_5d_mm": 2.5}
        }

        resp = client.get("/api/dashboard?phone=919876543210")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["farmer"]["name"], "Ravi Kumar")
        self.assertEqual(data["weather"]["temp"], 31.5)
        self.assertIn("వేరుశనగ", data["seasonal_advisory"])

    # ── Chat Endpoint ─────────────────────────────────────────────────────────

    @patch("app.routers.chat.genai.Client")
    def test_chat_assistant_success(self, mock_genai_cls):
        """POST /api/chat calls Gemini generating dynamic conversational text."""
        mock_resp = MagicMock()
        mock_resp.text = "యూరియాను నాటిన 21 రోజులకు మొదటిసారి వేయాలి."
        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_resp)
        mock_genai_cls.return_value = mock_client

        payload = {
          "message": "యూరియా ఎప్పుడు వేయాలి?",
          "language": "te"
        }
        resp = client.post("/api/chat", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("యూరియాను", data["text"])

    # ── Scan Endpoint ─────────────────────────────────────────────────────────

    @patch("app.routers.scan.genai.Client")
    @patch("app.routers.scan.get_farmer_by_phone")
    @patch("app.routers.scan.get_plot_for_farmer")
    @patch("app.routers.scan.create_escalation")
    def test_scan_crop_success(self, mock_create_esc, mock_get_plots, mock_get_farmer, mock_genai_cls):
        """POST /api/scan uploads image, gets Gemini Vision JSON, and logs escalation."""
        mock_get_farmer.return_value = {"id": "farmer_ravi"}
        mock_get_plots.return_value = [{"id": "plot_ravi_01"}]
        mock_create_esc.return_value = {"id": "new_escalation_id"}
        
        mock_resp = MagicMock()
        mock_resp.text = '{"disease_name": "Leaf Blast", "disease_name_local": "ఆకు తెగులు", "severity": "HIGH SEVERITY", "confidence": "92%", "affected_pct": "20%", "risk_level": "High", "about": "Symptoms of leaf blast.", "treatments": []}'
        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_resp)
        mock_genai_cls.return_value = mock_client

        # Mock image content
        files = {"file": ("test_leaf.jpg", b"\xff\xd8\xff\xe0", "image/jpeg")}
        data = {"phone": "919876543210", "language": "te"}
        
        resp = client.post("/api/scan", data=data, files=files)
        self.assertEqual(resp.status_code, 200)
        resp_data = resp.json()
        self.assertTrue(resp_data["success"])
        self.assertEqual(resp_data["data"]["disease_name"], "Leaf Blast")
        self.assertEqual(resp_data["data"]["escalation_id"], "new_escalation_id")
        self.assertIn("/static/uploads/", resp_data["data"]["photo_url"])
