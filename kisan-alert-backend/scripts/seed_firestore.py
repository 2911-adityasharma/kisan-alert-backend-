"""
Seed Firestore with demo data — 3 farmers, 3 plots, 3 village_defaults.

Usage:
    cd kisan-alert-backend
    python -m scripts.seed_firestore

Prerequisites:
    - FIREBASE_PROJECT_ID and FIREBASE_CREDENTIALS_PATH set in .env
      (or Application Default Credentials configured)

Idempotent: uses deterministic document IDs so re-running overwrites cleanly.
"""

import os
import sys
import logging

# Ensure the project root is on the path so `app.config` resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)


# ── Firebase init (reuse the same logic as db.py) ─────────────────────────────

def _init_firebase():
    if firebase_admin._apps:
        return firestore.client()

    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    project_id = settings.FIREBASE_PROJECT_ID
    options = {}
    if project_id:
        options["projectId"] = project_id

    if cred_path and os.path.exists(cred_path):
        logger.info("Initializing Firebase with credentials from %s", cred_path)
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, options)
    else:
        logger.info("Initializing Firebase with application default credentials")
        firebase_admin.initialize_app(options=options)

    return firestore.client()


# ── Seed data ─────────────────────────────────────────────────────────────────

VILLAGE_DEFAULTS = {
    "village_anantapur": {
        "n": 145,
        "p": 18,
        "k": 210,
        "ph": 7.2,
        "organic_carbon": 0.42,
        "label": "Anantapur, Andhra Pradesh — Red sandy loam",
    },
    "village_warangal": {
        "n": 220,
        "p": 28,
        "k": 185,
        "ph": 6.8,
        "organic_carbon": 0.58,
        "label": "Warangal, Telangana — Black cotton soil",
    },
    "village_sehore": {
        "n": 195,
        "p": 24,
        "k": 240,
        "ph": 7.5,
        "organic_carbon": 0.51,
        "label": "Sehore, Madhya Pradesh — Medium black soil",
    },
}

FARMERS = [
    {
        "doc_id": "farmer_ravi",
        "phone": "919876543210",
        "name": "Ravi Kumar",
        "village_id": "village_anantapur",
        "language": "te",
        "onboarding_stage": "active",
    },
    {
        "doc_id": "farmer_lakshmi",
        "phone": "919876543211",
        "name": "Lakshmi Devi",
        "village_id": "village_warangal",
        "language": "te",
        "onboarding_stage": "active",
    },
    {
        "doc_id": "farmer_ramesh",
        "phone": "919876543212",
        "name": "Ramesh Yadav",
        "village_id": "village_sehore",
        "language": "hi",
        "onboarding_stage": "active",
    },
]

PLOTS = [
    {
        "doc_id": "plot_ravi_01",
        "farmer_id": "farmer_ravi",
        "lat": 15.5057,
        "lng": 78.5159,
        "crop_current": "Groundnut",
        "soil_data_ref": "village_default:village_anantapur",
    },
    {
        "doc_id": "plot_lakshmi_01",
        "farmer_id": "farmer_lakshmi",
        "lat": 17.9689,
        "lng": 79.5941,
        "crop_current": "Rice",
        "soil_data_ref": "village_default:village_warangal",
    },
    {
        "doc_id": "plot_ramesh_01",
        "farmer_id": "farmer_ramesh",
        "lat": 23.2052,
        "lng": 77.0867,
        "crop_current": "Soybean",
        "soil_data_ref": "village_default:village_sehore",
    },
]


# ── Seed functions ────────────────────────────────────────────────────────────

def seed_village_defaults(db):
    """Write village_defaults documents (one per village)."""
    for village_id, data in VILLAGE_DEFAULTS.items():
        doc_ref = db.collection("village_defaults").document(village_id)
        doc_ref.set(data)
        logger.info("  ✔ village_defaults/%s", village_id)


def seed_farmers(db):
    """Write farmer documents."""
    for farmer in FARMERS:
        doc_id = farmer.pop("doc_id")
        farmer["created_at"] = firestore.SERVER_TIMESTAMP
        doc_ref = db.collection("farmers").document(doc_id)
        doc_ref.set(farmer)
        logger.info("  ✔ farmers/%s  (%s, %s)", doc_id, farmer["name"], farmer["language"])
        # Restore doc_id so the dict isn't mutated for re-runs
        farmer["doc_id"] = doc_id


def seed_plots(db):
    """Write plot documents."""
    for plot in PLOTS:
        doc_id = plot.pop("doc_id")
        plot["created_at"] = firestore.SERVER_TIMESTAMP
        doc_ref = db.collection("plots").document(doc_id)
        doc_ref.set(plot)
        logger.info(
            "  ✔ plots/%s  (farmer=%s, crop=%s)",
            doc_id, plot["farmer_id"], plot["crop_current"],
        )
        plot["doc_id"] = doc_id


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    logger.info("=" * 60)
    logger.info("Kisan Alert — Firestore Seed Script")
    logger.info("=" * 60)

    try:
        db = _init_firebase()
    except Exception as exc:
        logger.error("Failed to initialize Firebase: %s", exc)
        sys.exit(1)

    logger.info("")
    logger.info("Seeding village_defaults...")
    seed_village_defaults(db)

    logger.info("")
    logger.info("Seeding farmers...")
    seed_farmers(db)

    logger.info("")
    logger.info("Seeding plots...")
    seed_plots(db)

    logger.info("")
    logger.info("=" * 60)
    logger.info("Done! 3 farmers, 3 plots, 3 village_defaults seeded.")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
