"""
Wind observed-data model evaluation.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


def evaluate_model(
    model,
    X_test,
    y_test,
) -> dict:
    """
    Evaluate the Wind ML regression model
    on the held-out observed test dataset.
    """

    predictions = np.asarray(
        model.predict(X_test),
        dtype=float,
    )

    actual = np.asarray(
        y_test,
        dtype=float,
    )

    mae = mean_absolute_error(
        actual,
        predictions,
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predictions,
        )
    )

    r2 = r2_score(
        actual,
        predictions,
    )

    non_zero_actual = actual != 0

    if non_zero_actual.any():
        mape = (
            np.mean(
                np.abs(
                    (
                        actual[non_zero_actual]
                        - predictions[non_zero_actual]
                    )
                    / actual[non_zero_actual]
                )
            )
            * 100
        )
    else:
        mape = None

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "mape_percent": (
            float(mape)
            if mape is not None
            else None
        ),
    }


def print_metrics(
    metrics: dict,
) -> None:

    print("\nWind Model Evaluation")
    print("=" * 45)

    for name, value in metrics.items():

        if value is None:
            print(f"{name}: N/A")
        else:
            print(f"{name}: {value:.6f}")

    print("=" * 45)


def save_metrics(
    metrics: dict,
    path: str | Path,
) -> None:

    path = Path(path)

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with path.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            metrics,
            file,
            indent=2,
        )