import pandas as pd

from ml_core.preprocessing import (
    NumericImputer,
    NumericScaler,
    PreprocessingPipeline,
)


def test_numeric_imputer():

    data = pd.DataFrame(
        {
            "a": [1.0, 2.0, None, 4.0],
            "b": [10.0, None, 30.0, 40.0],
        }
    )

    imputer = NumericImputer()

    result = imputer.fit_transform(data)

    assert not result.isna().any().any()


def test_numeric_scaler():

    data = pd.DataFrame(
        {
            "a": [1.0, 2.0, 3.0, 4.0],
            "b": [10.0, 20.0, 30.0, 40.0],
        }
    )

    scaler = NumericScaler()

    result = scaler.fit_transform(data)

    assert abs(result["a"].mean()) < 1e-10
    assert abs(result["b"].mean()) < 1e-10


def test_pipeline():

    data = pd.DataFrame(
        {
            "latitude": [13.0, 14.0, 15.0],
            "longitude": [77.0, 78.0, 79.0],
            "value": [10.0, None, 30.0],
        }
    )

    pipeline = PreprocessingPipeline()

    result = pipeline.fit_transform(data)

    assert list(result.columns) == [
        "latitude",
        "longitude",
        "value",
    ]

    assert not result.isna().any().any()