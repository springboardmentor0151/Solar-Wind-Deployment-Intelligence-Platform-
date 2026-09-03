from app.schemas.environment import EnvironmentalDataRead
from app.services.prediction_service import predict_all


def test_predict_all_returns_expected_metrics() -> None:
    env = EnvironmentalDataRead(
        latitude=12.97,
        longitude=77.59,
        solar_irradiance=5.8,
        wind_speed=6.4,
        wind_direction=230,
        temperature=28,
        humidity=55,
        rainfall=120,
        cloud_cover=32,
        elevation=850,
        land_slope=5,
        vegetation_index=0.42,
        nearby_roads_km=3,
        nearby_substations_km=12,
        nearby_transmission_lines_km=8,
    )
    prediction = predict_all("Hybrid", 100, env)

    assert 0 <= prediction.suitability_score <= 100
    assert prediction.annual_energy_output > 0
    assert len(prediction.forecast) == 12
