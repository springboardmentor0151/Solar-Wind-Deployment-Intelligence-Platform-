import {
  HiOutlineLightBulb,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function AIInsights({
  analysisResult,
  suitability,
}) {
  if (!analysisResult || !suitability) return null;

  const env = analysisResult.environmentalData || {};
  const terrain = analysisResult.terrainData || {};
  const gis = analysisResult.gisData || {};
  const solar = analysisResult.solarPrediction || {};
  const wind = analysisResult.windPrediction || {};

  const insights = [];

  // Solar
  if (solar.solarPotential === "High") {
    insights.push(
      "High solar irradiance indicates excellent photovoltaic power generation potential."
    );
  } else {
    insights.push(
      "Solar resource is moderate. Hybrid deployment is recommended."
    );
  }

  // Wind
  if ((env.windSpeed || 0) >= 6) {
    insights.push(
      "Wind conditions support medium or utility-scale wind turbines."
    );
  } else {
    insights.push(
      "Wind speeds are moderate; smaller turbines are more suitable."
    );
  }

  // Terrain
  if ((terrain.elevation || 0) > 500) {
    insights.push(
      "Higher elevation improves airflow and renewable energy efficiency."
    );
  }

  // Infrastructure
  if ((gis.powerInfrastructureCount || 0) > 0) {
    insights.push(
      "Existing electrical infrastructure can reduce deployment cost."
    );
  } else {
    insights.push(
      "Additional transmission infrastructure may be required."
    );
  }

  // Suitability
  insights.push(
    `Overall AI assessment: ${suitability.level}.`
  );

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">

      {/* Header */}

      <div className="flex items-center gap-4 mb-8">

        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
          <HiOutlineSparkles className="text-4xl text-blue-600" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            AI Insights
          </h2>

          <p className="text-slate-500">
            Intelligent recommendations generated from site analysis
          </p>
        </div>

      </div>

      {/* Summary */}

      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 mb-8">

        <h3 className="text-2xl font-bold">
          AI Summary
        </h3>

        <p className="mt-3 leading-7 opacity-90">
          This location has been evaluated using environmental,
          terrain, GIS and renewable resource datasets. The AI
          assessment indicates
          <strong> {suitability.level}</strong> with an overall score
          of <strong>{suitability.score}</strong> out of{" "}
          <strong>{suitability.maxScore}</strong>.
        </p>

      </div>

      {/* Insights */}

      <div className="space-y-4">

        {insights.map((item, index) => (

          <div
            key={index}
            className="flex items-start gap-4 rounded-2xl bg-slate-50 p-5"
          >

            <HiOutlineLightBulb className="text-yellow-500 text-2xl mt-1" />

            <p className="text-slate-700">
              {item}
            </p>

          </div>

        ))}

      </div>

      {/* Final Recommendation */}

      <div
        className={`mt-8 rounded-2xl p-6 ${
          suitability.level === "High Potential"
            ? "bg-green-50 border border-green-200"
            : suitability.level === "Moderate Potential"
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}
      >

        <div className="flex items-start gap-3">

          {suitability.level === "High Potential" ? (
            <HiOutlineCheckCircle className="text-green-600 text-3xl mt-1" />
          ) : (
            <HiOutlineExclamationTriangle className="text-amber-600 text-3xl mt-1" />
          )}

          <div>

            <h3 className="text-xl font-bold">
              Final Recommendation
            </h3>

            <p className="mt-2 text-slate-700 leading-7">
              {suitability.level === "High Potential"
                ? "The site is highly recommended for renewable energy deployment. Proceed with detailed engineering and financial planning."
                : suitability.level === "Moderate Potential"
                ? "The site is suitable, but additional feasibility and economic studies are recommended before deployment."
                : "The current site has limited renewable energy potential. Consider evaluating alternative nearby locations."}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}