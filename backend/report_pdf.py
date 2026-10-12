import io
from datetime import date, timedelta
from html import escape

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

from models import db, User
from reports import period_for, summarise, compare, MIN_DAYS, DISCLAIMER

pdf_bp = Blueprint("report_pdf", __name__)

LIGHT = colors.HexColor("#f0f5f4")


def fmt(value, unit=""):
    return "No data" if value is None else f"{value}{unit}"


def signed(value, unit=""):
    if value is None:
        return "No comparison"
    sign = "+" if value > 0 else ""
    return f"{sign}{value}{unit}"


def chart_png(trend):
    points = [(t["date"], t["wlb_score"]) for t in trend if t["wlb_score"] is not None]
    if not points:
        return None
    fig, ax = plt.subplots(figsize=(7, 3))
    ax.plot(range(len(points)), [p[1] for p in points], marker="o", color="#1e6f5c")
    ax.set_xticks(range(len(points)))
    ax.set_xticklabels([p[0][5:] for p in points], rotation=45, fontsize=8)
    ax.set_ylim(0, 100)
    ax.set_ylabel("Balance score")
    ax.set_title("Balance score trend")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120)
    plt.close(fig)
    buf.seek(0)
    return buf


def table(rows, widths=(7 * cm, 9 * cm)):
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c5d0cd")),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def build_story(user_name, kind, start, end, prev_start, prev_end, message, current, previous, cmp):
    styles = getSampleStyleSheet()
    title, h2, body, small = styles["Title"], styles["Heading2"], styles["BodyText"], styles["Italic"]

    story = [
        Paragraph("Life Balance Report", title),
        Paragraph(f"<b>Name:</b> {escape(user_name)}", body),
        Paragraph(f"<b>Report type:</b> {kind.capitalize()}", body),
        Paragraph(f"<b>Period:</b> {start.isoformat()} to {end.isoformat()}", body),
        Paragraph(f"<b>Generated:</b> {date.today().isoformat()}", body),
        Spacer(1, 0.4 * cm),
    ]
    if message:
        story += [Paragraph(escape(message), body), Spacer(1, 0.3 * cm)]

    story.append(Paragraph("Summary", h2))
    story.append(table([
        ["Measure", "Value"],
        ["Logged days", str(current["days"])],
        ["Average sleep", fmt(current["avg_sleep"], " h")],
        ["Average working hours", fmt(current["avg_work"], " h")],
        ["Average activity", fmt(current["avg_activity"], " min per day")],
        ["Average balance score", fmt(current["avg_wlb"], " / 100")],
    ]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Compared with the previous period", h2))
    story.append(Paragraph(
        f"Previous period: {prev_start.isoformat()} to {prev_end.isoformat()} "
        f"({previous['days']} logged day(s))", body))
    story.append(table([
        ["Measure", "Change"],
        ["Sleep", signed(cmp["sleep_change"], " h")],
        ["Working hours", signed(cmp["work_change"], " h")],
        ["Activity", signed(cmp["activity_change"], " min")],
        ["Balance score", signed(cmp["wlb_change"], " points")],
        ["High-stress days", signed(cmp["high_days_change"])],
    ]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Stress level distribution", h2))
    counts = current["stress_counts"]
    story.append(table([
        ["Stress level", "Days"],
        ["Low", str(counts["Low"])],
        ["Moderate", str(counts["Moderate"])],
        ["High", str(counts["High"])],
    ]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Balance score trend", h2))
    chart = chart_png(current["wlb_trend"])
    if chart:
        story.append(Image(chart, width=16 * cm, height=6.8 * cm))
    else:
        story.append(Paragraph("No balance scores in this period yet.", body))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Best and most difficult days", h2))
    best, hardest = current["best_day"], current["hardest_day"]
    if best:
        story.append(Paragraph(f"Best: {best['date']} (score {best['wlb_score']}, {best['stress_level']} stress)", body))
        story.append(Paragraph(f"Most difficult: {hardest['date']} (score {hardest['wlb_score']}, {hardest['stress_level']} stress)", body))
    else:
        story.append(Paragraph("No scored days in this period.", body))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Most frequent suggestions", h2))
    if current["top_tips"]:
        for item in current["top_tips"]:
            story.append(Paragraph(f"&bull; {escape(item['tip'])} (given {item['times']} times)", body))
    else:
        story.append(Paragraph("No suggestions saved in this period.", body))

    story += [Spacer(1, 0.8 * cm), Paragraph(escape(DISCLAIMER), small)]
    return story


@pdf_bp.route("/pdf", methods=["GET"])
@jwt_required()
def report_pdf():
    user_id = int(get_jwt_identity())
    kind = request.args.get("type", "weekly")
    today = date.today()

    start, end, error = period_for(kind, today, request.args.get("from"), request.args.get("to"))
    if error:
        return jsonify({"error": error}), 400

    length = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=length - 1)

    current = summarise(user_id, start, end)
    previous = summarise(user_id, prev_start, prev_end)
    cmp = compare(current, previous)

    needed = MIN_DAYS.get(kind, 3)
    if current["days"] == 0:
        message = "There are no records in this period yet. Add daily entries to build a report."
    elif current["days"] < needed:
        message = (f"You have {current['days']} logged day(s) in this period. A full {kind} report "
                   f"needs at least {needed}. The available days are shown below.")
    else:
        message = None

    user = db.session.get(User, user_id)
    user_name = user.name if user else "User"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm, title="Life Balance Report")
    doc.build(build_story(user_name, kind, start, end, prev_start, prev_end,
                          message, current, previous, cmp))
    buf.seek(0)

    filename = f"life_balance_{kind}_{start.isoformat()}_{end.isoformat()}.pdf"
    return send_file(buf, mimetype="application/pdf", as_attachment=True, download_name=filename)