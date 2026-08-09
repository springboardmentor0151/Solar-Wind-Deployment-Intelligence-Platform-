import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function RecommendationCard({
  analysisResult,
  suitability,
}) {
  const solar = analysisResult?.solarPrediction;
  const wind = analysisResult?.windPrediction;
  const env = analysisResult?.environmentalData;

  const recommendations = [];

  if (solar?.solarPotential === "High") {
    recommendations.push(
      "Excellent solar irradiance detected. Large-scale solar installation is recommended."
    );
  } else {
    recommendations.push(
      "Moderate solar potential. Consider hybrid renewable deployment."
    );
  }

  if ((env?.windSpeed ?? 0) >= 6) {
    recommendations.push(
      "Wind conditions are suitable for medium or utility-scale turbines."
    );
  }

  if ((env?.temperature ?? 0) > 35) {
    recommendations.push(
      "High ambient temperature may slightly reduce solar panel efficiency."
    );
  }

  if ((analysisResult?.terrainData?.elevation ?? 0) > 500) {
    recommendations.push(
      "High elevation location offers better airflow and cooling conditions."
    );
  }

  const overall =
    suitability?.level === "High Potential"
      ? "Highly Recommended"
      : suitability?.level === "Moderate Potential"
      ? "Conditionally Recommended"
      : "Not Recommended";

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all">

      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
          <HiOutlineSparkles className="text-3xl text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            AI Recommendation
          </h2>

          <p className="text-slate-500">
            Renewable Energy Assessment
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl p-5 mb-6 ${
          suitability?.level === "High Potential"
            ? "bg-green-50 border border-green-200"
            : suitability?.level === "Moderate Potential"
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <h3 className="text-xl font-bold text-slate-900">
          {overall}
        </h3>

        <p className="text-slate-600 mt-2">
          Overall Suitability Score:
          <span className="font-bold ml-2">
            {suitability?.score}/{suitability?.maxScore}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50"
          >
            <HiOutlineCheckCircle className="text-green-600 text-2xl mt-1" />

            <p className="text-slate-700">
              {item}
            </p>
          </div>
        ))}
      </div>

      {suitability?.level !== "High Potential" && (
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 flex gap-3">
          <HiOutlineExclamationTriangle className="text-amber-600 text-2xl mt-1" />

          <p className="text-amber-800">
            Additional environmental and financial feasibility
            studies are recommended before deployment.
          </p>
        </div>
      )}
    </div>
  );
}