import {
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function SuitabilityScoreCard({
  suitability,
  analysisResult,
}) {
  if (!suitability) return null;

  const percentage = Math.round(
    (suitability.score / suitability.maxScore) * 100
  );

  const scoreColor =
    suitability.level === "High Potential"
      ? "text-green-600"
      : suitability.level === "Moderate Potential"
      ? "text-yellow-600"
      : "text-red-600";

  const progressColor =
    suitability.level === "High Potential"
      ? "from-green-500 to-emerald-600"
      : suitability.level === "Moderate Potential"
      ? "from-yellow-400 to-orange-500"
      : "from-red-500 to-pink-600";

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">

      {/* Header */}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
          <HiOutlineSparkles className="text-4xl text-green-600" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Site Suitability Score
          </h2>

          <p className="text-slate-500">
            AI-based Renewable Energy Evaluation
          </p>
        </div>
      </div>

      {/* Score */}

      <div className="grid lg:grid-cols-2 gap-8">

        <div className="flex flex-col items-center justify-center">

          <div className="w-44 h-44 rounded-full border-[12px] border-blue-500 flex items-center justify-center">

            <div className="text-center">

              <h1 className={`text-5xl font-bold ${scoreColor}`}>
                {percentage}%
              </h1>

              <p className="text-slate-500">
                Overall Score
              </p>

            </div>

          </div>

          <h3 className={`mt-6 text-2xl font-bold ${scoreColor}`}>
            {suitability.level}
          </h3>

        </div>

        {/* Progress */}

        <div className="flex flex-col justify-center">

          <div className="mb-6">

            <div className="flex justify-between mb-2">

              <span className="font-semibold">
                Score
              </span>

              <span className="font-bold">
                {suitability.score} / {suitability.maxScore}
              </span>

            </div>

            <div className="h-5 bg-slate-200 rounded-full overflow-hidden">

              <div
                className={`h-full bg-gradient-to-r ${progressColor}`}
                style={{
                  width: `${percentage}%`,
                }}
              />

            </div>

          </div>

          <div className="space-y-3">

            {suitability.reasons.map((reason, index) => (

              <div
                key={index}
                className="flex items-start gap-3 bg-slate-50 rounded-xl p-4"
              >

                <HiOutlineCheckCircle className="text-green-600 mt-1 text-xl" />

                <span className="text-slate-700">
                  {reason}
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}