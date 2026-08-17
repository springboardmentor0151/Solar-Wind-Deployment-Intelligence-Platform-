"""
Numeric missing-value imputer.
"""

from __future__ import annotations

import pandas as pd

from ml_core.preprocessing.base import BasePreprocessor


class NumericImputer(BasePreprocessor):
    """
    Median-based numeric imputer.

    Important:
    Median values are learned only from training data.
    """

    def __init__(self) -> None:
        self.medians: pd.Series | None = None

    def fit(
        self,
        X: pd.DataFrame,
    ) -> "NumericImputer":

        if not isinstance(X, pd.DataFrame):
            raise TypeError(
                "X must be a pandas DataFrame."
            )

        if X.empty:
            raise ValueError(
                "Cannot fit imputer on an empty DataFrame."
            )

        numeric = X.apply(
            pd.to_numeric,
            errors="coerce",
        )

        self.medians = numeric.median()

        # Protect against columns containing only NaN.
        self.medians = self.medians.fillna(0.0)

        return self

    def transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        if self.medians is None:
            raise RuntimeError(
                "NumericImputer must be fitted before transform."
            )

        result = X.copy()

        for column in self.medians.index:

            result[column] = pd.to_numeric(
                result[column],
                errors="coerce",
            )

            result[column] = result[column].fillna(
                self.medians[column]
            )

        return result

    def fit_transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:

        return super().fit_transform(X)