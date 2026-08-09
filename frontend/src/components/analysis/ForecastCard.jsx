import {
  HiOutlineSun,
  HiOutlineBolt,
  HiOutlineArrowTrendingUp,
  HiOutlineCloud,
} from "react-icons/hi2";

export default function ForecastCard({
  analysisResult,
  windPrediction,
}) {
  const solar = analysisResult?.solarPrediction;
  const wind = windPrediction;
  const env = analysisResult?.environmentalData;

  // Dynamic Values
  const solarOutput =
    solar?.dailyEnergyOutput != null
      ? `${Number(solar.dailyEnergyOutput).toFixed(1)} kWh`
      : "--";

  const windOutput =
    wind?.dailyEnergy != null
      ? `${Number(wind.dailyEnergy).toFixed(1)} kWh`
      : "--";

  const hybridOutput =
    solar?.dailyEnergyOutput != null || wind?.dailyEnergy != null
      ? `${(
          (Number(solar?.dailyEnergyOutput) || 0) +
          (Number(wind?.dailyEnergy) || 0)
        ).toFixed(1)} kWh`
      : "--";

  // Weather Prediction
  let weather = "Moderate";

  if ((env?.temperature ?? 0) >= 30) {
    weather = "Sunny";
  } else if ((env?.temperature ?? 0) >= 20) {
    weather = "Partly Cloudy";
  } else {
    weather = "Cloudy";
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Energy Forecast
        </h2>

        <p className="text-slate-500 mt-1">
          AI Predicted Daily Energy Generation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Solar Output */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
            <HiOutlineSun className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Solar Output
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {solarOutput}
          </p>
        </div>

        {/* Wind Output */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
            <HiOutlineBolt className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Wind Output
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {windOutput}
          </p>
        </div>

        {/* Hybrid Output */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
            <HiOutlineArrowTrendingUp className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Hybrid Total
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {hybridOutput}
          </p>
        </div>

        {/* Weather */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-100 text-sky-600">
            <HiOutlineCloud className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Weather
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {weather}
          </p>
        </div>

      </div>

      {/* Forecast Summary */}

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">

        <h3 className="text-xl font-bold">
          Forecast Summary
        </h3>

        <p className="mt-2 opacity-90 leading-relaxed">
          {solar?.solarPotential === "High"
            ? "High solar generation is expected due to excellent solar irradiance. Wind conditions also support renewable energy generation, resulting in high hybrid output."
            : wind?.recommendedTurbine !== "Not Recommended"
            ? "Wind conditions are suitable for energy production and can effectively supplement solar generation."
            : "Moderate renewable energy production is expected based on current environmental conditions."}
        </p>

      </div>

    </div>
  );
}