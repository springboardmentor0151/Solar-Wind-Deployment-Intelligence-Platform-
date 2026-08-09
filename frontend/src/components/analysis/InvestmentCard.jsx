import {
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineBanknotes,
  HiOutlineClock,
} from "react-icons/hi2";

export default function InvestmentCard({
  analysisResult,
  suitability,
  windPrediction,
}) {
  const solar = analysisResult?.solarPrediction;
  const wind = windPrediction;

  // Energy values
  const dailyEnergy =
    solar?.dailyEnergyOutput ??
    wind?.dailyEnergy ??
    200;

  const annualEnergy =
    solar?.annualEnergyOutput ??
    wind?.annualEnergy ??
    100000;

  // Estimated Cost (Prototype Formula)
  const estimatedCost = `₹ ${(
    (dailyEnergy * 2500) /
    10000000
  ).toFixed(2)} Cr`;

  // Annual Revenue (₹6 per unit)
  const annualRevenue = `₹ ${(
    (annualEnergy * 6) /
    10000000
  ).toFixed(2)} Cr`;

  // ROI
  const roi =
    solar?.performanceRatio != null
      ? Number(solar.performanceRatio).toFixed(1)
      : wind?.capacityFactor != null
      ? Number(wind.capacityFactor).toFixed(1)
      : null;

  // Payback Period
  const payback =
    roi !== null
      ? `${Math.max(2, (8 - Number(roi) / 20)).toFixed(1)} Years`
      : "--";

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Investment Analysis
        </h2>

        <p className="text-slate-500 mt-1">
          Financial overview of the proposed renewable energy project
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Estimated Cost */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
            <HiOutlineCurrencyDollar className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Estimated Cost
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {estimatedCost}
          </p>
        </div>

        {/* Annual Revenue */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
            <HiOutlineBanknotes className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Annual Revenue
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {annualRevenue}
          </p>
        </div>

        {/* ROI */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
            <HiOutlineChartBar className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            ROI
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {roi ? `${roi}%` : "--"}
          </p>
        </div>

        {/* Payback */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
            <HiOutlineClock className="text-2xl" />
          </div>

          <h3 className="mt-4 text-slate-500 text-sm">
            Payback Period
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {payback}
          </p>
        </div>

      </div>

      {/* Profitability */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">

        <h3 className="text-xl font-bold">
          Profitability
        </h3>

        <p className="mt-2 opacity-90">
          {suitability?.level === "High Potential"
            ? "Excellent investment opportunity with strong long-term returns."
            : suitability?.level === "Moderate Potential"
            ? "Moderate investment opportunity. Additional feasibility study recommended."
            : "Investment risk is high. Consider evaluating alternative locations."}
        </p>

      </div>

    </div>
  );
}