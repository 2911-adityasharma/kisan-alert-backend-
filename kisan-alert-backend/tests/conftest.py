"""
conftest.py — patch Firebase Admin SDK before any test imports.

Without this, firebase_admin.initialize_app() tries to load ADC credentials
which triggers a slow GCP metadata server timeout (~30s) on machines without
Google Cloud configured. We replace the entire SDK with a MagicMock so
db.py loads instantly, and all actual Firestore calls are mocked per-test.
"""
import sys
import logging
from unittest.mock import MagicMock

# ── Silence SDK noise ──────────────────────────────────────────────────────────
logging.getLogger("firebase_admin").setLevel(logging.CRITICAL)
logging.getLogger("google.auth").setLevel(logging.CRITICAL)
logging.getLogger("google.cloud").setLevel(logging.CRITICAL)

# ── Stub firebase_admin before it gets imported by app.services.db ────────────
# This prevents the network call to GCP metadata server during test collection.
_firebase_mock = MagicMock()
_firestore_mock = MagicMock()
_firestore_mock.SERVER_TIMESTAMP = "SERVER_TIMESTAMP"

sys.modules.setdefault("firebase_admin", _firebase_mock)
sys.modules.setdefault("firebase_admin.credentials", _firebase_mock)
sys.modules.setdefault("firebase_admin.firestore", _firestore_mock)
sys.modules.setdefault("firebase_admin._auth_utils", MagicMock())

# Make initialize_app and get_app not raise
_firebase_mock.initialize_app.return_value = MagicMock()
_firebase_mock.get_app.side_effect = ValueError("No app")  # triggers initialize on first call
