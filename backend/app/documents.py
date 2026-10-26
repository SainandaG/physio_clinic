"""Treatment summary PDF on the clinic letterhead (no prices).

The letterhead is drawn on every page: gold top bar, gold logo and wordmark on the left, the
doctor's name and credentials on the right, a faint logo watermark, and an address / QR / contact
footer under a gold rule. All letterhead text comes from Admin → Website content → Treatment summaries.
"""
from datetime import datetime
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, ListFlowable, ListItem, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

from app.slots import CLINIC_TZ, to_clinic_time

ASSETS = Path(__file__).parent / "assets"
W, H = A4

GOLD_LIGHT = colors.HexColor("#ecd393")
GOLD = colors.HexColor("#c9a451")
GOLD_DARK = colors.HexColor("#a37b2c")
NAVY = colors.HexColor("#102f52")
BLUE = colors.HexColor("#1f5aa6")      # doctor's name on the letterhead
RED = colors.HexColor("#d23a2c")       # specialties on the letterhead
INK = colors.HexColor("#243447")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#e5dfd2")

MARGIN_X = 18 * mm
HEADER_H = 46 * mm
FOOTER_H = 36 * mm

styles = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, alignment=TA_CENTER, spaceAfter=2),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=NAVY, spaceBefore=12, spaceAfter=5),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=15, textColor=INK),
    "label": ParagraphStyle("label", fontName="Helvetica", fontSize=8, leading=10, textColor=MUTED),
    "value": ParagraphStyle("value", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=INK),
    "small": ParagraphStyle("small", fontName="Helvetica-Oblique", fontSize=8.5, leading=12, textColor=MUTED),
}


def _text(value: str) -> str:
    """User text → safe Paragraph markup, keeping line breaks."""
    return escape(value or "").replace("\n", "<br/>")


def _gold_bar(c, x, y, w, h):
    steps = 24
    for i in range(steps):
        t = i / (steps - 1)
        col = colors.Color(*[a + (b - a) * (1 - abs(2 * t - 1)) for a, b in zip(GOLD_DARK.rgb(), GOLD_LIGHT.rgb())])
        c.setFillColor(col)
        c.rect(x + w * i / steps, y, w / steps + 0.5, h, stroke=0, fill=1)


def _qr(c, link, x, y, size):
    widget = QrCodeWidget(link, barLevel="M")
    b = widget.getBounds()
    bw, bh = b[2] - b[0], b[3] - b[1]
    d = Drawing(size, size, transform=[size / bw, 0, 0, size / bh, 0, 0])
    d.add(widget)
    renderPDF.draw(d, c, x, y)


def _letterhead(c, lh: dict, clinic: dict):
    c.saveState()
    # Watermark
    wm = ASSETS / "letterhead-watermark.png"
    if wm.exists():
        ww = 120 * mm
        c.drawImage(str(wm), (W - ww) / 2, (H - ww * 660 / 560) / 2 - 6 * mm, width=ww, height=ww * 660 / 560, mask="auto")

    # Top gold bar
    _gold_bar(c, MARGIN_X - 6 * mm, H - 9 * mm, W - 2 * (MARGIN_X - 6 * mm), 2.2 * mm)

    # Logo: gold mark + wordmark
    top = H - 14 * mm
    mark = ASSETS / "letterhead-mark.png"
    mh = 19 * mm
    if mark.exists():
        c.drawImage(str(mark), MARGIN_X, top - mh, width=mh * 560 / 446, height=mh, mask="auto")
    tx = MARGIN_X + mh * 560 / 446 + 2.5 * mm
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(tx, top - 10 * mm, " ".join("SRINI"))
    word_w = c.stringWidth(" ".join("SRINI"), "Helvetica-Bold", 25)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7.6)
    label = "PHYSIO CLINICS"
    lw = c.stringWidth(label, "Helvetica-Bold", 7.6)
    lx = tx + (word_w - lw) / 2
    c.drawString(lx, top - 14 * mm, label)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(tx, top - 13.3 * mm, lx - 1.5 * mm, top - 13.3 * mm)
    c.line(lx + lw + 1.5 * mm, top - 13.3 * mm, tx + word_w, top - 13.3 * mm)
    c.setFillColor(GOLD_DARK)
    c.setFont("Helvetica-Bold", 5.2)
    c.drawCentredString(tx + word_w / 2, top - 17 * mm, "MOVEMENT IS MEDICINE")

    # Doctor
    rx = W - MARGIN_X
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 19)
    c.drawRightString(rx, top - 6.5 * mm, lh["doctor_name"])
    y = top - 11 * mm
    if lh["doctor_credentials"]:
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawRightString(rx, y, lh["doctor_credentials"])
        y -= 3.8 * mm
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 7.2)
    for line in lh["doctor_specialties"]:
        c.drawRightString(rx, y, line)
        y -= 3.6 * mm

    # Footer
    fy = FOOTER_H - 6 * mm
    _gold_bar(c, MARGIN_X - 6 * mm, fy, W - 2 * (MARGIN_X - 6 * mm), 1.2 * mm)
    cx = W / 2
    qr_size = 19 * mm
    qx, qy = cx - qr_size / 2, fy - 4 * mm - qr_size
    # Google-coloured frame, as on the printed letterhead
    for col, (x1, y1, x2, y2) in zip(
        ("#4285F4", "#EA4335", "#FBBC05", "#34A853"),
        ((qx, qy + qr_size, qx + qr_size, qy + qr_size), (qx + qr_size, qy + qr_size, qx + qr_size, qy),
         (qx + qr_size, qy, qx, qy), (qx, qy, qx, qy + qr_size)),
    ):
        c.setStrokeColor(colors.HexColor(col))
        c.setLineWidth(2.2)
        c.line(x1 + (1 if x1 < x2 else -1 if x1 > x2 else 0), y1, x2, y2)
    link = lh["qr_link"] or clinic["map_link"]
    if link:
        _qr(c, link, qx + 1.2 * mm, qy + 1.2 * mm, qr_size - 2.4 * mm)

    ax = cx - qr_size / 2 - 4 * mm
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(ax, qy + qr_size - 4 * mm, "Address")
    c.setFont("Helvetica", 7.6)
    ly = qy + qr_size - 9 * mm
    for line in lh["address_lines"]:
        c.drawRightString(ax, ly, line)
        ly -= 3.6 * mm

    bx = cx + qr_size / 2 + 4 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(bx, qy + qr_size - 4 * mm, "Contact")
    c.setFont("Helvetica", 7.6)
    ly = qy + qr_size - 9 * mm
    if lh["phone"]:
        c.drawString(bx, ly, lh["phone"])
        ly -= 3.6 * mm
    if lh["email"]:
        c.drawString(bx, ly, f"Email : {lh['email']}")
    c.restoreState()


def _date(d) -> str:
    if not d:
        return "—"
    if isinstance(d, datetime):
        d = to_clinic_time(d).date()
    return d.strftime("%d %b %Y")


def render_summary_pdf(summary, content: dict) -> bytes:
    lh, clinic = content["letterhead"], content["clinic"]
    patient, appt, doctor = summary.patient, summary.appointment, summary.doctor
    buf = BytesIO()
    doc = BaseDocTemplate(
        buf, pagesize=A4, title=f"{summary.title or lh['document_title']} — {patient.name}",
        author=clinic["name"], subject="Treatment summary",
        leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=HEADER_H, bottomMargin=FOOTER_H + 4 * mm,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body", showBoundary=0)
    doc.addPageTemplates([PageTemplate(id="letterhead", frames=[frame], onPage=lambda c, d: _letterhead(c, lh, clinic))])

    issued = summary.updated_at or summary.created_at or datetime.now(CLINIC_TZ)
    visit = appt.scheduled_at if appt else None
    age_gender = " / ".join(filter(None, [f"{patient.age} yrs" if patient.age else None, (patient.gender or "").title() or None])) or "—"
    cell = lambda label, value: [Paragraph(label, styles["label"]), Paragraph(_text(value), styles["value"])]  # noqa: E731
    details = Table(
        [
            [*cell("Patient", patient.name), *cell("Patient ID", f"SPC-{patient.id:04d}")],
            [*cell("Age / Gender", age_gender), *cell("Date", _date(issued))],
            [*cell("Treatment", appt.service.name if appt and appt.service else "Physiotherapy"), *cell("Visit", _date(visit))],
        ],
        colWidths=[22 * mm, doc.width / 2 - 22 * mm, 22 * mm, doc.width / 2 - 22 * mm],
    )
    details.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.Color(1, 1, 1, alpha=0.85)),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ]))

    story = [
        Spacer(1, 2 * mm),
        Paragraph(escape((summary.title or lh["document_title"]).upper()), styles["title"]),
        Spacer(1, 4 * mm),
        details,
    ]
    if summary.findings:
        story += [Paragraph("Assessment", styles["h"]), Paragraph(_text(summary.findings), styles["body"])]
    if summary.notes:
        story += [Paragraph("Doctor's notes", styles["h"]), Paragraph(_text(summary.notes), styles["body"])]
    exercises = [e for e in (summary.exercises or []) if e and e.strip()]
    if exercises:
        story += [
            Paragraph("Home exercise plan", styles["h"]),
            ListFlowable([ListItem(Paragraph(_text(e), styles["body"]), leftIndent=14) for e in exercises],
                         bulletType="1", bulletFontName="Helvetica-Bold", bulletColor=GOLD_DARK, leftIndent=14),
        ]
    if summary.follow_up_date:
        story += [Paragraph("Next follow-up", styles["h"]), Paragraph(_date(summary.follow_up_date), styles["body"])]

    signer = doctor.name if doctor else lh["doctor_name"]
    signer_line = (doctor.qualification if doctor and doctor.qualification else lh["doctor_credentials"].title())
    story += [
        Spacer(1, 12 * mm),
        KeepTogether([
            Table([[""], [Paragraph(f"<b>{escape(signer)}</b><br/>{escape(signer_line)}", styles["body"])]],
                  colWidths=[62 * mm], hAlign="RIGHT",
                  style=TableStyle([("LINEABOVE", (0, 1), (0, 1), 0.8, NAVY), ("TOPPADDING", (0, 1), (0, 1), 4),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 0)])),
        ]),
    ]
    if lh["closing_note"]:
        story += [Spacer(1, 6 * mm), Paragraph(_text(lh["closing_note"]), styles["small"])]

    doc.build(story)
    return buf.getvalue()


def summary_filename(summary) -> str:
    name = "".join(ch if ch.isalnum() else "-" for ch in summary.patient.name).strip("-") or "patient"
    issued = summary.updated_at or summary.created_at or datetime.now(CLINIC_TZ)
    return f"Treatment-summary-{name}-{to_clinic_time(issued).date().isoformat()}.pdf"


