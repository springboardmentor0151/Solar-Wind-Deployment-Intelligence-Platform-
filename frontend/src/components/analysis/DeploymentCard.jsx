import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineMap,
  HiOutlineWrenchScrewdriver,
  HiOutlineBolt,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

export default function DeploymentCard({
  analysisResult,
  suitability,
}) {
  const terrain = analysisResult?.terrainData;
  const gis = analysisResult?.gisData;
  const env = analysisResult?.environmentalData;

  const deploymentSteps = [
    {
      title: "Site Survey",
      status: "Completed",
      icon: HiOutlineMap,
    },
    {
      title: "Feasibility Analysis",
      status:
        suitability?.level === "High Potential"
          ? "Completed"
          : "Review Required",
      icon: HiOutlineClipboardDocumentCheck,
    },
    {
      title: "Infrastructure Planning",
      status:
        (gis?.roadCount ?? 0) > 0
          ? "Ready"
          : "Limited Access",
      icon: HiOutlineWrenchScrewdriver,
    },
    {
      title: "Grid Connection",
      status:
        (gis?.powerInfrastructureCount ?? 0) > 0
          ? "Available"
          : "Needs Planning",
      icon: HiOutlineBolt,
    },
    {
      title: "Deployment Approval",
      status:
        suitability?.level === "High Potential"
          ? "Approved"
          : "Pending",
      icon: HiOutlineCheckBadge,
    },
  ];

  const progress =
    suitability?.level === "High Potential"
      ? 95
      : suitability?.level === "Moderate Potential"
      ? 75
      : 45;

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Deployment Plan
        </h2>

        <p className="text-slate-500 mt-1">
          AI-generated deployment workflow
        </p>
      </div>

      <div className="space-y-5">
        {deploymentSteps.map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-between border rounded-2xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <step.icon className="text-2xl text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-500">
                  {step.status}
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                step.status === "Completed" ||
                step.status === "Approved" ||
                step.status === "Ready" ||
                step.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : step.status === "Review Required" ||
                    step.status === "Pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {step.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">
            Deployment Readiness
          </span>

          <span className="font-bold">
            {progress}%
          </span>
        </div>

        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-5">
        <h3 className="font-bold text-green-700">
          Deployment Summary
        </h3>

        <p className="mt-2 text-green-800">
          Terrain elevation:
          <strong> {terrain?.elevation ?? "--"} m</strong>

          <br />

          Wind Speed:
          <strong> {env?.windSpeed ?? "--"} m/s</strong>

          <br />

          Nearby Roads:
          <strong> {gis?.roadCount ?? 0}</strong>

          <br />

          Power Infrastructure:
          <strong> {gis?.powerInfrastructureCount ?? 0}</strong>
        </p>
      </div>
    </div>
  );
}