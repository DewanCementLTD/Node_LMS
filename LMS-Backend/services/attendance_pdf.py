"""Attendance report PDF generation (reportlab).

Builds a landscape A4 PDF of one employee's DUTY_ROSTER_V rows for a date
range — the same data the app's attendance report screen shows — plus a
summary line. Returned as bytes; the router streams it as a download.
"""

from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from repositories.attendance_repository import (
    get_attendance_report_range,
    get_attendance_summary,
    get_roster_employee_name,
)

_STATUS_COLORS = {
    "Late": colors.HexColor("#FFF3C4"),      # yellow
    "Half Day": colors.HexColor("#FFE0B2"),  # orange
    "Absent": colors.HexColor("#FFCDD2"),    # red
}


def _fmt_date(d: str) -> str:
    try:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%d-%b-%Y")
    except ValueError:
        return d


def build_attendance_pdf(card_no: str, from_date: str, to_date: str) -> bytes:
    rows = get_attendance_report_range(card_no, from_date, to_date)
    summary = get_attendance_summary(card_no, from_date, to_date)
    emp_name = get_roster_employee_name(card_no) or ""

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        leftMargin=12 * mm, rightMargin=12 * mm,
        topMargin=12 * mm, bottomMargin=12 * mm,
        title=f"Attendance Report {card_no}",
    )
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Attendance Report", styles["Title"]))
    story.append(Paragraph(
        f"<b>{emp_name}</b> &nbsp;&nbsp; Card: {card_no} &nbsp;&nbsp; "
        f"Period: {_fmt_date(from_date)} to {_fmt_date(to_date)}",
        styles["Normal"],
    ))
    story.append(Spacer(1, 6 * mm))

    header = ["Date", "Day", "Shift", "Check-In", "Check-Out",
              "Worked", "Status", "Remarks"]
    data = [header]
    row_styles = []
    for i, r in enumerate(rows, start=1):
        worked = (
            f"{r.get('w_hrs', 0)}h {r.get('w_mnt', 0):02d}m"
            if (r.get("w_hrs") or r.get("w_mnt")) else "-"
        )
        remarks = r.get("leave_remarks") or r.get("roster_remarks") or ""
        data.append([
            r.get("roster_date") or "",
            (r.get("day_name") or "")[:3],
            r.get("roster_shift") or "",
            r.get("in_time") or "-",
            r.get("out_time") or "-",
            worked,
            r.get("status") or "",
            remarks[:60],
        ])
        bg = _STATUS_COLORS.get(r.get("status"))
        if bg:
            row_styles.append(("BACKGROUND", (0, i), (-1, i), bg))

    table = Table(
        data, repeatRows=1,
        colWidths=[26 * mm, 14 * mm, 14 * mm, 22 * mm, 22 * mm,
                   22 * mm, 22 * mm, 90 * mm],
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263238")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B0BEC5")),
        ("ALIGN", (1, 0), (6, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.HexColor("#F5F7F8")]),
        *row_styles,
    ]))
    story.append(table)

    if summary:
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph(
            f"<b>Summary:</b> {summary.get('total_days', 0)} days &nbsp;|&nbsp; "
            f"Present: {summary.get('present', 0)} &nbsp;|&nbsp; "
            f"Absent: {summary.get('absent_days', 0)} &nbsp;|&nbsp; "
            f"Late: {summary.get('late_days', 0)} &nbsp;|&nbsp; "
            f"Half days: {summary.get('half_days', 0)} &nbsp;|&nbsp; "
            f"Incomplete (no check-out): {summary.get('incomplete', 0)}",
            styles["Normal"],
        ))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        f"Generated {datetime.now():%d-%b-%Y %H:%M}",
        styles["Italic"],
    ))

    doc.build(story)
    return buf.getvalue()
