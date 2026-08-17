"""
Shared ML preprocessing pipeline.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from ml_core.preprocessing.base import BasePreprocessor
from ml_core.preprocessing.numeric_imputer import NumericImputer
from ml_core.preprocessing.numeric_scaler import NumericScaler


class PreprocessingPipeline(BasePreprocessor):
    """
    Numeric preprocessing pipeline.

    Flow:

        Input
          ↓
        Numeric conversion
          ↓
        Median imputation
          ↓
        Standard scaling
          ↓
        Output
    """

    def __init__(
        self,
        use_scaler: bool = True,
    ) -> None:

        self.use_scaler = use_scaler

        self.imputer = NumericImputer()

        self.scaler = (
            NumericScaler()
            if use_scaler
            else None
        )

        self.feature_names: list[str] = []

    def fit(
        self,
        X: pd.DataFrame,
    ) -> "PreprocessingPipeline":

        if not isinstance(X, pd.DataFrame):
            raise TypeError(
                "X must be a pandas DataFrame."
            )

        if X.empty:
            raise ValueError(
                "Cannot fit preprocessing pipeline "
                "on an empty DataFrame."
            )

        self.feature_names = list(X.columns)

        X_numeric = X.apply(
            pd.to_numeric,
            errors="coerce",
        )

        X_imputed = self.imputer.fit_transform(
            X_numeric
        )

        if self.scaler is not None:
            self.scaler.fit(X_imputed)

        return self

    def transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        if not self.feature_names:
            raise RuntimeError(
                "PreprocessingPipeline must be fitted "
                "before transform."
            )

        missing = [
            column
            for column in self.feature_names
            if column not in X.columns
        ]

        if missing:
            raise ValueError(
                f"Missing features during preprocessing: {missing}"
            )

        result = X[
            self.feature_names
        ].copy()

        result = result.apply(
            pd.to_numeric,
            errors="coerce",
        )

        result = self.imputer.transform(
            result
        )

        if self.scaler is not None:
            result = self.scaler.transform(
                result
            )

        return result

    def fit_transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        self.fit(X)

        return self.transform(X)

    def get_metadata(self) -> dict[str, Any]:
        """Return serializable preprocessing metadata."""

        metadata: dict[str, Any] = {
            "feature_names": self.feature_names,
            "use_scaler": self.use_scaler,
        }

        if self.imputer.medians is not None:
            metadata["imputer_medians"] = {
                key: float(value)
                for key, value
                in self.imputer.medians.items()
            }

        if (
            self.scaler is not None
            and self.scaler.means is not None
            and self.scaler.stds is not None
        ):
            metadata["scaler_means"] = {
                key: float(value)
                for key, value
                in self.scaler.means.items()
            }

            metadata["scaler_stds"] = {
                key: float(value)
                for key, value
                in self.scaler.stds.items()
            }

        return metadata