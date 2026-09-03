from app.services.analytics_service import classify_suitability, suitability_bucket


def test_classify_suitability_ranges():
    assert classify_suitability(85) == "Highly Suitable"
    assert classify_suitability(70) == "Suitable"
    assert classify_suitability(50) == "Moderately Suitable"
    assert classify_suitability(35) == "Low Suitability"
    assert classify_suitability(20) == "Not Suitable"
    assert classify_suitability(None) == "No data available"


def test_suitability_bucket_ranges():
    assert suitability_bucket(80) == "High"
    assert suitability_bucket(60) == "Medium"
    assert suitability_bucket(40) == "Low"
    assert suitability_bucket(20) == "Unsuitable"
    assert suitability_bucket(None) == "No data"
