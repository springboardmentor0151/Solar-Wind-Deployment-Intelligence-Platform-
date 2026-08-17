"""
Solar ML training configuration.

Production training uses OBSERVED DATA ONLY.

There is no reference/synthetic dataset mode.
"""

from __future__ import annotations

from pathlib import Path

from ml_core.contracts.feature_contracts import (
    SOLAR_FEATURES,
    SOLAR_TARGET,
    SOLAR_SCHEMA_VERSION,
)


# =========================================================
# DIRECTORIES
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATASETS_DIR = (
    BASE_DIR
    / "datasets"
    / "solar"
)

RAW_DATASET_DIR = (
    DATASETS_DIR
    / "raw"
)

ARTIFACT_DIR = (
    BASE_DIR
    / "artifacts"
    / "solar"
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


# =========================================================
# OBSERVED DATASET
# =========================================================

DATASET_PATH = (
    RAW_DATASET_DIR
    / "solar_observed_dataset.csv"
)

DATA_SOURCE = "observed"

DATASET_TYPE = "observed"


# =========================================================
# ARTIFACTS
# =========================================================

MODEL_PATH = (
    MODEL_DIR
    / "solar_generation_model.joblib"
)

PREPROCESSOR_PATH = (
    PREPROCESSING_DIR
    / "solar_preprocessor.joblib"
)

METADATA_PATH = (
    METADATA_DIR
    / "metadata.json"
)

METRICS_PATH = (
    EVALUATION_DIR
    / "metrics.json"
)


# =========================================================
# FEATURE CONTRACT
# =========================================================

FEATURES = SOLAR_FEATURES.copy()

TARGET = SOLAR_TARGET

SCHEMA_VERSION = SOLAR_SCHEMA_VERSION


# =========================================================
# TRAINING
# =========================================================

TEST_SIZE = 0.20

RANDOM_STATE = 42


# =========================================================
# MODEL
# =========================================================

MODEL_TYPE = "RandomForestRegressor"

MODEL_PARAMS = {
    "n_estimators": 300,
    "max_depth": None,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}


# =========================================================
# VALIDATION
# =========================================================

REQUIRE_NON_NEGATIVE_TARGET = True


def validate_config() -> None:
    """
    Validate the Solar observed-data training configuration.
    """

    if DATA_SOURCE != "observed":
        raise ValueError(
            "Solar training requires "
            "DATA_SOURCE='observed'."
        )

    if DATASET_TYPE != "observed":
        raise ValueError(
            "Solar training requires "
            "DATASET_TYPE='observed'."
        )

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            "Observed Solar dataset not found:\n"
            f"{DATASET_PATH}"
        )

    if DATASET_PATH.suffix.lower() != ".csv":
        raise ValueError(
            "Solar training dataset must be a CSV file."
        )

    if not 0 < TEST_SIZE < 1:
        raise ValueError(
            "TEST_SIZE must be between 0 and 1."
        )

    if not REQUIRE_NON_NEGATIVE_TARGET:
        raise ValueError(
            "Solar generation target must be "
            "non-negative."
        )