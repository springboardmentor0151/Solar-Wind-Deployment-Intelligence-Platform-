"""
Reports & Export System — generates PDF site-assessment reports and Excel
workbooks summarizing a site's full intelligence analysis.
"""
import io
from datetime import datetime

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def build_pdf_report(site: dict, analysis: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=colors.HexColor("#166534"))
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], spaceBefore=14, textColor=colors.HexColor("#166534"))

    elems = []
    elems.append(Paragraph("Solar &amp; Wind Deployment Intelligence Report", title_style))
    elems.append(Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    elems.append(Spacer(1, 0.6 * cm))

    suit = analysis["suitability_result"]
    solar = analysis["solar_result"]
    wind = analysis["wind_result"]
    forecast = analysis["forecast_result"]

    elems.append(Paragraph(f"Site: {site['name']}", h2))
    meta_tbl = Table([
        ["Project ID", site.get("project_id", "-")],
        ["Coordinates", f"{site['latitude']:.4f}, {site['longitude']:.4f}"],
        ["Region", site.get("region") or "-"],
        ["Land Area", f"{site.get('land_area_hectares', '-')} ha"],
        ["Overall Suitability Score", f"{suit['overall_score']} / 100"],
        ["Category", suit["category"]],
        ["Recommended Technology", suit["recommended_technology"]["recommendation"]],
    ], colWidths=[6 * cm, 10 * cm])
    meta_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#166534")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
    ]))
    elems.append(meta_tbl)

    elems.append(Paragraph("Suitability Sub-Scores (weighted)", h2))
    sub = suit["sub_scores"]
    w = suit["weights"]
    sub_tbl = Table(
        [["Factor", "Score (0-100)", "Weight"]] + [
            [k.title(), sub[k], f"{int(w[k]*100)}%"] for k in sub
        ],
        colWidths=[6 * cm, 5 * cm, 3 * cm],
    )
    sub_tbl.setStyle(_std_table_style())
    elems.append(sub_tbl)

    elems.append(Paragraph("Solar Potential", h2))
    solar_tbl = Table([
        ["Annual Irradiance", f"{solar['annual_irradiance_kwh_m2_day']} kWh per m2 per day"],
        ["Peak Sun Hours", f"{solar['peak_sun_hours']} hrs/day"],
        ["Capacity Factor", f"{solar['capacity_factor_pct']}%"],
        ["Expected Output", f"{solar['expected_output_total_mwh_year']:,.0f} MWh/yr"],
    ], colWidths=[6 * cm, 10 * cm])
    solar_tbl.setStyle(_std_table_style())
    elems.append(solar_tbl)

    elems.append(Paragraph("Wind Potential", h2))
    wind_tbl = Table([
        ["Average Wind Speed", f"{wind['avg_wind_speed_ms']} m/s"],
        ["Wind Power Density", f"{wind['wind_power_density_w_m2']} W per m2"],
        ["Capacity Factor", f"{wind['capacity_factor_pct']}%"],
        ["Turbine Class", wind["turbine_suitability_class"]],
        ["Expected Output", f"{wind['expected_output_total_mwh_year']:,.0f} MWh/yr"],
    ], colWidths=[6 * cm, 10 * cm])
    wind_tbl.setStyle(_std_table_style())
    elems.append(wind_tbl)

    elems.append(Paragraph("Investment & Forecast Summary", h2))
    fc_tbl = Table([
        ["Technology", forecast["technology"]],
        ["Capacity", f"{forecast['capacity_mw']} MW"],
        ["Estimated CAPEX", f"${forecast['estimated_capex_usd']:,.0f}"],
        ["Est. Annual OPEX", f"${forecast['estimated_annual_opex_usd']:,.0f}"],
        ["25-yr Gross Revenue", f"${forecast['lifetime_gross_revenue_usd']:,.0f}"],
        ["25-yr Net Revenue", f"${forecast['lifetime_net_revenue_usd']:,.0f}"],
        ["Simple Payback", f"{forecast['simple_payback_years']} years"],
        ["Homes Powered (est.)", f"{forecast['homes_powered_estimate']:,}"],
    ], colWidths=[6 * cm, 10 * cm])
    fc_tbl.setStyle(_std_table_style())
    elems.append(fc_tbl)

    doc.build(elems)
    return buffer.getvalue()


def _std_table_style():
    return TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0fdf4")),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ])


def build_excel_report(site: dict, analysis: dict) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Site Summary"

    header_fill = PatternFill(start_color="166534", end_color="166534", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)

    suit = analysis["suitability_result"]
    rows = [
        ("Project ID", site.get("project_id")),
        ("Site Name", site.get("name")),
        ("Latitude", site.get("latitude")),
        ("Longitude", site.get("longitude")),
        ("Overall Suitability Score", suit["overall_score"]),
        ("Category", suit["category"]),
        ("Recommended Technology", suit["recommended_technology"]["recommendation"]),
    ]
    ws.append(["Field", "Value"])
    for c in ws[1]:
        c.fill = header_fill
        c.font = header_font
    for r in rows:
        ws.append(r)
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 40

    ws2 = wb.create_sheet("Sub-Scores")
    ws2.append(["Factor", "Score", "Weight"])
    for c in ws2[1]:
        c.fill = header_fill
        c.font = header_font
    for k, v in suit["sub_scores"].items():
        ws2.append([k.title(), v, suit["weights"][k]])

    ws3 = wb.create_sheet("Monthly Generation")
    solar = analysis["solar_result"]
    wind = analysis["wind_result"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    ws3.append(["Month", "Solar Generation (MWh)", "Wind Generation (MWh)"])
    for c in ws3[1]:
        c.fill = header_fill
        c.font = header_font
    for i, m in enumerate(months):
        ws3.append([m, solar["monthly_generation_mwh"][i], wind["monthly_generation_mwh"][i]])

    ws4 = wb.create_sheet("Forecast")
    forecast = analysis["forecast_result"]
    ws4.append(["Metric", "Value"])
    for c in ws4[1]:
        c.fill = header_fill
        c.font = header_font
    for k in ["technology", "capacity_mw", "estimated_capex_usd", "estimated_annual_opex_usd",
              "lifetime_gross_revenue_usd", "lifetime_net_revenue_usd", "simple_payback_years",
              "homes_powered_estimate"]:
        ws4.append([k.replace("_", " ").title(), forecast[k]])

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
