from abc import ABC, abstractmethod
from typing import Generic, TypeVar

PredictionType = TypeVar("PredictionType")


class BasePredictor(
    ABC,
    Generic[PredictionType],
):
    """
    Base contract for renewable-energy predictors.

    Concrete predictors are responsible for executing
    the trained ML model and returning a domain-specific
    prediction object.
    """

    @abstractmethod
    def predict(self, *args, **kwargs) -> PredictionType:
        """Execute the prediction pipeline."""
        raise NotImplementedError