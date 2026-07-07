"""
Escalations router — officer dashboard API contract.

Endpoints:
  GET  /escalations/pending        List all pending escalations with farmer context.
  POST /escalations/{id}/resolve   Approve / modify / reject an escalation.
                                   Sends final_message to farmer on approve/modified.
"""

import logging
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.services.db import (
    list_pending_escalations,
    resolve_escalation,
    get_escalation_by_id,
    get_plot_by_id,
    get_farmer_by_id,
)
from app.services.whatsapp import send_whatsapp_message

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/escalations",
    tags=["Escalations"],
)

# ── Pydantic schemas ───────────────────────────────────────────────────────────

class PendingEscalation(BaseModel):
    """Shape returned by GET /escalations/pending."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    photo_url: str
    ai_diagnosis: str
    farmer_phone: str
    farmer_name: str
    plot_id: str
    created_at: Optional[datetime] = None


class ResolveRequest(BaseModel):
    """Body sent by the officer dashboard to POST /escalations/{id}/resolve."""
    status: Literal["approved", "modified", "rejected"] = Field(
        ...,
        description="Resolution decision: 'approved' sends the AI message as-is, "
                    "'modified' sends officer's final_message, 'rejected' sends nothing.",
    )
    officer_note: str = Field(
        default="",
        description="Officer's internal annotation — stored in the DB, not sent to farmer.",
    )
    final_message: str = Field(
        default="",
        description="Message to send to the farmer. Required when status is "
                    "'approved' or 'modified'.",
    )


class ResolvedEscalation(BaseModel):
    """Shape returned after a resolve action."""
    id: str
    plot_id: str
    photo_url: str
    ai_diagnosis: str
    status: str
    officer_note: str
    final_message: str
    whatsapp_sent: bool
    farmer_phone: Optional[str] = None


# ── Helper: look up the farmer phone for an escalation ────────────────────────

def _resolve_farmer_for_plot(plot_id: str) -> tuple[str, str]:
    """
    Given a plot_id, walk up to the farmer document and return (phone, name).
    Returns ("unknown", "Unknown") on any failure.
    """
    try:
        plot = get_plot_by_id(plot_id)
        if not plot:
            return "unknown", "Unknown"
        farmer = get_farmer_by_id(plot.get("farmer_id", ""))
        if not farmer:
            return "unknown", "Unknown"
        return farmer.get("phone", "unknown"), farmer.get("name", "Unknown")
    except Exception as exc:
        logger.error("Error resolving farmer for plot %s: %s", plot_id, exc)
        return "unknown", "Unknown"


def _firestore_ts_to_datetime(ts) -> Optional[datetime]:
    """Convert a Firestore Timestamp or datetime to a Python datetime, or None."""
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts
    # Firestore Timestamp objects expose a .timestamp() method
    if hasattr(ts, "timestamp"):
        try:
            return datetime.utcfromtimestamp(ts.timestamp())
        except Exception:
            pass
    return None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get(
    "/pending",
    response_model=list[PendingEscalation],
    summary="List all pending escalations",
    description=(
        "Returns every escalation whose status is 'pending', enriched with "
        "the farmer's phone number and name resolved through the linked plot."
    ),
)
async def get_pending_escalations() -> list[PendingEscalation]:
    """
    List all crop disease escalations that are awaiting officer review.
    """
    try:
        raw = list_pending_escalations()
    except Exception as exc:
        logger.error("Failed to fetch pending escalations: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch pending escalations.")

    results: list[PendingEscalation] = []
    for esc in raw:
        plot_id = esc.get("plot_id", "")
        farmer_phone, farmer_name = _resolve_farmer_for_plot(plot_id)
        results.append(
            PendingEscalation(
                id           = esc["id"],
                photo_url    = esc.get("photo_url", ""),
                ai_diagnosis = esc.get("ai_diagnosis", ""),
                farmer_phone = farmer_phone,
                farmer_name  = farmer_name,
                plot_id      = plot_id,
                created_at   = _firestore_ts_to_datetime(esc.get("created_at")),
            )
        )

    logger.info("Returning %d pending escalation(s).", len(results))
    return results


@router.post(
    "/{escalation_id}/resolve",
    response_model=ResolvedEscalation,
    summary="Resolve a pending escalation",
    description=(
        "Officer resolves an escalation by approving, modifying, or rejecting "
        "the AI diagnosis. On 'approved'/'modified', the final_message is sent "
        "to the farmer via WhatsApp. On 'rejected', only the DB row is updated."
    ),
)
async def resolve_escalation_route(
    escalation_id: str,
    body: ResolveRequest,
) -> ResolvedEscalation:
    """
    Approve, modify, or reject an escalation.

    - **approved** : sends `final_message` to the farmer via WhatsApp.
    - **modified**  : sends officer-edited `final_message` to the farmer.
    - **rejected**  : updates DB status only, does NOT contact the farmer.
    """
    # ── Validate that the escalation exists and is still pending ──────────
    escalation = get_escalation_by_id(escalation_id)
    if not escalation:
        raise HTTPException(status_code=404, detail=f"Escalation '{escalation_id}' not found.")

    if escalation.get("status") != "pending":
        raise HTTPException(
            status_code=409,
            detail=f"Escalation is already resolved (status='{escalation.get('status')}').",
        )

    # ── Business rule: message required if not rejecting ──────────────────
    if body.status in {"approved", "modified"} and not body.final_message.strip():
        raise HTTPException(
            status_code=422,
            detail="'final_message' is required when status is 'approved' or 'modified'.",
        )

    # ── Persist the resolution ────────────────────────────────────────────
    success = resolve_escalation(
        id            = escalation_id,
        status        = body.status,
        officer_note  = body.officer_note,
        final_message = body.final_message,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update escalation in database.")

    # ── Send WhatsApp message if approved or modified ─────────────────────
    whatsapp_sent = False
    farmer_phone  = "unknown"

    if body.status in {"approved", "modified"}:
        plot_id = escalation.get("plot_id", "")
        farmer_phone, _ = _resolve_farmer_for_plot(plot_id)

        if farmer_phone and farmer_phone != "unknown":
            try:
                result = send_whatsapp_message(
                    to_phone = farmer_phone,
                    body     = body.final_message,
                )
                whatsapp_sent = result.get("status") not in {"failed", None}
                logger.info(
                    "WhatsApp message sent to %s for escalation %s: status=%s",
                    farmer_phone, escalation_id, result.get("status"),
                )
            except Exception as exc:
                logger.error(
                    "WhatsApp send failed for escalation %s to %s: %s",
                    escalation_id, farmer_phone, exc, exc_info=True,
                )
                whatsapp_sent = False
        else:
            logger.warning(
                "Could not resolve farmer phone for escalation %s — WhatsApp not sent.",
                escalation_id,
            )

    logger.info(
        "Escalation %s resolved: status=%s, whatsapp_sent=%s",
        escalation_id, body.status, whatsapp_sent,
    )

    return ResolvedEscalation(
        id            = escalation_id,
        plot_id       = escalation.get("plot_id", ""),
        photo_url     = escalation.get("photo_url", ""),
        ai_diagnosis  = escalation.get("ai_diagnosis", ""),
        status        = body.status,
        officer_note  = body.officer_note,
        final_message = body.final_message,
        whatsapp_sent = whatsapp_sent,
        farmer_phone  = farmer_phone if body.status != "rejected" else None,
    )
