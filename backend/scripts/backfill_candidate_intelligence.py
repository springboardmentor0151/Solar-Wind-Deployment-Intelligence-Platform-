"""Backfill stored forecast/investment intelligence for existing candidates.

Run from backend:

    python -m scripts.backfill_candidate_intelligence

This script intentionally constructs the service dependency graph manually.
FastAPI's Depends(...) only gets resolved when FastAPI handles a request,
so the API dependency functions must not be called directly from this script.
"""

from app.db.database import SessionLocal

from app.repositories.candidate_site_repository import (
    CandidateSiteRepository,
)
from app.repositories.project_repository import (
    ProjectRepository,
)
from app.repositories.site_repository import (
    SiteRepository,
)

from app.environmental.clients.nasa_power_client import (
    NASAPowerClient,
)
from app.environmental.clients.weather_client import (
    WeatherClient,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)
from app.prediction.predictors.solar_predictor import (
    SolarPredictor,
)
from app.prediction.predictors.wind_predictor import (
    WindPredictor,
)
from app.prediction.predictors.hybrid_predictor import (
    HybridPredictor,
)

from app.ml.inference.model_loader import (
    MLModelLoader,
)

from app.services.environmental_service import (
    EnvironmentalService,
)
from app.services.site_suitability_service import (
    SiteSuitabilityService,
)
from app.services.renewable_recommendation_service import (
    RenewableRecommendationService,
)
from app.services.deployment_optimization_service import (
    DeploymentOptimizationService,
)
from app.services.energy_forecasting_service import (
    EnergyForecastingService,
)
from app.services.investment_recommendation_service import (
    InvestmentRecommendationService,
)


def build_services(db):
    """Build the same service dependency graph used by FastAPI."""

    # =========================================================
    # REPOSITORIES
    # =========================================================

    site_repository = SiteRepository(db)
    project_repository = ProjectRepository(db)

    # =========================================================
    # ENVIRONMENTAL SERVICE
    # =========================================================

    environmental_service = EnvironmentalService(
        site_repository=site_repository,
        project_repository=project_repository,
        weather_client=WeatherClient(),
        nasa_client=NASAPowerClient(),
    )

    # =========================================================
    # PREDICTION SERVICE
    # =========================================================

    solar_predictor = SolarPredictor(
        model_loader=MLModelLoader,
    )

    wind_predictor = WindPredictor(
        model_loader=MLModelLoader,
    )

    hybrid_predictor = HybridPredictor()

    prediction_service = PredictionService(
        solar_predictor=solar_predictor,
        wind_predictor=wind_predictor,
        hybrid_predictor=hybrid_predictor,
    )

    # =========================================================
    # SITE SUITABILITY
    # =========================================================

    suitability_service = SiteSuitabilityService(
        db=db,
        environmental_service=environmental_service,
        prediction_service=prediction_service,
    )

    # =========================================================
    # RENEWABLE RECOMMENDATION
    # =========================================================

    recommendation_service = RenewableRecommendationService(
        db=db,
    )

    # =========================================================
    # DEPLOYMENT OPTIMIZATION
    # =========================================================

    deployment_optimization_service = DeploymentOptimizationService(
        db=db,
        suitability_service=suitability_service,
        recommendation_service=recommendation_service,
    )

    # =========================================================
    # ENERGY FORECASTING
    # =========================================================

    energy_forecasting_service = EnergyForecastingService(
        db=db,
        deployment_optimization_service=(
            deployment_optimization_service
        ),
    )

    # =========================================================
    # INVESTMENT RECOMMENDATION
    # =========================================================

    investment_recommendation_service = (
        InvestmentRecommendationService(
            db=db,
            deployment_optimization_service=(
                deployment_optimization_service
            ),
            energy_forecasting_service=(
                energy_forecasting_service
            ),
        )
    )

    return investment_recommendation_service


def main():
    db = SessionLocal()

    try:
        investment_service = build_services(db)

        repository = CandidateSiteRepository(db)

        # Process both approved and pending candidates.
        candidates = (
            repository.get_approved()
            + repository.get_pending()
        )

        seen = set()

        if not candidates:
            print("No candidates found.")
            return

        for candidate in candidates:

            if candidate.id in seen:
                continue

            seen.add(candidate.id)

            snapshot = dict(
                candidate.analysis_snapshot or {}
            )

            # -------------------------------------------------
            # Skip candidates that already contain both
            # intelligence sections.
            # -------------------------------------------------

            if (
                snapshot.get("investment")
                and snapshot.get("forecast")
            ):
                print(
                    f"Candidate {candidate.id}: "
                    "already populated"
                )
                continue

            print(
                f"Candidate {candidate.id}: "
                f"generating intelligence for site "
                f"{candidate.site_id}..."
            )

            try:
                investment = (
                    investment_service.evaluate_investment(
                        candidate.site_id
                    )
                )

                # -------------------------------------------------
                # Store complete investment recommendation
                # -------------------------------------------------

                snapshot["investment"] = (
                    investment.model_dump(
                        mode="json"
                    )
                )

                # -------------------------------------------------
                # Store forecast information.
                #
                # The investment service already consumes the
                # authoritative EnergyForecastingService, and its
                # response exposes the expected annual generation.
                # -------------------------------------------------

                snapshot["forecast"] = {
                    "annual_generation_mwh": (
                        investment.expected_generation_mwh
                    ),
                    "expected_generation_mwh": (
                        investment.expected_generation_mwh
                    ),
                }

                candidate.analysis_snapshot = snapshot

                repository.update(candidate)

                print(
                    f"Candidate {candidate.id}: stored successfully"
                )

            except Exception as exc:
                # Roll back this candidate's transaction so one
                # problematic site does not corrupt the session
                # for the remaining candidates.
                db.rollback()

                print(
                    f"Candidate {candidate.id}: FAILED - {exc}"
                )

        print("")
        print("Backfill complete.")

    finally:
        db.close()


if __name__ == "__main__":
    main()