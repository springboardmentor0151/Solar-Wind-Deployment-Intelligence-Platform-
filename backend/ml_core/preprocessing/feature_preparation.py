"""
Shared feature preparation for ML training and inference.

This module defines the boundary between raw data and the
authoritative ML feature contract.

Important:
    - Training data may contain missing feature values.
    - Training preprocessing is responsible for imputation.
    - Online prediction must NOT silently invent required values.
"""

from __future__ import annotations

from typing import Iterable

import pandas as pd

from ml_core.contracts.feature_contracts import (
    get_features,
    get_target,
)


def _to_dataframe(
    records: Iterable[dict] | pd.DataFrame,
) -> pd.DataFrame:

    if isinstance(records, pd.DataFrame):
        return records.copy()

    return pd.DataFrame(records)


def prepare_features(
    records: Iterable[dict] | pd.DataFrame,
    domain: str,
    *,
    allow_missing: bool = False,
) -> pd.DataFrame:
    """
    Prepare features according to the authoritative contract.

    Parameters
    ----------
    records:
        Input records or dataframe.

    domain:
        'solar' or 'wind'.

    allow_missing:
        True for training data where the fitted preprocessing
        pipeline will handle missing values.

        False for online inference where required values must
        be explicitly supplied.

    Returns
    -------
    pd.DataFrame
        Features in authoritative order.
    """

    features = get_features(domain)

    frame = _to_dataframe(records)

    missing_columns = [
        feature
        for feature in features
        if feature not in frame.columns
    ]

    if missing_columns and not allow_missing:
        raise ValueError(
            f"Missing required prediction features for "
            f"{domain}: {missing_columns}"
        )

    for feature in features:

        if feature not in frame.columns:
            frame[feature] = pd.NA

        frame[feature] = pd.to_numeric(
            frame[feature],
            errors="coerce",
        )

    result = frame[features].copy()

    if not allow_missing:

        missing_values = [
            feature
            for feature in features
            if result[feature].isna().any()
        ]

        if missing_values:
            raise ValueError(
                f"Missing or invalid prediction values for "
                f"{domain}: {missing_values}"
            )

    return result


def prepare_training_data(
    dataframe: pd.DataFrame,
    domain: str,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Prepare training features and target.

    Missing feature values are allowed here because the fitted
    preprocessing pipeline performs training-time imputation.
    """

    features = get_features(domain)
    target = get_target(domain)

    missing_features = [
        column
        for column in features
        if column not in dataframe.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features for {domain}: "
            f"{missing_features}"
        )

    if target not in dataframe.columns:
        raise ValueError(
            f"Missing target '{target}' for {domain}."
        )

    X = prepare_features(
        dataframe,
        domain,
        allow_missing=True,
    )

    y = pd.to_numeric(
        dataframe[target],
        errors="coerce",
    )

    if y.isna().any():
        raise ValueError(
            f"Target '{target}' contains invalid "
            "or missing values."
        )

    return X, y


def assert_feature_parity(
    frame: pd.DataFrame,
    domain: str,
) -> None:

    expected = get_features(domain)
    actual = list(frame.columns)

    if actual != expected:
        raise ValueError(
            f"Feature schema mismatch for '{domain}'. "
            f"Expected {expected}, got {actual}"
        )


def assert_target(
    dataframe: pd.DataFrame,
    domain: str,
) -> None:

    target = get_target(domain)

    if target not in dataframe.columns:
        raise ValueError(
            f"Target schema mismatch for '{domain}'. "
            f"Expected target '{target}'."
        )


def prepare_prediction_record(
    record: dict,
    domain: str,
) -> pd.DataFrame:
    """
    Prepare a single online prediction record.

    Unlike training data, prediction inputs must contain
    valid values for every required feature.
    """

    frame = prepare_features(
        [record],
        domain,
        allow_missing=False,
    )

    assert_feature_parity(
        frame,
        domain,
    )

    return frame