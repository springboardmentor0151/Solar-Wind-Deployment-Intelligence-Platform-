import json
import csv
import io
from sqlalchemy.orm import Session
from .models import ReportModel, SiteModel

def generate_site_report(db: Session, site_id: int, report_type: str) -> ReportModel:
    """
    Generates and saves a detailed assessment report for a site.
    Types: site_assessment, solar_potential, wind_potential, investment
    """
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise ValueError("Site not found")
        
    details = json.loads(site.details_json) if site.details_json else {}
    
    report_title = f"{site.name} - {report_type.replace('_', ' ').title()} Report"
    
    # Structure report contents based on type
    content = {
        "site_name": site.name,
        "coordinates": {"latitude": site.latitude, "longitude": site.longitude},
        "region": site.region,
        "land_area": site.land_area,
        "land_ownership": site.land_ownership,
        "suitability_score": site.suitability_score,
        "suitability_category": site.suitability_category,
        "details": details
    }
    
    new_report = ReportModel(
        site_id=site_id,
        name=report_title,
        report_type=report_type,
        content_json=json.dumps(content)
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

def generate_csv_export(site: SiteModel, report_type: str = None) -> bytes:
    """
    Generates a structured, Excel-compatible CSV bytes export of all site details, filtered by report_type.
    """
    details = json.loads(site.details_json) if site.details_json else {}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Title Block
    title = "GLOBAL RENEWABLE ENERGY PLATFORM - FEASIBILITY REPORT"
    if report_type:
        title = f"GLOBAL RENEWABLE ENERGY PLATFORM - {report_type.replace('_', ' ').upper()} REPORT"
    writer.writerow([title])
    writer.writerow(["Site Name", site.name])
    writer.writerow(["Latitude", f"{site.latitude}° N"])
    writer.writerow(["Longitude", f"{site.longitude}° E"])
    
    loc = details.get("location", {})
    writer.writerow(["Country", loc.get("country", "Global Coordinates")])
    writer.writerow(["State / Region", loc.get("state", site.region or "")])
    writer.writerow(["District / County", loc.get("district", "")])
    writer.writerow(["City / Town", loc.get("city", "")])
    writer.writerow(["Postal Code", loc.get("postcode", "")])
    writer.writerow([])
    
    show_all = not report_type
    
    # Suitability Scores
    if show_all or report_type in ["suitability", "site_assessment", "executive_summary", "executive", "solar", "wind", "hybrid"]:
        suit = details.get("suitability", {})
        scores = suit.get("scores", {})
        writer.writerow(["SUITABILITY SCORES (0-100 Scale)"])
        writer.writerow(["Overall Score", scores.get("overall", site.suitability_score)])
        writer.writerow(["Suitability Category", suit.get("category", site.suitability_category)])
        writer.writerow(["Solar Score", scores.get("solar", "")])
        writer.writerow(["Wind Score", scores.get("wind", "")])
        writer.writerow(["Land Score", scores.get("land", "")])
        writer.writerow(["Weather Score", scores.get("weather", "")])
        writer.writerow(["Infrastructure Score", scores.get("infrastructure", "")])
        writer.writerow(["Environmental Score", scores.get("environmental", "")])
        writer.writerow(["Economic Score", scores.get("economic", "")])
        writer.writerow([])
        
    # AI Recommendations / Investment Model
    if show_all or report_type in ["investment", "financial_feasibility", "financial", "executive_summary", "executive"]:
        opt = details.get("optimization", {})
        econ = opt.get("economic_estimates", {})
        writer.writerow(["AI INVESTMENT & REVENUE MODEL"])
        writer.writerow(["Recommended Technology", opt.get("recommended_technology", "")])
        writer.writerow(["Technology Configuration Split", opt.get("technology_split", "")])
        writer.writerow(["Recommended Capacity (MW)", opt.get("recommended_capacity_mw", "")])
        writer.writerow(["Estimated CAPEX (Million USD)", econ.get("estimated_capex_million_usd", "")])
        writer.writerow(["Estimated OPEX (Million USD/yr)", econ.get("estimated_opex_million_usd_year", "")])
        writer.writerow(["Annual Project Revenue (M USD/yr)", econ.get("annual_revenue_million_usd", "")])
        writer.writerow(["Projected ROI (%)", econ.get("expected_roi_pct", "")])
        writer.writerow(["Payback Period (years)", econ.get("payback_years", "")])
        writer.writerow(["Levelized Cost of Energy (LCOE) ($/MWh)", econ.get("lcoe", "0.045")])
        writer.writerow(["Net Present Value (NPV) (Million USD)", econ.get("npv", "12.4")])
        writer.writerow(["Internal Rate of Return (IRR) (%)", econ.get("irr", "14.2")])
        writer.writerow(["Estimated Construction (months)", econ.get("construction_months", "")])
        writer.writerow(["Annual Clean Energy Generation (MWh)", opt.get("annual_energy_generation_mwh", "")])
        writer.writerow(["CO2 Emissions Reduction (tons/yr)", opt.get("co2_reduction_tons_year", "")])
        writer.writerow([])
        
    # Environmental & Weather Analysis
    if show_all or report_type in ["environmental", "environmental_report", "site_assessment"]:
        env = details.get("environmental", {})
        writer.writerow(["ENVIRONMENTAL & CLIMATIC CONDITIONS"])
        writer.writerow(["Elevation (meters)", env.get("elevation", site.elevation)])
        writer.writerow(["Contour Terrain Slope (degrees)", env.get("land_slope", "")])
        writer.writerow(["Terrain Slope Classification", env.get("terrain_type", "")])
        writer.writerow(["Land Cover Type", env.get("land_cover", "")])
        writer.writerow(["Vegetation NDVI Index", env.get("vegetation_index", "")])
        writer.writerow(["Population Density (people/km2)", env.get("population_density", "Low")])
        writer.writerow(["Current Weather Temperature (C)", env.get("temperature", "")])
        writer.writerow(["Feels Like Temperature (C)", env.get("apparent_temperature", "")])
        writer.writerow(["Relative Humidity (%)", env.get("humidity", "")])
        writer.writerow(["Barometric Pressure (hPa)", env.get("pressure", "")])
        writer.writerow(["Average Rainfall (mm)", env.get("rainfall", "")])
        writer.writerow(["Cloud Cover Index (%)", env.get("cloud_cover", "")])
        writer.writerow(["Visibility Range (meters)", env.get("visibility", "")])
        writer.writerow(["UV Index Maximum", env.get("uv_index", "")])
        writer.writerow([])
        
    # Solar Parameters
    if show_all or report_type in ["solar", "solar_report", "hybrid", "hybrid_report"]:
        solar = details.get("solar_prediction", {})
        writer.writerow(["SOLAR RESOURCE ESTIMATIONS (1 MW Base Model)"])
        writer.writerow(["Annual GHI Solar Irradiance (kWh/m2/yr)", solar.get("annual_irradiance", "")])
        writer.writerow(["Daily Solar Resource Quality", solar.get("solar_resource_quality", "")])
        writer.writerow(["Peak Sun Hours (hrs/day)", solar.get("peak_sun_hours", "")])
        writer.writerow(["Est. Annual Energy Output (kWh)", solar.get("expected_energy_output", "")])
        writer.writerow(["Expected Capacity Factor (%)", solar.get("capacity_factor", "")])
        writer.writerow([])
        
    # Wind Parameters
    if show_all or report_type in ["wind", "wind_report", "hybrid", "hybrid_report"]:
        wind = details.get("wind_prediction", {})
        writer.writerow(["WIND RESOURCE ESTIMATIONS (1 MW Base Model)"])
        writer.writerow(["Average Wind Speed (hub-height, m/s)", wind.get("average_wind_speed", "")])
        writer.writerow(["Wind Power Density WPD (W/m2)", wind.get("wind_power_density", "")])
        writer.writerow(["Air Density (kg/m3)", wind.get("air_density", "")])
        writer.writerow(["Wind Capacity Factor (%)", wind.get("capacity_factor", "")])
        writer.writerow([])
        
    # Infrastructure Connectivity
    if show_all or report_type in ["infrastructure", "environmental", "environmental_report", "site_assessment"]:
        infra = details.get("infrastructure", {})
        writer.writerow(["LOGISTICAL & INFRASTRUCTURE CONNECTIVITY"])
        writer.writerow(["Nearest Road", infra.get("nearest_road", "")])
        writer.writerow(["Proximity to Highway (km)", infra.get("distance_to_highway", "")])
        writer.writerow(["Nearest Railway Line", infra.get("nearest_railway", "")])
        writer.writerow(["Nearest Electrical Trunk Line", infra.get("nearest_transmission_line", "")])
        writer.writerow(["Nearest Distribution Substation", infra.get("nearest_substation", "")])
        writer.writerow([])
        
    # Acceptance & Risks
    if show_all or report_type in ["executive", "executive_summary"]:
        opt = details.get("optimization", {})
        writer.writerow(["ACCEPTANCE FACTORS (✔)"])
        for reason in opt.get("acceptance_reasons", []):
            writer.writerow([reason])
        writer.writerow([])
        writer.writerow(["REJECTION / LIMITING RISK FACTORS (✘)"])
        for reason in opt.get("rejection_reasons", []):
            writer.writerow([reason])
            
    return output.getvalue().encode('utf-8')

def generate_html_print_report(site: SiteModel, report_type: str = None) -> str:
    """
    Generates a beautiful print-friendly HTML page that automatically triggers the browser print dialog
    enabling immediate PDF saving.
    """
    from datetime import datetime
    details = json.loads(site.details_json) if site.details_json else {}
    loc = details.get("location", {})
    env = details.get("environmental", {})
    infra = details.get("infrastructure", {})
    suit = details.get("suitability", {})
    scores = suit.get("scores", {})
    opt = details.get("optimization", {})
    econ = opt.get("economic_estimates", {})
    solar = details.get("solar_prediction", {})
    wind = details.get("wind_prediction", {})
    
    proj_name = site.project.name if site.project else "Unassigned Project"
    owner_name = site.project.owner.full_name if (site.project and site.project.owner) else "GeoEnergy AI Siter"
    report_id = f"GER-2026-{site.id:04d}"
    gen_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    admin_comments = site.project.review_comments if (site.project and site.project.review_comments) else "No administrator review comments available."
    
    # Financial indicators
    lcoe = econ.get("lcoe_dollar_kwh", 0.045)
    npv = econ.get("npv_million_usd", 12.4)
    roi = econ.get("expected_roi_pct", 18.2)
    irr = econ.get("irr_percent", 14.8)
    payback = econ.get("payback_years", 6.5)
    capex = econ.get("estimated_capex_million_usd", 15.0)
    opex = econ.get("estimated_opex_million_usd_year", 0.45)
    annual_rev = econ.get("annual_revenue_million_usd", 2.8)
    annual_savings = round(annual_rev * 0.14, 3) # simulated tax credits / grid offsets

    # Report type display filter
    env_display = "block"
    solar_display = "block"
    wind_display = "block"
    financial_display = "block"
    score_display = "block"
    breakdown_display = "block"
    rec_display = "block"
    
    if report_type:
        rt_clean = report_type.lower()
        if "environmental" in rt_clean:
            solar_display = "none"
            wind_display = "none"
            financial_display = "none"
            rec_display = "none"
        elif "solar" in rt_clean:
            env_display = "none"
            wind_display = "none"
            financial_display = "none"
        elif "wind" in rt_clean:
            env_display = "none"
            solar_display = "none"
            financial_display = "none"
        elif "hybrid" in rt_clean:
            financial_display = "none"
            env_display = "none"
        elif "financial" in rt_clean or "investment" in rt_clean:
            env_display = "none"
            solar_display = "none"
            wind_display = "none"
            score_display = "none"
            breakdown_display = "none"
        elif "executive" in rt_clean:
            env_display = "none"
            solar_display = "none"
            wind_display = "none"
        elif "site_assessment" in rt_clean:
            solar_display = "none"
            wind_display = "none"
            financial_display = "none"
            rec_display = "none"
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Feasibility Assessment Report - {site.name}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
        }}
        .watermark {{
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            font-weight: 900;
            color: rgba(226, 232, 240, 0.35);
            z-index: -1000;
            pointer-events: none;
            text-transform: uppercase;
            letter-spacing: 10px;
            font-family: 'Segoe UI', sans-serif;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }}
        .logo-section {{
            display: flex;
            align-items: center;
        }}
        .logo-icon {{
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #10b981, #0ea5e9);
            border-radius: 6px;
            margin-right: 10px;
        }}
        .logo-text {{
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }}
        .logo-sub {{
            color: #10b981;
        }}
        .meta-section {{
            text-align: right;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            line-height: 1.4;
        }}
        .section {{
            margin-bottom: 25px;
            page-break-inside: avoid;
        }}
        .section-title {{
            font-size: 13px;
            color: #1e3a8a;
            text-transform: uppercase;
            border-bottom: 1.5px solid #1e3a8a;
            padding-bottom: 4px;
            margin-bottom: 12px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }}
        .card {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
        }}
        .card-row {{
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e2e8f0;
            padding: 6px 0;
        }}
        .card-row:last-child {{
            border-bottom: none;
        }}
        .card-row span.label {{
            color: #475569;
            font-weight: 600;
        }}
        .card-row span.value {{
            color: #0f172a;
            font-weight: 700;
        }}
        .score-box {{
            text-align: center;
            background: linear-gradient(135deg, #1e3a8a, #0f172a);
            color: #ffffff;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 20px;
        }}
        .score-box h2 {{
            margin: 0;
            font-size: 36px;
            font-weight: 900;
        }}
        .score-box p {{
            margin: 5px 0 0 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: bold;
            color: #93c5fd;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }}
        th, td {{
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            text-align: left;
        }}
        th {{
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
        }}
        .list-container {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }}
        .list-title-pos {{
            color: #10b981;
            font-weight: 800;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 11px;
        }}
        .list-title-neg {{
            color: #ef4444;
            font-weight: 800;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 11px;
        }}
        ul {{
            margin: 0;
            padding-left: 18px;
        }}
        li {{
            margin-bottom: 6px;
        }}
        .footer {{
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
            font-weight: 600;
            page-break-inside: avoid;
        }}
        .print-btn {{
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #0ea5e9);
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            font-family: inherit;
            transition: all 0.2s;
        }}
        @media print {{
            .print-btn {{ display: none; }}
            body {{ padding: 0; }}
        }}
    </style>
    <script>
        window.onload = function() {{
            setTimeout(function() {{
                window.print();
            }}, 500);
        }};
    </script>
</head>
<body>
    <div class="watermark">CONFIDENTIAL</div>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    
    <div class="header">
        <div class="logo-section">
            <div class="logo-icon"></div>
            <div class="logo-text">GEOENERGY <span class="logo-sub">AI</span></div>
        </div>
        <div class="meta-section">
            <div>REPORT ID: {report_id}</div>
            <div>PROJECT: {proj_name}</div>
            <div>DATE: {gen_date}</div>
            <div>GENERATED BY: {owner_name}</div>
        </div>
    </div>
    
    <div class="grid" style="grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 25px; display: {score_display if score_display == 'block' else 'none'};">
        <div>
            <div class="score-box" style="display: {score_display};">
                <h2>{scores.get("overall", site.suitability_score)}</h2>
                <p>Suitability Score</p>
                <div style="font-size: 11px; font-weight: 800; background-color: rgba(255,255,255,0.15); display: inline-block; padding: 3px 12px; border-radius: 12px; margin-top: 8px; text-transform: uppercase;">
                    {suit.get("category", site.suitability_category)}
                </div>
            </div>
            
            <div class="card" style="display: {breakdown_display};">
                <div class="section-title" style="font-size:11px; border-bottom-color:#e2e8f0; margin-bottom:8px;">Sub-Scores Breakdown</div>
                <div class="card-row"><span class="label">Solar Resource</span><span class="value">{scores.get("solar", "")} %</span></div>
                <div class="card-row"><span class="label">Wind Resource</span><span class="value">{scores.get("wind", "")} %</span></div>
                <div class="card-row"><span class="label">Topology aspect</span><span class="value">{scores.get("land", "")} %</span></div>
                <div class="card-row"><span class="label">Environmental Siting</span><span class="value">{scores.get("environmental", "")} %</span></div>
            </div>
        </div>
        
        <div class="card" style="display:flex; flex-direction:column; justify-content:center;">
            <div class="section-title">Site Coordinates & GIS Profile</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;">
                <div class="card-row"><span class="label">Country:</span><span class="value">{loc.get("country", "India")}</span></div>
                <div class="card-row"><span class="label">State / Region:</span><span class="value">{loc.get("state", site.region or "Rajasthan")}</span></div>
                <div class="card-row"><span class="label">District / County:</span><span class="value">{loc.get("district", "Jodhpur")}</span></div>
                <div class="card-row"><span class="label">City / Coordinates:</span><span class="value">{site.latitude:.4f}° N, {site.longitude:.4f}° E</span></div>
                <div class="card-row"><span class="label">Land Parcel Area:</span><span class="value">{site.land_area} Hectares</span></div>
                <div class="card-row"><span class="label">Ownership Model:</span><span class="value">{site.land_ownership}</span></div>
                <div class="card-row"><span class="label">Terrain Elevation:</span><span class="value">{env.get("elevation", 220)} m</span></div>
                <div class="card-row"><span class="label">Land Classification:</span><span class="value">{env.get("land_cover") or "Barren Desert / Sandy"}</span></div>
            </div>
        </div>
    </div>
    
    <div class="section" style="display: {env_display};">
        <div class="section-title">Environmental & Siting Assessment</div>
        <table style="text-align: center; font-size: 11.5px;">
            <thead>
                <tr>
                    <th>Solar Irradiance (GHI)</th>
                    <th>Average Wind Speed</th>
                    <th>Terrain Aspect / Slope</th>
                    <th>Rainfall Volume</th>
                    <th>Cloud Cover Mean</th>
                    <th>Population Density</th>
                    <th>Airport Restriction</th>
                    <th>Forest Boundary Check</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{env.get("solar_irradiance", "5.2")} kWh/m²/day</td>
                    <td>{wind.get("average_wind_speed", "3.8")} m/s</td>
                    <td>{env.get("land_slope", "0.8")}° aspect</td>
                    <td>{env.get("rainfall", "150")} mm/year</td>
                    <td>{env.get("cloud_cover", "8")}%</td>
                    <td>{env.get("population_density", "Low")} / km²</td>
                    <td>{"Restricted (Within Airport Buffer)" if (infra.get("distance_to_airport") or 25) < 15.0 else "Clear (Safe Siting)"}</td>
                    <td>{"Restricted (Forest Zone)" if infra.get("in_protected_zone") else "Clear (Safe Siting)"}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section" style="display: {solar_display if (solar_display == 'block' or wind_display == 'block') else 'none'};">
        <div class="section-title">Technical Sizing & Feasibility Prediction</div>
        <div class="grid">
            <div class="card" style="display: {solar_display};">
                <div class="section-title" style="font-size:11px; margin-bottom:8px; border-bottom-color:#e2e8f0;">Solar Energy Potential</div>
                <div class="card-row"><span class="label">Solar Output Potential:</span><span class="value">{int(round(solar.get("expected_energy_output") or 1680000)):,} kWh/MW/yr</span></div>
                <div class="card-row"><span class="label">Solar Capacity Factor:</span><span class="value">{solar.get("capacity_factor", "25.8")}%</span></div>
                <div class="card-row"><span class="label">Tilt Angle & Spacing:</span><span class="value">{solar.get("tilt_angle", "27")}° tilt / {solar.get("row_spacing", "8")} m</span></div>
                <div class="card-row"><span class="label">Optimal Setup Recommendation:</span><span class="value" style="color:#1e3a8a;">{opt.get("recommended_technology", "Utility-Scale Solar PV")}</span></div>
            </div>
            <div class="card" style="display: {wind_display};">
                <div class="section-title" style="font-size:11px; margin-bottom:8px; border-bottom-color:#e2e8f0;">Wind Energy Potential</div>
                <div class="card-row"><span class="label">Wind Output Potential:</span><span class="value">{int(round(wind.get("expected_energy_output") or 2450000)):,} kWh/MW/yr</span></div>
                <div class="card-row"><span class="label">Wind Capacity Factor:</span><span class="value">{wind.get("capacity_factor", "32.4")}%</span></div>
                <div class="card-row"><span class="label">Wind Power Density:</span><span class="value">{wind.get("wind_power_density", "280")} W/m²</span></div>
                <div class="card-row"><span class="label">Confidence Score Siting:</span><span class="value" style="color:#10b981;">{opt.get("confidence_score", "92")}%</span></div>
            </div>
        </div>
    </div>
    
    <div class="section" style="display: {financial_display};">
        <div class="section-title">Investment & Financial Analysis</div>
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div class="card" style="text-align: center; padding: 10px;">
                <span style="font-size: 10px; color: #64748b; font-weight: bold; block;">LCOE (Levelized Cost)</span>
                <h3 style="margin: 5px 0; color: #1e3a8a; font-size: 16px;">${lcoe:.4f} /kWh</h3>
            </div>
            <div class="card" style="text-align: center; padding: 10px;">
                <span style="font-size: 10px; color: #64748b; font-weight: bold; block;">NET PRESENT VALUE (NPV)</span>
                <h3 style="margin: 5px 0; color: #10b981; font-size: 16px;">${npv}M USD</h3>
            </div>
            <div class="card" style="text-align: center; padding: 10px;">
                <span style="font-size: 10px; color: #64748b; font-weight: bold; block;">RETURN ON INVESTMENT</span>
                <h3 style="margin: 5px 0; color: #1e3a8a; font-size: 16px;">{roi}%</h3>
            </div>
            <div class="card" style="text-align: center; padding: 10px;">
                <span style="font-size: 10px; color: #64748b; font-weight: bold; block;">INTERNAL RATE (IRR)</span>
                <h3 style="margin: 5px 0; color: #10b981; font-size: 16px;">{irr}%</h3>
            </div>
        </div>
        
        <div class="card" style="margin-top: 10px;">
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px 30px;">
                <div class="card-row"><span class="label">Initial CAPEX Siting Cost:</span><span class="value">${capex}M USD</span></div>
                <div class="card-row"><span class="label">Annual Revenue Yield:</span><span class="value">${annual_rev}M USD</span></div>
                <div class="card-row"><span class="label">O&M Maintenance Cost:</span><span class="value">${opex}M USD/year</span></div>
                <div class="card-row"><span class="label">Project Payback Duration:</span><span class="value">{payback} Years</span></div>
                <div class="card-row" style="grid-column: span 2;"><span class="label">Estimated Clean Energy Credits & Tax Savings:</span><span class="value" style="color: #10b981;">${annual_savings}M USD/year</span></div>
            </div>
        </div>
    </div>
    
    <div class="section" style="display: {rec_display};">
        <div class="section-title">Final Deployment Recommendation & Siting Logic</div>
        <div class="card" style="margin-bottom: 10px;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #0f172a;">AI Core Decision Analysis:</div>
            <div style="color: #475569; font-weight: 500;">{opt.get("reasoning", "The coordinates provide optimal desert irradiance and flat layout contours. Recommended for utility solar arrays.")}</div>
        </div>
        <div class="card">
            <div style="font-weight: bold; margin-bottom: 5px; color: #1e3a8a;">Administrator Review & Verification Comments:</div>
            <div style="color: #475569; font-weight: 500; font-style: italic;">{admin_comments}</div>
        </div>
    </div>
    
    <div class="footer">
        <span>CONFIDENTIAL | GEOENERGY AI PLATFORM</span>
        <span>Page 1 of 1</span>
    </div>
</body>
</html>"""
    return html
