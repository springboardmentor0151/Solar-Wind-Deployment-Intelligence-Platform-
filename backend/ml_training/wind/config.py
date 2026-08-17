"""
Wind ML training configuration.

Production training uses OBSERVED DATA ONLY.
"""

from __future__ import annotations

from pathlib import Path

from ml_core.contracts.feature_contracts import (
    WIND_FEATURES,
    WIND_TARGET,
    WIND_SCHEMA_VERSION,
)


BASE_DIR = Path(__file__).resolve().parents[1]

DATASETS_DIR = (
    BASE_DIR
    / "datasets"
    / "wind"
)

RAW_DATASET_DIR = (
    DATASETS_DIR
    / "raw"
)

ARTIFACT_DIR = (
    BASE_DIR
    / "artifacts"
    / "wind"
)

MODEL_DIR = ARTIFACT_DIR / "model"

PREPROCESSING_DIR = (
    ARTIFACT_DIR
    / "preprocessing"
)

METADATA_DIR = (
    ARTIFACT_DIR
    / "metadata"
)

EVALUATION_DIR = (
    ARTIFACT_DIR
    / "evaluation"
)


DATASET_PATH = (
    RAW_DATASET_DIR
    / "wind_observed_dataset.csv"
)

DATA_SOURCE = "observed"

DATASET_TYPE = "observed"


MODEL_PATH = (
    MODEL_DIR
    / "wind_generation_model.joblib"
)

PREPROCESSOR_PATH = (
    PREPROCESSING_DIR
    / "wind_preprocessor.joblib"
)

METADATA_PATH = (
    METADATA_DIR
    / "metadata.json"
)

METRICS_PATH = (
    EVALUATION_DIR
    / "metrics.json"
)


FEATURES = WIND_FEATURES.copy()

TARGET = WIND_TARGET

SCHEMA_VERSION = WIND_SCHEMA_VERSION


TEST_SIZE = 0.20

RANDOM_STATE = 42


MODEL_TYPE = "RandomForestRegressor"

MODEL_PARAMS = {
    "n_estimators": 300,
    "max_depth": None,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}


REQUIRE_NON_NEGATIVE_TARGET = True


def validate_config() -> None:

    if DATA_SOURCE != "observed":
        raise ValueError(
            "Wind training requires "
            "DATA_SOURCE='observed'."
        )

    if DATASET_TYPE != "observed":
        raise ValueError(
            "Wind training requires "
            "DATASET_TYPE='observed'."
        )

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            "Observed Wind dataset not found:\n"
            f"{DATASET_PATH}"
        )

    if DATASET_PATH.suffix.lower() != ".csv":
        raise ValueError(
            "Wind training dataset must be a CSV file."
        )

    if not 0 < TEST_SIZE < 1:
        raise ValueError(
            "TEST_SIZE must be between 0 and 1."
        )

    if not REQUIRE_NON_NEGATIVE_TARGET:
        raise ValueError(
            "Wind generation target must be non-negative."
        )