"""
Base preprocessing interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import pandas as pd


class BasePreprocessor(ABC):
    """Base class for all ML preprocessors."""

    @abstractmethod
    def fit(self, X: pd.DataFrame) -> "BasePreprocessor":
        """Fit the preprocessor."""

    @abstractmethod
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform data."""

    def fit_transform(
        self,
        X: pd.DataFrame,
    ) -> pd.DataFrame:
        """Fit and transform data."""

        self.fit(X)

        return self.transform(X)