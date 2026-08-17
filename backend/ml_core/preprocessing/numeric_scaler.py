"""
Numeric standard scaler.
"""

from __future__ import annotations

import pandas as pd

from ml_core.preprocessing.base import BasePreprocessor


class NumericScaler(BasePreprocessor):
    """
    Standardization:

        x_scaled = (x - mean) / std

    Statistics are learned only from training data.
    """

    def __init__(self) -> None:
        self.means: pd.Series | None = None
        self.stds: pd.Series | None = None

    def fit(
        self,
        X: pd.DataFrame,
    ) -> "NumericScaler":

        if not isinstance(X, pd.DataFrame):
            raise TypeError(
                "X must be a pandas DataFrame."
            )

        if X.empty:
            raise ValueError(
                "Cannot fit scaler on an empty DataFrame."
            )

        numeric = X.apply(
            pd.to_numeric,
            errors="coerce",
        )

        self.means = numeric.mean()
        self.stds = numeric.std()

        # Avoid division by zero for constant features.
        self.stds = self.stds.replace(
            0,
            1.0,
        ).fillna(1.0)

        self.means = self.means.fillna(0.0)

        return self

    def transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        if self.means is None or self.stds is None:
            raise RuntimeError(
                "NumericScaler must be fitted before transform."
            )

        result = X.copy()

        for column in self.means.index:

            result[column] = pd.to_numeric(
                result[column],
                errors="coerce",
            )

            result[column] = (
                result[column] - self.means[column]
            ) / self.stds[column]

        return result

    def inverse_transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        if self.means is None or self.stds is None:
            raise RuntimeError(
                "NumericScaler must be fitted before inverse_transform."
            )

        result = X.copy()

        for column in self.means.index:

            result[column] = (
                result[column] * self.stds[column]
            ) + self.means[column]

        return result