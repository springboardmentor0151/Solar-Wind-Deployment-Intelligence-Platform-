import sys
import os
import json

# Setup PYTHONPATH to import app modules correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import init_db
from app.engine_environmental import get_environmental_and_gis_data
from app.engine_solar import calculate_solar_potential
from app.engine_wind import calculate_wind_potential
from app.engine_suitability import run_suitability_analysis
from app.engine_optimization import optimize_deployment
from app.engine_ml import train_ml_models, get_ml_predictions

def test_milestone2_workflow():
    print("=== STARTING MILESTONE 2 INTEGRATION TESTS ===")
    
    # 1. Init Database
    print("\n1. Initializing DB...")
    init_db()
    print("Database initialized.")
    
    # 2. Get Environmental and GIS Data
    print("\n2. Fetching environmental & GIS datasets...")
    lat, lon = 27.539, 71.918
    env_data = get_environmental_and_gis_data(lat, lon)
    env_data["land_ownership"] = "Lease"
    print(f"Location aspect computed: {env_data['environmental'].get('aspect')} degrees")
    print(f"Solar GHI clearness fraction: {env_data['environmental'].get('solar_irradiance')} kWh/m2/day")
    print(f"Diffuse (DHI): {env_data['environmental'].get('dhi')} | Direct (DNI): {env_data['environmental'].get('dni')}")
    
    # 3. Dynamic Solar Sizing
    print("\n3. Dynamic Solar potential assessment (15.5 Ha area)...")
    solar_results = calculate_solar_potential(env_data, land_area=15.5)
    print(f"Optimal Tilt: {solar_results['tilt_angle']} degrees")
    print(f"Estimated Panels count: {solar_results['estimated_number_of_panels']}")
    print(f"Row spacing shadows corridor: {solar_results['row_spacing']} m")
    print(f"Operating temperature losses: {solar_results['temp_loss']}%")
    print(f"Dust/Soiling losses: {solar_results['dust_loss']}%")
    assert "row_spacing" in solar_results
    assert "estimated_number_of_panels" in solar_results
    
    # 4. Dynamic Wind Sizing
    print("\n4. Dynamic Wind potential assessment...")
    wind_results = calculate_wind_potential(env_data, land_area=15.5)
    print(f"Rotor Diameter: {wind_results['rotor_diameter']} m")
    print(f"Spacing footprint footprint: {wind_results['spacing_area_m2']} m2")
    print(f"Sized Turbines capacity: {wind_results['installed_capacity_kw'] / 1000} MW ({wind_results['number_of_turbines']} turbines)")
    print(f"Cut-in speed: {wind_results['cut_in_speed']} m/s | Cut-out speed: {wind_results['cut_out_speed']} m/s")
    assert "number_of_turbines" in wind_results
    assert "recommended_turbine_model" in wind_results
    
    # 5. Suitability & Confidence Analysis
    print("\n5. Running Siting Suitability & Confidence Analysis...")
    suit_results = run_suitability_analysis(env_data, solar_results, wind_results, "hybrid")
    print(f"Siting Category: {suit_results['category']} | Score: {suit_results['scores']['overall']}%")
    print(f"AI Siting Confidence score: {suit_results.get('confidence_score')}%")
    assert "confidence_score" in suit_results
    
    # 6. Economic Optimization (NPV/IRR/LCOE)
    print("\n6. Running LCOE, NPV, and IRR Optimization models...")
    opt_results = optimize_deployment(env_data, solar_results, wind_results, 15.5)
    eco = opt_results["economic_estimates"]
    print(f"CAPEX: ${eco['estimated_capex_million_usd']}M | OPEX: ${eco['estimated_opex_million_usd_year']}M/yr")
    print(f"LCOE: ${eco['lcoe_dollar_kwh']}/kWh")
    print(f"Net Present Value (NPV @8%): ${eco['npv_million_usd']}M")
    print(f"Internal Rate of Return (IRR solver): {eco['irr_percent']}%")
    print(f"Payback Period: {eco['payback_years']} years")
    assert eco["npv_million_usd"] is not None
    assert eco["irr_percent"] is not None
    assert eco["lcoe_dollar_kwh"] is not None
    
    # 7. Machine Learning Regression & Comparisons
    print("\n7. Programmatic training of ML estimators & evaluations...")
    train_res = train_ml_models()
    print(f"Estimators trained metrics: {train_res['metrics']}")
    print(f"Selected best estimator: {train_res['best_model']}")
    
    # 8. SHAP Attributions & Comparisons
    print("\n8. Evaluating SHAP proxy feature attributions & predictions...")
    ml_input = {
        "solar_irradiance": env_data["environmental"]["solar_irradiance"],
        "wind_speed": env_data["environmental"]["wind_speed"],
        "temperature": env_data["environmental"]["temperature"],
        "cloud_cover": env_data["environmental"]["cloud_cover"],
        "rainfall": env_data["environmental"]["rainfall"],
        "land_slope": env_data["environmental"]["land_slope"],
        "elevation": env_data["environmental"]["elevation"],
        "distance_to_transmission": env_data["infrastructure"]["distance_to_transmission"],
        "distance_to_road": env_data["infrastructure"]["distance_to_road"]
    }
    preds = get_ml_predictions(ml_input)
    print(f"Active prediction suitability score: {preds['predicted_suitability']}%")
    print(f"Attributions text logs: {preds['explanations'][:3]}")
    print(f"Multi-estimator comparisons: {preds['comparisons']}")
    assert len(preds["explanations"]) > 0
    assert len(preds["comparisons"]) == 4
    
    print("\n=== ALL INTEGRATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_milestone2_workflow()
