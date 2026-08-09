import SuitabilityScoreCard from "./SuitabilityScoreCard";
import RecommendationCard from "./RecommendationCard";
import InvestmentCard from "./InvestmentCard";
import DeploymentCard from "./DeploymentCard";
import ForecastCard from "./ForecastCard";
import AIInsights from "./AIInsights";

export default function AnalysisDashboard({
  analysisResult,
  suitability,
}) {
  if (!analysisResult || !suitability) return null;

  // Generate wind prediction if it doesn't already exist
  const windPrediction =
    analysisResult.windPrediction || {
      windSpeed: analysisResult.environmentalData?.windSpeed ?? 0,
      windPowerDensity:
        0.5 *
        1.225 *
        Math.pow(analysisResult.environmentalData?.windSpeed ?? 0, 3),
      dailyEnergy:
        ((0.5 *
          1.225 *
          Math.pow(analysisResult.environmentalData?.windSpeed ?? 0, 3) *
          10 *
          0.4) *
          24) /
        1000,
      annualEnergy:
        ((((0.5 *
          1.225 *
          Math.pow(analysisResult.environmentalData?.windSpeed ?? 0, 3) *
          10 *
          0.4) *
          24) /
          1000) *
          365),
      capacityFactor:
        (((0.5 *
          1.225 *
          Math.pow(analysisResult.environmentalData?.windSpeed ?? 0, 3) *
          10 *
          0.4) *
          24) /
          1000 /
          24) *
        100,
      turbineEfficiency: 35,
      recommendedTurbine:
        (analysisResult.environmentalData?.windSpeed ?? 0) > 8
          ? "Utility Scale Turbine"
          : (analysisResult.environmentalData?.windSpeed ?? 0) > 6
          ? "Medium Wind Turbine"
          : (analysisResult.environmentalData?.windSpeed ?? 0) >= 4
          ? "Small Wind Turbine"
          : "Not Recommended",
    };

  return (
    <section className="mt-12 space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold text-slate-900">
          AI Analysis Dashboard
        </h2>

        <p className="mt-2 text-slate-600">
          AI-powered renewable energy insights, investment analysis,
          deployment recommendations, and energy forecasting.
        </p>
      </div>

      {/* Suitability */}
      <SuitabilityScoreCard
        suitability={suitability}
        analysisResult={analysisResult}
      />

      {/* Recommendation + Investment */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <RecommendationCard
          suitability={suitability}
          analysisResult={analysisResult}
        />

        <InvestmentCard
          suitability={suitability}
          analysisResult={analysisResult}
          windPrediction={windPrediction}
        />

      </div>

      {/* Deployment + Forecast */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <DeploymentCard
          suitability={suitability}
          analysisResult={analysisResult}
        />

        <ForecastCard
          analysisResult={analysisResult}
          windPrediction={windPrediction}
        />

      </div>

      {/* AI Insights */}
      <AIInsights
        suitability={suitability}
        analysisResult={analysisResult}
      />

    </section>
  );
}