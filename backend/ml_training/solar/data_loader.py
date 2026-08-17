"""
Solar observed dataset loader.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from ml_core.preprocessing.feature_preparation import (
    prepare_training_data,
)

from ml_training.common.validation import (
    validate_dataset,
)

from ml_training.solar.config import (
    DATASET_PATH,
    FEATURES,
    TARGET,
)


def load_solar_observed_data(
    path: str | Path = DATASET_PATH,
) -> pd.DataFrame:
    """
    Load and validate the Solar observed dataset.
    """

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Solar observed dataset not found: {path}"
        )

    if path.suffix.lower() != ".csv":
        raise ValueError(
            "Solar observed dataset must be a CSV file."
        )

    dataframe = pd.read_csv(path)

    if dataframe.empty:
        raise ValueError(
            "Solar observed dataset is empty."
        )

    validate_dataset(
        dataframe,
        "solar",
    )

    return dataframe


def prepare_solar_training_data(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.Series]:

    X, y = prepare_training_data(
        dataframe,
        "solar",
    )

    if list(X.columns) != FEATURES:
        raise ValueError(
            "Solar feature ordering does not match "
            "the authoritative feature contract."
        )

    y.name = TARGET

    return X, y


def get_dataset_summary(
    dataframe: pd.DataFrame,
) -> dict:

    return {
        "data_source": "observed",
        "dataset_type": "observed",
        "rows": int(len(dataframe)),
        "features": len(FEATURES),
        "feature_names": FEATURES.copy(),
        "target": TARGET,
        "target_unique_values": int(
            dataframe[TARGET].nunique()
        ),
        "target_min": float(
            dataframe[TARGET].min()
        ),
        "target_max": float(
            dataframe[TARGET].max()
        ),
        "target_mean": float(
            dataframe[TARGET].mean()
        ),
    }