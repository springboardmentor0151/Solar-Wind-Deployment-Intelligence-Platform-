"""
Energy Forecasting Engine + basic Investment Analytics.

Produces long-term (25yr) energy production estimates with degradation,
grid contribution estimates, and a simple revenue/investment projection used
by the Deployment Optimization Engine and Reports.
"""

DEFAULT_PPA_PRICE_USD_PER_MWH = 45.0
SOLAR_DEGRADATION_PCT_PER_YEAR = 0.5
WIND_DEGRADATION_PCT_PER_YEAR = 0.3
PROJECT_LIFETIME_YEARS = 25

SOLAR_CAPEX_USD_PER_MW = 850_000
WIND_CAPEX_USD_PER_MW = 1_300_000
SOLAR_OPEX_USD_PER_MW_YEAR = 12_000
WIND_OPEX_USD_PER_MW_YEAR = 35_000


def forecast_energy_and_revenue(solar: dict, wind: dict, capacity_mw: float,
                                 technology: str, ppa_price: float = DEFAULT_PPA_PRICE_USD_PER_MWH) -> dict:
    solar_year1 = solar["expected_output_total_mwh_year"]
    wind_year1 = wind["expected_output_total_mwh_year"]

    if technology == "Solar PV":
        year1_output, degradation, capex_per_mw, opex_per_mw = solar_year1, SOLAR_DEGRADATION_PCT_PER_YEAR, SOLAR_CAPEX_USD_PER_MW, SOLAR_OPEX_USD_PER_MW_YEAR
    elif technology == "Wind":
        year1_output, degradation, capex_per_mw, opex_per_mw = wind_year1, WIND_DEGRADATION_PCT_PER_YEAR, WIND_CAPEX_USD_PER_MW, WIND_OPEX_USD_PER_MW_YEAR
    else:  # Hybrid — split capacity 50/50
        half = capacity_mw / 2
        solar_share = solar["expected_output_mwh_per_mw_year"] * half
        wind_share = wind["expected_output_mwh_per_mw_year"] * half
        year1_output = solar_share + wind_share
        degradation = (SOLAR_DEGRADATION_PCT_PER_YEAR + WIND_DEGRADATION_PCT_PER_YEAR) / 2
        capex_per_mw = (SOLAR_CAPEX_USD_PER_MW + WIND_CAPEX_USD_PER_MW) / 2
        opex_per_mw = (SOLAR_OPEX_USD_PER_MW_YEAR + WIND_OPEX_USD_PER_MW_YEAR) / 2

    lifetime_production = []
    cumulative_revenue = []
    total_revenue = 0.0
    output = year1_output
    for year in range(1, PROJECT_LIFETIME_YEARS + 1):
        if year > 1:
            output *= (1 - degradation / 100)
        revenue = output * ppa_price
        total_revenue += revenue
        lifetime_production.append(round(output, 1))
        cumulative_revenue.append(round(total_revenue, 0))

    capex = round(capex_per_mw * capacity_mw, 0)
    annual_opex = round(opex_per_mw * capacity_mw, 0)
    lifetime_opex = annual_opex * PROJECT_LIFETIME_YEARS
    net_lifetime_revenue = round(total_revenue - lifetime_opex, 0)
    simple_payback_years = round(capex / max(1, (lifetime_production[0] * ppa_price - annual_opex)), 1)

    return {
        "technology": technology,
        "capacity_mw": capacity_mw,
        "year1_output_mwh": round(year1_output, 1),
        "annual_degradation_pct": degradation,
        "lifetime_years": PROJECT_LIFETIME_YEARS,
        "lifetime_production_mwh": lifetime_production,
        "ppa_price_usd_per_mwh": ppa_price,
        "estimated_capex_usd": capex,
        "estimated_annual_opex_usd": annual_opex,
        "lifetime_gross_revenue_usd": round(total_revenue, 0),
        "lifetime_net_revenue_usd": net_lifetime_revenue,
        "cumulative_revenue_usd": cumulative_revenue,
        "simple_payback_years": simple_payback_years,
        "grid_contribution_mwh_year1": round(year1_output, 1),
        "homes_powered_estimate": round(year1_output / 4.5),  # ~4.5 MWh/yr avg household
    }
