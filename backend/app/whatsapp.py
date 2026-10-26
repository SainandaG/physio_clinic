"""Sending treatment summaries on WhatsApp.

With the WhatsApp Business Cloud API configured (WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID),
summaries go out automatically as a PDF using an approved message template. Without it, staff get a
wa.me link that opens WhatsApp with the message and PDF link typed in, ready to send.
"""
import re
from typing import Optional, Tuple
from urllib.parse import quote

import httpx

from app.config import settings

GRAPH_URL = "https://graph.facebook.com/v21.0"


def api_configured() -> bool:
    return bool(settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)


def wa_number(phone: str) -> Optional[str]:
    """Indian mobile numbers to international digits: 98765 43210 → 919876543210."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 10:
        digits = "91" + digits
    return digits if len(digits) >= 11 else None


def wa_link(phone: str, text: str) -> Optional[str]:
    number = wa_number(phone)
    return f"https://wa.me/{number}?text={quote(text)}" if number else None


def send_document(phone: str, link: str, filename: str, patient_name: str) -> Tuple[bool, Optional[str]]:
    """Send the PDF through the Cloud API template. Returns (sent, error message)."""
    number = wa_number(phone)
    if not number:
        return False, "Patient has no valid mobile number"
    payload = {
        "messaging_product": "whatsapp",
        "to": number,
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_SUMMARY_TEMPLATE,
            "language": {"code": settings.WHATSAPP_TEMPLATE_LANG},
            "components": [
                {"type": "header", "parameters": [{"type": "document", "document": {"link": link, "filename": filename}}]},
                {"type": "body", "parameters": [{"type": "text", "text": patient_name}]},
            ],
        },
    }
    try:
        r = httpx.post(
            f"{GRAPH_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages", json=payload, timeout=20,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"},
        )
    except httpx.HTTPError as e:
        return False, f"Could not reach WhatsApp: {e.__class__.__name__}"
    if r.status_code >= 400:
        try:
            err = r.json().get("error", {})
            return False, err.get("error_user_msg") or err.get("message") or f"WhatsApp error {r.status_code}"
        except ValueError:
            return False, f"WhatsApp error {r.status_code}"
    return True, None
