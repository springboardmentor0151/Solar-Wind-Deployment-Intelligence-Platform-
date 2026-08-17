from __future__ import annotations

from io import BytesIO
from typing import Any

from sqlalchemy.orm import Session

from app.models.site import Site

from app.services.deployment_optimization_service import (
    DeploymentOptimizationService,
)
from app.services.energy_forecasting_service import (
    EnergyForecastingService,
)
from app.services.environmental_service import (
    EnvironmentalService,
)
from app.services.investment_recommendation_service import (
    InvestmentRecommendationService,
)
from app.services.renewable_recommendation_service import (
    RenewableRecommendationService,
)
from app.services.site_suitability_service import (
    SiteSuitabilityService,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)

from app.schemas.reports import (
    SiteReportResponse,
    SiteReportSummary,
    SiteComparisonItem,
    SiteComparisonResponse,
)


class ReportService:
    """
    Report and export service.

    IMPORTANT:
        This service does NOT implement or modify business logic.

    It only collects the authoritative outputs from the existing
    backend intelligence services and prepares them for:

        - JSON reports
        - PDF export
        - Excel export
    """

    def __init__(
        self,
        db: Session,
        environmental_service: EnvironmentalService,
        prediction_service: PredictionService,
        suitability_service: SiteSuitabilityService,
        recommendation_service: RenewableRecommendationService,
        deployment_optimization_service: DeploymentOptimizationService,
        energy_forecasting_service: EnergyForecastingService,
        investment_recommendation_service: InvestmentRecommendationService,
    ) -> None:

        self.db = db

        self.environmental_service = (
            environmental_service
        )

        self.prediction_service = (
            prediction_service
        )

        self.suitability_service = (
            suitability_service
        )

        self.recommendation_service = (
            recommendation_service
        )

        self.deployment_optimization_service = (
            deployment_optimization_service
        )

        self.energy_forecasting_service = (
            energy_forecasting_service
        )

        self.investment_recommendation_service = (
            investment_recommendation_service
        )

    # =========================================================
    # SITE REPORT
    # =========================================================

    def generate_site_report(
        self,
        site_id: int,
    ) -> SiteReportResponse:

        site = (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # -----------------------------------------------------
        # SITE
        # -----------------------------------------------------

        site_summary = SiteReportSummary(
            site_id=site.id,
            site_name=site.name,
            latitude=site.latitude,
            longitude=site.longitude,
            region=site.region,
            land_area=site.land_area,
            elevation=site.elevation,
        )

        # -----------------------------------------------------
        # GIS
        #
        # Use the already persisted site enrichment values.
        # No GIS/business logic is recalculated here.
        # -----------------------------------------------------

        gis_data = {
            "elevation": site.elevation,
            "land_use": site.land_use,
            "road_distance": site.road_distance,
            "nearest_substation_distance": (
                site.nearest_substation_distance
            ),
            "nearest_transmission_line_distance": (
                site.nearest_transmission_line_distance
            ),
            "water_body_distance": (
                site.water_body_distance
            ),
            "protected_area_distance": (
                site.protected_area_distance
            ),
            "land_slope": site.land_slope,
            "vegetation_index": (
                site.vegetation_index
            ),
            "existing_infrastructure": (
                site.existing_infrastructure
            ),
        }

        # -----------------------------------------------------
        # ENVIRONMENT
        # -----------------------------------------------------

        environmental = (
            self.environmental_service
            .get_site_environment(site_id)
        )

        # -----------------------------------------------------
        # PREDICTION
        #
        # Use the existing site intelligence pipeline.
        # -----------------------------------------------------

        solar_prediction = None
        wind_prediction = None

        try:
            prediction_result = (
                self.prediction_service
                .predict_site(site_id)
            )

            prediction_data = self._dump(
                prediction_result
            )

            if isinstance(
                prediction_data,
                dict,
            ):
                solar_prediction = (
                    prediction_data.get(
                        "solar"
                    )
                )

                wind_prediction = (
                    prediction_data.get(
                        "wind"
                    )
                )

        except Exception:
            # Reports should still be generated if a particular
            # optional intelligence section is unavailable.
            pass

        # -----------------------------------------------------
        # SUITABILITY
        # -----------------------------------------------------

        suitability = (
            self.suitability_service
            .evaluate_site(site_id)
        )

        # -----------------------------------------------------
        # RENEWABLE RECOMMENDATION
        # -----------------------------------------------------

        suitability_data = self._dump(
            suitability
        )

        recommendation = (
            self.recommendation_service
            .recommend(
                site_id=site_id,
                suitability_data=suitability_data,
            )
        )

        # -----------------------------------------------------
        # DEPLOYMENT OPTIMIZATION
        # -----------------------------------------------------

        deployment = (
            self.deployment_optimization_service
            .optimize_site(
                site_id=site_id,
            )
        )

        # -----------------------------------------------------
        # ENERGY FORECAST
        # -----------------------------------------------------

        forecast = (
            self.energy_forecasting_service
            .forecast(
                site_id=site_id,
            )
        )

        # -----------------------------------------------------
        # INVESTMENT
        # -----------------------------------------------------

        investment = (
            self.investment_recommendation_service
            .evaluate_investment(
                site_id=site_id,
            )
        )

        # -----------------------------------------------------
        # FINAL REPORT
        # -----------------------------------------------------

        return SiteReportResponse(
            site=site_summary,

            gis=gis_data,

            environmental=self._dump(
                environmental
            ),

            solar_prediction=solar_prediction,

            wind_prediction=wind_prediction,

            suitability=self._dump(
                suitability
            ),

            renewable_recommendation=self._dump(
                recommendation
            ),

            deployment_optimization=self._dump(
                deployment
            ),

            energy_forecast=self._dump(
                forecast
            ),

            investment_recommendation=self._dump(
                investment
            ),
        )
    
    # =========================================================
    # SITE COMPARISON
    # =========================================================

    def compare_sites(self, site_ids: list[int]) -> SiteComparisonResponse:
        """
        Compare a small set of sites using the existing intelligence
        services. No scoring logic is duplicated here; suitability and
        recommendation remain authoritative in their existing services.
        """
        if len(site_ids) < 2:
            raise ValueError("Select at least 2 sites for comparison.")
        if len(site_ids) > 5:
            raise ValueError("A maximum of 5 sites can be compared at once.")

        unique_ids = list(dict.fromkeys(site_ids))
        sites = (
            self.db.query(Site)
            .filter(Site.id.in_(unique_ids))
            .all()
        )
        by_id = {site.id: site for site in sites}
        missing = [site_id for site_id in unique_ids if site_id not in by_id]
        if missing:
            raise ValueError(f"Site(s) not found: {', '.join(map(str, missing))}")

        items = []
        for site_id in unique_ids:
            site = by_id[site_id]
            suitability = self.suitability_service.evaluate_site(site_id)
            suitability_data = self._dump(suitability)
            recommendation = self.recommendation_service.recommend(
                site_id=site_id,
                suitability_data=suitability_data,
            )

            items.append(
                SiteComparisonItem(
                    site_id=site.id,
                    site_name=site.name,
                    region=site.region,
                    latitude=site.latitude,
                    longitude=site.longitude,
                    land_area=site.land_area,
                    elevation=site.elevation,
                    land_use=site.land_use,
                    land_slope=site.land_slope,
                    road_distance=site.road_distance,
                    nearest_substation_distance=site.nearest_substation_distance,
                    suitability_score=getattr(recommendation, "overall_site_score", None),
                    solar_score=getattr(getattr(recommendation, "solar", None), "score", None),
                    wind_score=getattr(getattr(recommendation, "wind", None), "score", None),
                    hybrid_score=getattr(recommendation, "hybrid_score", None),
                    recommended_technology=(
                        getattr(getattr(recommendation, "recommended_technology", None), "value", None)
                        or str(getattr(recommendation, "recommended_technology", ""))
                        or None
                    ),
                    deployment_feasible=getattr(recommendation, "deployment_feasible", None),
                )
            )

        return SiteComparisonResponse(sites=items)

    # =========================================================
    # PDF GENERATION
    # =========================================================

    def generate_pdf(
        self,
        site_id: int,
    ) -> BytesIO:

        report = self.generate_site_report(site_id)

        buffer = BytesIO()

        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import (
            ParagraphStyle,
            getSampleStyleSheet,
        )
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            PageBreak,
            KeepTogether,
        )

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=36,
            bottomMargin=36,
            title="Solar & Wind Deployment Intelligence - Site Report",
            author="Solar & Wind Deployment Intelligence Platform",
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=20,
            leading=24,
            spaceAfter=8,
        )

        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Heading2"],
            alignment=TA_CENTER,
            fontSize=13,
            leading=16,
            spaceAfter=18,
        )

        section_style = ParagraphStyle(
            "ReportSection",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            spaceBefore=10,
            spaceAfter=8,
        )

        subsection_style = ParagraphStyle(
            "ReportSubsection",
            parent=styles["Heading3"],
            fontSize=11,
            leading=14,
            spaceBefore=8,
            spaceAfter=5,
        )

        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["BodyText"],
            fontSize=8.5,
            leading=11,
            wordWrap="CJK",
        )

        key_style = ParagraphStyle(
            "ReportKey",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        story = []

        # =====================================================
        # TITLE
        # =====================================================

        story.append(
            Paragraph(
                "Solar & Wind Deployment Intelligence",
                title_style,
            )
        )

        story.append(
            Paragraph(
                "Site Assessment Report",
                subtitle_style,
            )
        )

        # =====================================================
        # SITE INFORMATION
        # =====================================================

        story.append(
            Paragraph(
                "1. Site Information",
                section_style,
            )
        )

        site = report.site

        site_rows = [
            [
                Paragraph("Site ID", key_style),
                Paragraph(str(site.site_id), body_style),
            ],
            [
                Paragraph("Site Name", key_style),
                Paragraph(
                    self._pdf_safe_value(site.site_name),
                    body_style,
                ),
            ],
            [
                Paragraph("Latitude", key_style),
                Paragraph(str(site.latitude), body_style),
            ],
            [
                Paragraph("Longitude", key_style),
                Paragraph(str(site.longitude), body_style),
            ],
            [
                Paragraph("Region", key_style),
                Paragraph(
                    self._pdf_safe_value(
                        site.region
                    ),
                    body_style,
                ),
            ],
            [
                Paragraph("Land Area", key_style),
                Paragraph(
                    self._pdf_safe_value(
                        site.land_area
                    ),
                    body_style,
                ),
            ],
            [
                Paragraph("Elevation", key_style),
                Paragraph(
                    self._pdf_safe_value(
                        site.elevation
                    ),
                    body_style,
                ),
            ],
        ]

        site_table = Table(
            site_rows,
            colWidths=[160, 320],
            repeatRows=0,
        )

        site_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        colors.lightgrey,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                ]
            )
        )

        story.append(site_table)
        story.append(Spacer(1, 14))

        # =====================================================
        # REPORT SECTIONS
        # =====================================================

        sections = [
            (
                "2. GIS Information",
                report.gis,
            ),
            (
                "3. Environmental Information",
                report.environmental,
            ),
            (
                "4. Solar Prediction",
                report.solar_prediction,
            ),
            (
                "5. Wind Prediction",
                report.wind_prediction,
            ),
            (
                "6. Site Suitability",
                report.suitability,
            ),
            (
                "7. Renewable Recommendation",
                report.renewable_recommendation,
            ),
            (
                "8. Deployment Optimization",
                report.deployment_optimization,
            ),
            (
                "9. Energy Forecast",
                report.energy_forecast,
            ),
            (
                "10. Investment Recommendation",
                report.investment_recommendation,
            ),
        ]

        for section_title, section_data in sections:

            story.append(
                Paragraph(
                    section_title,
                    section_style,
                )
            )

            if section_data is None:
                story.append(
                    Paragraph(
                        "No data available.",
                        body_style,
                    )
                )
                story.append(Spacer(1, 8))
                continue

            self._add_pdf_data(
                story,
                section_data,
                body_style,
                key_style,
                subsection_style,
            )

            story.append(Spacer(1, 10))

        # =====================================================
        # BUILD PDF
        # =====================================================

        document.build(story)

        buffer.seek(0)

        return buffer
    # =========================================================
    # EXCEL
    # =========================================================

    def generate_excel(
        self,
        site_id: int,
    ) -> BytesIO:

        report = self.generate_site_report(
            site_id
        )

        from openpyxl import Workbook

        workbook = Workbook()

        # Remove default worksheet.
        worksheet = workbook.active
        worksheet.title = "Site Information"

        # -----------------------------------------------------
        # SITE INFORMATION
        # -----------------------------------------------------

        self._write_dict_to_sheet(
            worksheet,
            self._dump(report.site),
        )

        # -----------------------------------------------------
        # OTHER SECTIONS
        # -----------------------------------------------------

        sections = [
            (
                "GIS",
                report.gis,
            ),
            (
                "Environmental",
                report.environmental,
            ),
            (
                "Solar Prediction",
                report.solar_prediction,
            ),
            (
                "Wind Prediction",
                report.wind_prediction,
            ),
            (
                "Suitability",
                report.suitability,
            ),
            (
                "Recommendation",
                report.renewable_recommendation,
            ),
            (
                "Optimization",
                report.deployment_optimization,
            ),
            (
                "Energy Forecast",
                report.energy_forecast,
            ),
            (
                "Investment",
                report.investment_recommendation,
            ),
        ]

        for sheet_name, data in sections:

            worksheet = workbook.create_sheet(
                title=sheet_name[:31]
            )

            self._write_dict_to_sheet(
                worksheet,
                data,
            )

        buffer = BytesIO()

        workbook.save(buffer)

        buffer.seek(0)

        return buffer

    # =========================================================
    # HELPERS
    # =========================================================

    # =========================================================
    # PDF VALUE FORMATTER
    # =========================================================

    @staticmethod
    def _pdf_safe_value(
        value,
    ) -> str:

        if value is None:
            return "N/A"

        if isinstance(value, bool):
            return "Yes" if value else "No"

        if isinstance(value, float):
            return f"{value:.4f}".rstrip("0").rstrip(".")

        return str(value)


    # =========================================================
    # PDF DATA RENDERER
    # =========================================================

    def _add_pdf_data(
        self,
        story,
        data,
        body_style,
        key_style,
        subsection_style,
    ):
        """
        Safely render dictionaries/lists into PDF flowables.

        Important:
        Large nested structures such as:

            monthly_forecast
            hourly_forecast
            forecast
            recommendations
            feature sets

        are NOT placed into a single Table cell.

        They are recursively rendered so ReportLab can
        paginate them correctly.
        """

        from reportlab.lib import colors
        from reportlab.platypus import (
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )

        # -----------------------------------------------------
        # DICTIONARY
        # -----------------------------------------------------

        if isinstance(data, dict):

            for key, value in data.items():

                readable_key = self._format_pdf_key(key)

                # Nested dictionary
                if isinstance(value, dict):

                    story.append(
                        Paragraph(
                            readable_key,
                            subsection_style,
                        )
                    )

                    self._add_pdf_data(
                        story,
                        value,
                        body_style,
                        key_style,
                        subsection_style,
                    )

                    continue

                # List / array
                if isinstance(value, list):

                    story.append(
                        Paragraph(
                            readable_key,
                            subsection_style,
                        )
                    )

                    self._add_pdf_list(
                        story,
                        value,
                        body_style,
                        key_style,
                        subsection_style,
                    )

                    continue

                # Normal scalar
                row = Table(
                    [
                        [
                            Paragraph(
                                readable_key,
                                key_style,
                            ),
                            Paragraph(
                                self._pdf_safe_value(
                                    value
                                ),
                                body_style,
                            ),
                        ]
                    ],
                    colWidths=[190, 290],
                )

                row.setStyle(
                    TableStyle(
                        [
                            (
                                "BACKGROUND",
                                (0, 0),
                                (0, 0),
                                colors.lightgrey,
                            ),
                            (
                                "GRID",
                                (0, 0),
                                (-1, -1),
                                0.35,
                                colors.grey,
                            ),
                            (
                                "VALIGN",
                                (0, 0),
                                (-1, -1),
                                "TOP",
                            ),
                            (
                                "LEFTPADDING",
                                (0, 0),
                                (-1, -1),
                                5,
                            ),
                            (
                                "RIGHTPADDING",
                                (0, 0),
                                (-1, -1),
                                5,
                            ),
                            (
                                "TOPPADDING",
                                (0, 0),
                                (-1, -1),
                                4,
                            ),
                            (
                                "BOTTOMPADDING",
                                (0, 0),
                                (-1, -1),
                                4,
                            ),
                        ]
                    )
                )

                story.append(row)

            return

        # -----------------------------------------------------
        # LIST
        # -----------------------------------------------------

        if isinstance(data, list):

            self._add_pdf_list(
                story,
                data,
                body_style,
                key_style,
                subsection_style,
            )

            return

        # -----------------------------------------------------
        # SCALAR
        # -----------------------------------------------------

        story.append(
            Paragraph(
                self._pdf_safe_value(data),
                body_style,
            )
        )


        # =========================================================
    # PDF LIST RENDERER
    # =========================================================

    def _add_pdf_list(
        self,
        story,
        values,
        body_style,
        key_style,
        subsection_style,
    ):
        """
        Render lists without creating oversized table cells.

        Handles:

            list[str]
            list[int]
            list[float]
            list[dict]
            nested lists
        """

        from reportlab.lib import colors
        from reportlab.platypus import (
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )

        if not values:

            story.append(
                Paragraph(
                    "No data available.",
                    body_style,
                )
            )

            return

        # -----------------------------------------------------
        # LIST OF DICTIONARIES
        # -----------------------------------------------------

        if all(
            isinstance(item, dict)
            for item in values
        ):

            for index, item in enumerate(values, start=1):

                story.append(
                    Paragraph(
                        f"Item {index}",
                        subsection_style,
                    )
                )

                self._add_pdf_data(
                    story,
                    item,
                    body_style,
                    key_style,
                    subsection_style,
                )

                story.append(
                    Spacer(1, 5)
                )

            return

        # -----------------------------------------------------
        # SIMPLE LIST
        # -----------------------------------------------------

        for index, item in enumerate(values, start=1):

            if isinstance(item, (dict, list)):

                self._add_pdf_data(
                    story,
                    item,
                    body_style,
                    key_style,
                    subsection_style,
                )

                continue

            story.append(
                Paragraph(
                    f"• {self._pdf_safe_value(item)}",
                    body_style,
                )
            )


    # =========================================================
    # PDF KEY FORMATTER
    # =========================================================

    @staticmethod
    def _format_pdf_key(
        key: str,
    ) -> str:

        if not key:
            return ""

        text = str(key)

        text = text.replace(
            "_",
            " ",
        )

        return text.strip().title()


    @staticmethod
    def _dump(
        value: Any,
    ) -> Any:

        if value is None:
            return None

        if hasattr(
            value,
            "model_dump",
        ):
            return value.model_dump(
                mode="json"
            )

        if isinstance(
            value,
            dict,
        ):
            return {
                key: ReportService._dump(
                    item
                )
                for key, item in value.items()
            }

        if isinstance(
            value,
            list,
        ):
            return [
                ReportService._dump(
                    item
                )
                for item in value
            ]

        return value

    @staticmethod
    def _add_pdf_dict_section(
        story,
        title: str,
        data: dict | None,
        styles,
    ) -> None:

        from reportlab.platypus import (
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )
        from reportlab.lib import colors

        story.append(
            Paragraph(
                title,
                styles["Heading2"],
            )
        )

        if not data:
            story.append(
                Paragraph(
                    "No data available.",
                    styles["BodyText"],
                )
            )

            story.append(
                Spacer(1, 10)
            )

            return

        rows = [
            ["Field", "Value"]
        ]

        for key, value in data.items():

            rows.append(
                [
                    str(key),
                    ReportService._format_value(
                        value
                    ),
                ]
            )

        table = Table(
            rows,
            colWidths=[180, 300],
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.lightgrey,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                ]
            )
        )

        story.append(table)
        story.append(Spacer(1, 12))

    @staticmethod
    def _write_dict_to_sheet(
        worksheet,
        data: Any,
    ) -> None:

        if data is None:
            worksheet.append(
                ["Status", "No data available"]
            )
            return

        if not isinstance(
            data,
            dict,
        ):
            worksheet.append(
                ["Value", str(data)]
            )
            return

        worksheet.append(
            ["Field", "Value"]
        )

        for key, value in data.items():

            worksheet.append(
                [
                    str(key),
                    ReportService._format_value(
                        value
                    ),
                ]
            )

        worksheet.freeze_panes = "A2"

        worksheet.column_dimensions[
            "A"
        ].width = 35

        worksheet.column_dimensions[
            "B"
        ].width = 70

    @staticmethod
    def _format_value(
        value: Any,
    ) -> str:

        if value is None:
            return "N/A"

        if isinstance(
            value,
            (dict, list),
        ):
            import json

            return json.dumps(
                value,
                indent=2,
                default=str,
            )

        return str(value)