from typing import Dict, Any, List

def solve_irr(capex: float, cash_flows: List[float]) -> float:
    """
    Solves for the Internal Rate of Return (IRR) using bisection search.
    Returns IRR as a percentage (e.g. 12.5), or 0.0 if not converging.
    """
    if capex <= 0 or not any(cf > 0 for cf in cash_flows):
        return 0.0
        
    low = -0.99
    high = 2.0
    tolerance = 1e-6
    max_iter = 100
    
    for _ in range(max_iter):
        mid = (low + high) / 2.0
        
        # Calculate NPV at discount rate mid
        npv = -capex
        for t, cf in enumerate(cash_flows):
            npv += cf / ((1.0 + mid) ** (t + 1))
            
        if abs(npv) < tolerance:
            return round(mid * 100.0, 2)
            
        if npv > 0:
            low = mid
        else:
            high = mid
            
    return round(((low + high) / 2.0) * 100.0, 2)

def optimize_deployment(env_data: Dict[str, Any], solar_data: Dict[str, Any], wind_data: Dict[str, Any], land_area: float) -> Dict[str, Any]:
    """
    Deployment Sizing, Optimization, and Financial Engine.
    Computes installation/maintenance costs, 25-year revenue, carbon savings,
    LCOE, NPV, and IRR using engineering formulas.
    """
    env = env_data["environmental"]
    infra = env_data.get("infrastructure", {})
    
    solar_cf = solar_data.get("capacity_factor", 18.0)
    wind_cf = wind_data.get("capacity_factor", 25.0)
    solar_score = solar_data.get("solar_suitability_score", 50.0)
    wind_score = wind_data.get("wind_suitability_score", 50.0)
    
    ghi = env["solar_irradiance"]
    wind_speed = wind_data.get("average_wind_speed", 4.0)
    slope = env["land_slope"]
    cloud_cover = env["cloud_cover"]
    
    distance_to_road = infra.get("distance_to_road", 1.0)
    distance_to_transmission = infra.get("distance_to_transmission", 2.0)
    distance_to_substation = infra.get("distance_to_substation", 3.0)
    in_protected_zone = infra.get("in_protected_zone", False)
    on_agricultural_land = infra.get("on_agricultural_land", False)
    near_water_bodies = infra.get("near_water_bodies", False)
    
    # 1. Determine Sized Plant Technology Recommendation
    if in_protected_zone:
        recommended_plant_type = "Not Suitable"
        solar_capacity_mw = 0.0
        wind_capacity_mw = 0.0
        reasoning = "Development is prohibited because the selected coordinates intersect with a protected wildlife reserve."
    elif solar_score >= 70.0 and wind_score >= 70.0:
        recommended_plant_type = "Hybrid Solar + Wind Plant"
        # 60% land to solar, 40% land to wind
        solar_capacity_mw = round(solar_data.get("usable_area_hectares", land_area * 0.8) * 0.6 / 2.0, 2)
        wind_capacity_mw = round(wind_data.get("usable_area_hectares", land_area * 0.8) * 0.4 / 15.0, 2)
        reasoning = (
            "Highly favorable resource metrics for both wind and solar suggest a hybrid plant configuration. "
            "Co-location balances grid transmission output and optimizes shared substation assets."
        )
    elif wind_score >= 70.0 and wind_score > solar_score:
        recommended_plant_type = "Wind Farm"
        solar_capacity_mw = 0.0
        wind_capacity_mw = round(wind_data.get("usable_area_hectares", land_area * 0.8) / 15.0, 2)
        reasoning = (
            f"Strong local hub wind speeds ({wind_speed} m/s) favor a wind farm layout "
            "as the most economically productive investment."
        )
    elif solar_score >= 60.0:
        recommended_plant_type = "Solar Plant"
        solar_capacity_mw = round(solar_data.get("usable_area_hectares", land_area * 0.8) / 2.0, 2)
        wind_capacity_mw = 0.0
        reasoning = (
            f"Favorable GHI irradiance of {ghi} kWh/m²/day and gentle slopes make "
            "a utility-scale fixed solar PV field the optimal design."
        )
    elif max(solar_score, wind_score) >= 40.0:
        if solar_score > wind_score:
            recommended_plant_type = "Solar Plant"
            solar_capacity_mw = round(solar_data.get("usable_area_hectares", land_area * 0.8) / 2.0, 2)
            wind_capacity_mw = 0.0
            reasoning = "Marginal site conditions. A scaled solar array is recommended if connection costs are low."
        else:
            recommended_plant_type = "Wind Farm"
            solar_capacity_mw = 0.0
            wind_capacity_mw = round(wind_data.get("usable_area_hectares", land_area * 0.8) / 15.0, 2)
            reasoning = "Marginal wind resource. A small wind turbine arrangement is suggested for local off-take."
    else:
        recommended_plant_type = "Not Suitable"
        solar_capacity_mw = 0.0
        wind_capacity_mw = 0.0
        reasoning = "Irradiance and wind speeds are insufficient to justify commercial construction costs."

    total_capacity_mw = round(solar_capacity_mw + wind_capacity_mw, 2)

    # 2. CAPEX & OPEX cost breakdown (Million USD)
    # Solar CAPEX: $1.1M/MW, OPEX: $18,000/MW/year
    # Wind CAPEX: $1.45M/MW, OPEX: $38,000/MW/year
    # Grid connection: $130,000 per km
    solar_capex_cost = solar_capacity_mw * 1.1
    wind_capex_cost = wind_capacity_mw * 1.45
    grid_connection_cost = round(distance_to_transmission * 0.13, 3)
    
    installation_cost = round(solar_capex_cost + wind_capex_cost + grid_connection_cost, 3)
    maintenance_cost_year = round((solar_capacity_mw * 0.018) + (wind_capacity_mw * 0.038), 3)

    # 3. Dynamic Annual Generation & Degradation Flow
    # Tariff values: Solar = $0.045 / kWh, Wind = $0.052 / kWh
    solar_base_kwh = solar_capacity_mw * solar_data.get("peak_sun_hours", ghi) * 365.0 * 1000.0 * (solar_data.get("performance_ratio", 80.0) / 100.0)
    wind_base_kwh = wind_capacity_mw * 8760.0 * 1000.0 * (wind_data.get("capacity_factor", 25.0) / 100.0)
    
    annual_energy_generation_mwh = round((solar_base_kwh + wind_base_kwh) / 1000.0, 1)

    # Calculate 25-Year financial streams
    discount_rate = 0.08  # 8.0% standard discount rate
    npv_energy_sum = 0.0
    npv_costs_sum = 0.0
    npv_cashflows = []
    total_revenue_25yr = 0.0
    
    # Yearly degraded cash flows
    for t in range(1, 26):
        # Solar degrades 0.5%/year, Wind degrades 1.0%/year
        solar_gen_t = solar_base_kwh * ((1.0 - 0.005) ** t)
        wind_gen_t = wind_base_kwh * ((1.0 - 0.01) ** t)
        energy_kwh_t = solar_gen_t + wind_gen_t
        
        rev_t = (solar_gen_t * 0.045 + wind_gen_t * 0.052) / 1000000.0  # Million USD
        cost_t = maintenance_cost_year  # Million USD
        net_cash_t = rev_t - cost_t
        
        total_revenue_25yr += rev_t
        npv_cashflows.append(net_cash_t)
        
        # LCOE discount factors
        npv_energy_sum += energy_kwh_t / ((1.0 + discount_rate) ** t)
        npv_costs_sum += cost_t / ((1.0 + discount_rate) ** t)

    # Levelized Cost of Energy (LCOE) in $/kWh
    # LCOE = (Installation_Cost + NPV_OPEX) / NPV_Energy
    if npv_energy_sum > 0:
        lcoe = round((installation_cost + npv_costs_sum) * 1000000.0 / npv_energy_sum, 4)
    else:
        lcoe = 0.0

    # Net Present Value (NPV)
    npv = -installation_cost
    for t, cf in enumerate(npv_cashflows):
        npv += cf / ((1.0 + discount_rate) ** (t + 1))
    npv = round(npv, 3)

    # Internal Rate of Return (IRR)
    irr = solve_irr(installation_cost, npv_cashflows)

    # Payback and ROI
    first_year_revenue = (solar_base_kwh * 0.045 + wind_base_kwh * 0.052) / 1000000.0
    first_year_net = first_year_revenue - maintenance_cost_year
    
    if installation_cost > 0 and first_year_net > 0:
        payback_years = round(installation_cost / first_year_net, 1)
        expected_roi = round((first_year_net / installation_cost) * 100.0, 2)
    else:
        payback_years = 99.0
        expected_roi = 0.0

    # Carbon reduction (0.82 kg CO2 per kWh)
    co2_reduction = round((solar_base_kwh + wind_base_kwh) * 0.82 / 1000.0, 1)

    # 4. Compile Acceptance / Rejection Reasons
    acceptance_reasons = []
    rejection_reasons = []
    
    if ghi >= 5.0:
        acceptance_reasons.append("High solar irradiance GHI")
    else:
        rejection_reasons.append("Low solar irradiance GHI")
        
    if wind_speed >= 7.0:
        acceptance_reasons.append("Excellent wind speed at hub")
    else:
        rejection_reasons.append("Low wind speed at hub")
        
    if slope < 3.0:
        acceptance_reasons.append("Open flat terrain")
    elif slope > 12.0:
        rejection_reasons.append("Steep terrain increases mounting civil costs")
        
    if cloud_cover < 20.0:
        acceptance_reasons.append("Low cloud cover")
        
    if distance_to_transmission < 3.0:
        acceptance_reasons.append("Near transmission lines")
    elif distance_to_transmission > 12.0:
        rejection_reasons.append("Far from electrical grid")
        
    if distance_to_road < 1.0:
        acceptance_reasons.append("Good road connectivity")
    elif distance_to_road > 5.0:
        rejection_reasons.append("Poor accessibility")
        
    if not in_protected_zone:
        acceptance_reasons.append("Low environmental impact (outside reserves)")
    else:
        rejection_reasons.append("Protected wildlife zone")
        
    if env.get("flood_risk") == "High":
        rejection_reasons.append("Flood-prone area")
        
    if annual_energy_generation_mwh > 2000.0:
        acceptance_reasons.append("High annual energy generation")
        
    if distance_to_substation < 5.0:
        acceptance_reasons.append("Low connection costs")
        
    # Suggested Improvements
    suggested_improvements = []
    if distance_to_transmission > 8.0:
        suggested_improvements.append("Construct a dedicated 110kV/220kV grid interconnection corridor.")
    if recommended_plant_type == "Hybrid Solar + Wind Plant":
        suggested_improvements.append("Implement a shared substation utility bank to reduce CAPEX by 12%.")
    if recommended_plant_type in ["Solar Plant", "Hybrid Solar + Wind Plant"] and cloud_cover > 30.0:
        suggested_improvements.append("Deploy active dual-axis tracking systems to maximize irradiance capture.")
    if env.get("flood_risk") == "Medium":
        suggested_improvements.append("Elevate central inverter stations and sub-assembly boxes to prevent water damage.")
    if distance_to_road > 3.0:
        suggested_improvements.append("Upgrade access roads for heavy logistics transit of turbine rotors and panel frames.")
    if not suggested_improvements:
        suggested_improvements.append("Standard site clearance and perimeter fencing.")

    # Grid Connection status description
    if distance_to_transmission < 1.0:
        grid_status = "Excellent - Immediate connection possible"
    elif distance_to_transmission < 5.0:
        grid_status = "Good - Requires short extension line"
    else:
        grid_status = "Challenging - Remote site requiring major grid buildout"

    # Construction timeline phases
    construction_months = 24 if recommended_plant_type == "Hybrid Solar + Wind Plant" else (18 if recommended_plant_type == "Wind Farm" else 12)
    phases = [
        {
            "phase": "Phase 1: Civil Works & Access Roads (Months 1-8)",
            "details": f"Upgrade road access, grade land parcel of {land_area} Ha, and clear debris."
        },
        {
            "phase": "Phase 2: Substation & Grid Connection (Months 9-14)",
            "details": f"Construct substation pooling yard and string a {distance_to_transmission} km connection line."
        },
        {
            "phase": "Phase 3: Generation Plant Assembly (Months 15-22)",
            "details": f"Assemble mounting frames, string modules or hoist turbine towers up to {total_capacity_mw} MW capacity."
        },
        {
            "phase": "Phase 4: Commissioning & Battery Sync (Months 23-24)",
            "details": "Sync with regional grid, commission safety runs, and activate remote battery load controllers."
        }
    ]

    return {
        "recommended_technology": recommended_plant_type,
        "technology_split": f"{total_capacity_mw} MW {recommended_plant_type}" if total_capacity_mw > 0 else "0 MW",
        "recommended_capacity_mw": total_capacity_mw,
        "solar_capacity_mw": solar_capacity_mw,
        "wind_capacity_mw": wind_capacity_mw,
        "reasoning": reasoning,
        "economic_estimates": {
            "estimated_capex_million_usd": installation_cost,
            "estimated_opex_million_usd_year": maintenance_cost_year,
            "grid_connection_status": grid_status,
            "grid_connection_cost": f"${grid_connection_cost}M",
            "expected_roi_pct": expected_roi,
            "payback_years": payback_years,
            "annual_revenue_million_usd": round(first_year_revenue, 3),
            "construction_months": construction_months,
            
            # New financial columns
            "npv_million_usd": npv,
            "irr_percent": irr,
            "lcoe_dollar_kwh": lcoe,
            "revenue_25yr_million_usd": round(total_revenue_25yr, 2)
        },
        "expansion_plan": phases,
        "co2_reduction_tons_year": co2_reduction,
        "annual_energy_generation_mwh": annual_energy_generation_mwh,
        "acceptance_reasons": acceptance_reasons,
        "rejection_reasons": rejection_reasons,
        "suggested_improvements": suggested_improvements
    }
