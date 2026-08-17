from __future__ import annotations

from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

# =========================================================
# REPOSITORIES
# =========================================================

from app.repositories.project_repository import (
    ProjectRepository,
)

from app.repositories.site_repository import (
    SiteRepository,
)


# =========================================================
# SERVICES
# =========================================================

from app.services.project_service import (
    ProjectService,
)

from app.services.site_service import (
    SiteService,
)

from app.services.gis_service import (
    GISService,
)

from app.services.gis_enrichment_service import (
    GISEnrichmentService,
)

from app.services.environmental_service import (
    EnvironmentalService,
)

from app.services.renewable_intelligence_service import (
    RenewableIntelligenceService,
)


# =========================================================
# ENVIRONMENTAL CLIENTS
# =========================================================

from app.environmental.clients.nasa_power_client import (
    NASAPowerClient,
)

from app.environmental.clients.weather_client import (
    WeatherClient,
)


# =========================================================
# GIS CLIENTS
# =========================================================

from app.gis.clients.sentinel_client import (
    SentinelClient,
)


# =========================================================
# PREDICTION
# =========================================================

from app.prediction.predictors.solar_predictor import (
    SolarPredictor,
)

from app.prediction.predictors.wind_predictor import (
    WindPredictor,
)

from app.prediction.predictors.hybrid_predictor import (
    HybridPredictor,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)


# =========================================================
# ML
# =========================================================

from app.ml.inference.model_loader import (
    MLModelLoader,
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

from app.services.project_manager_dashboard_service import (
    ProjectManagerDashboardService,
)
from app.services.resource_assessment_service import (
    ResourceAssessmentService,
)


from app.services.planner_dashboard_service import (
    PlannerDashboardService,
)

from app.services.gis_analyst_dashboard_service import (
    GISAnalystDashboardService,
)

from app.gis.clients.osm_client import (
    OSMClient,
)

from app.gis.clients.elevation_client import (
    ElevationClient,
)

from app.gis.clients.sentinel_client import (
    SentinelClient,
)

from app.services.report_service import (
    ReportService,
)

from app.repositories.notification_repository import (
    NotificationRepository,
)

from app.services.notification_service import (
    NotificationService,
)

from app.services.notification_trigger_service import (
    NotificationTriggerService,
)
# =========================================================
# DATABASE
# =========================================================

def get_db():
    """
    Provide a database session for a request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# =========================================================
# NOTIFICATION SERVICE
# =========================================================

def get_notification_service(
    db: Session = Depends(get_db),
) -> NotificationService:

    return NotificationService(
        repository=NotificationRepository(db),
    )


# =========================================================
# NOTIFICATION TRIGGER SERVICE
# =========================================================

def get_notification_trigger_service(
    db: Session = Depends(get_db),
) -> NotificationTriggerService:

    return NotificationTriggerService(
        repository=NotificationRepository(db),
    )


# =========================================================
# REPOSITORIES
# =========================================================

def get_site_repository(
    db: Session = Depends(get_db),
) -> SiteRepository:

    return SiteRepository(db)


def get_project_repository(
    db: Session = Depends(get_db),
) -> ProjectRepository:

    return ProjectRepository(db)


# =========================================================
# PROJECT SERVICE
# =========================================================

def get_project_service(
    project_repository: ProjectRepository = Depends(
        get_project_repository,
    ),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service,
    ),
) -> ProjectService:

    return ProjectService(
        repository=project_repository,
        notification_trigger_service=(
            notification_trigger_service
        ),
    )

# =========================================================
# GIS CLIENTS
# =========================================================

def get_osm_client() -> OSMClient:
    return OSMClient()


def get_elevation_client() -> ElevationClient:
    return ElevationClient()


def get_sentinel_client() -> SentinelClient:
    return SentinelClient()


# =========================================================
# GIS ENRICHMENT SERVICE
# =========================================================

def get_gis_enrichment_service(
    osm_client: OSMClient = Depends(
        get_osm_client,
    ),

    elevation_client: ElevationClient = Depends(
        get_elevation_client,
    ),

    sentinel_client: SentinelClient = Depends(
        get_sentinel_client,
    ),
) -> GISEnrichmentService:

    return GISEnrichmentService(
        osm_client=osm_client,
        elevation_client=elevation_client,
        sentinel_client=sentinel_client,
    )

# =========================================================
# GIS SERVICE
# =========================================================

def get_gis_service(
    site_repository: SiteRepository = Depends(
        get_site_repository,
    ),
    project_repository: ProjectRepository = Depends(
        get_project_repository,
    ),
) -> GISService:

    return GISService(
        site_repository=site_repository,
        project_repository=project_repository,
    )


# =========================================================
# SITE SERVICE
# =========================================================

def get_site_service(
    site_repository: SiteRepository = Depends(
        get_site_repository,
    ),
    project_repository: ProjectRepository = Depends(
        get_project_repository,
    ),
    gis_enrichment_service: GISEnrichmentService = Depends(
        get_gis_enrichment_service,
    ),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service,
    ),
) -> SiteService:

    return SiteService(
        site_repository=site_repository,
        project_repository=project_repository,
        gis_enrichment_service=gis_enrichment_service,
        notification_trigger_service=notification_trigger_service,
    )


# =========================================================
# ENVIRONMENTAL SERVICE
# =========================================================

def get_environmental_service(
    site_repository: SiteRepository = Depends(
        get_site_repository,
    ),
    project_repository: ProjectRepository = Depends(
        get_project_repository,
    ),
) -> EnvironmentalService:

    return EnvironmentalService(
        site_repository=site_repository,
        project_repository=project_repository,
        weather_client=WeatherClient(),
        nasa_client=NASAPowerClient(),
    )

# =========================================================
# ML MODEL LOADERS
# =========================================================

@lru_cache
def get_solar_model():
    """
    Return the cached solar ML artifact loader.
    """

    return MLModelLoader


@lru_cache
def get_wind_model():
    """
    Return the cached wind ML artifact loader.
    """

    return MLModelLoader


# =========================================================
# PREDICTORS
# =========================================================

@lru_cache
def get_solar_predictor() -> SolarPredictor:
    return SolarPredictor(
        model_loader=get_solar_model(),
    )


@lru_cache
def get_wind_predictor() -> WindPredictor:
    return WindPredictor(
        model_loader=get_wind_model(),
    )


@lru_cache
def get_hybrid_predictor() -> HybridPredictor:
    return HybridPredictor()


# =========================================================
# PREDICTION SERVICE
# =========================================================

@lru_cache
def get_prediction_service() -> PredictionService:

    return PredictionService(
        solar_predictor=get_solar_predictor(),
        wind_predictor=get_wind_predictor(),
        hybrid_predictor=get_hybrid_predictor(),
    )

# =========================================================
# RENEWABLE INTELLIGENCE SERVICE
# =========================================================

def get_renewable_intelligence_service(
    environmental_service: EnvironmentalService = Depends(
        get_environmental_service,
    ),
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
) -> RenewableIntelligenceService:
    """
    High-level orchestration dependency.

    Combines:

        EnvironmentalService
                +
        PredictionService

    to provide site-level renewable intelligence.
    """

    return RenewableIntelligenceService(
        environmental_service=environmental_service,
        prediction_service=prediction_service,
    )

# =========================================================
# SITE SUITABILITY
# =========================================================

def get_site_suitability_service(
    db: Session = Depends(get_db),
    environmental_service: EnvironmentalService = Depends(
        get_environmental_service,
    ),
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
) -> SiteSuitabilityService:

    return SiteSuitabilityService(
        db=db,
        environmental_service=environmental_service,
        prediction_service=prediction_service,
    )


# =========================================================
# RENEWABLE RECOMMENDATION
# =========================================================

def get_renewable_recommendation_service(
    db: Session = Depends(get_db),
) -> RenewableRecommendationService:

    return RenewableRecommendationService(
        db=db,
    )


# =========================================================
# DEPLOYMENT OPTIMIZATION
# =========================================================

def get_deployment_optimization_service(
    db: Session = Depends(get_db),
    suitability_service: SiteSuitabilityService = Depends(
        get_site_suitability_service,
    ),
    recommendation_service: RenewableRecommendationService = Depends(
        get_renewable_recommendation_service,
    ),
) -> DeploymentOptimizationService:

    return DeploymentOptimizationService(
        db=db,
        suitability_service=suitability_service,
        recommendation_service=recommendation_service,
    )


# =========================================================
# ENERGY FORECASTING
# =========================================================

def get_energy_forecasting_service(
    db: Session = Depends(get_db),
    deployment_optimization_service: DeploymentOptimizationService = Depends(
        get_deployment_optimization_service,
    ),
) -> EnergyForecastingService:

    return EnergyForecastingService(
        db=db,
        deployment_optimization_service=(
            deployment_optimization_service
        ),
    )


# =========================================================
# INVESTMENT RECOMMENDATION
# =========================================================

def get_investment_recommendation_service(
    db: Session = Depends(get_db),
    deployment_optimization_service: DeploymentOptimizationService = Depends(
        get_deployment_optimization_service,
    ),
    energy_forecasting_service: EnergyForecastingService = Depends(
        get_energy_forecasting_service,
    ),
) -> InvestmentRecommendationService:

    return InvestmentRecommendationService(
        db=db,
        deployment_optimization_service=(
            deployment_optimization_service
        ),
        energy_forecasting_service=(
            energy_forecasting_service
        ),
    )

# =========================================================
# PROJECT MANAGER DASHBOARD
# =========================================================

def get_project_manager_dashboard_service(
    db: Session = Depends(get_db),
) -> ProjectManagerDashboardService:
    # Read-only dashboard dependency. Expensive intelligence services are
    # intentionally excluded from this request path. The dashboard reads
    # persisted CandidateSite.analysis_snapshot data.
    return ProjectManagerDashboardService(db=db)

# =========================================================
# PLANNER DASHBOARD
# =========================================================

def get_planner_dashboard_service(
    db: Session = Depends(get_db),
) -> PlannerDashboardService:
    # Read-only dashboard dependency. Expensive intelligence services are
    # intentionally excluded from this request path.
    return PlannerDashboardService(db=db)


# =========================================================
# GIS ANALYST DASHBOARD
# =========================================================

def get_gis_analyst_dashboard_service(
    db: Session = Depends(get_db),
) -> GISAnalystDashboardService:
    # Read-only dashboard dependency. Expensive intelligence services are
    # intentionally excluded from this request path.
    return GISAnalystDashboardService(db=db)

# =========================================================
# REPORT SERVICE
# =========================================================

def get_report_service(
    db: Session = Depends(get_db),

    environmental_service: EnvironmentalService = Depends(
        get_environmental_service,
    ),

    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),

    suitability_service: SiteSuitabilityService = Depends(
        get_site_suitability_service,
    ),

    recommendation_service: RenewableRecommendationService = Depends(
        get_renewable_recommendation_service,
    ),

    deployment_optimization_service: DeploymentOptimizationService = Depends(
        get_deployment_optimization_service,
    ),

    energy_forecasting_service: EnergyForecastingService = Depends(
        get_energy_forecasting_service,
    ),

    investment_recommendation_service: InvestmentRecommendationService = Depends(
        get_investment_recommendation_service,
    ),
) -> ReportService:

    return ReportService(
        db=db,

        environmental_service=(
            environmental_service
        ),

        prediction_service=(
            prediction_service
        ),

        suitability_service=(
            suitability_service
        ),

        recommendation_service=(
            recommendation_service
        ),

        deployment_optimization_service=(
            deployment_optimization_service
        ),

        energy_forecasting_service=(
            energy_forecasting_service
        ),

        investment_recommendation_service=(
            investment_recommendation_service
        ),
    )


# =========================================================
# RESOURCE ASSESSMENT
# =========================================================

def get_resource_assessment_service(
    db: Session = Depends(get_db),
    environmental_service: EnvironmentalService = Depends(get_environmental_service),
    prediction_service: PredictionService = Depends(get_prediction_service),
    deployment_optimization_service: DeploymentOptimizationService = Depends(get_deployment_optimization_service),
    energy_forecasting_service: EnergyForecastingService = Depends(get_energy_forecasting_service),
) -> ResourceAssessmentService:
    return ResourceAssessmentService(
        db=db,
        environmental_service=environmental_service,
        prediction_service=prediction_service,
        deployment_optimization_service=deployment_optimization_service,
        energy_forecasting_service=energy_forecasting_service,
    )
