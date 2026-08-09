import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function LoadingOverlay({ progress, percent }) {
  const steps = [
    "Saving Site...",
    "Collecting Environmental Data...",
    "Calculating Suitability...",
    "Generating Report...",
    "Completed",
  ];

  const currentStep = steps.indexOf(progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="w-[520px] bg-white rounded-3xl shadow-2xl p-8">

        {/* Spinner */}

        <div className="flex justify-center">
          <HiOutlineArrowPath
            className="animate-spin text-blue-600"
            size={60}
          />
        </div>

        {/* Title */}

        <h2 className="mt-6 text-3xl font-bold text-center text-slate-900">
          Running AI Analysis
        </h2>

        <p className="mt-2 text-center text-slate-500">
          Please wait while the system analyzes the selected location.
        </p>

        {/* Progress */}

        <div className="mt-8">

          <div className="flex justify-between mb-2">

            <span className="font-medium text-slate-700">
              {progress}
            </span>

            <span className="font-bold text-blue-600">
              {percent}%
            </span>

          </div>

          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">

            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-700 ease-in-out"
              style={{
                width: `${percent}%`,
              }}
            />

          </div>

        </div>

        {/* Steps */}

        <div className="mt-8 space-y-4">

          {steps.map((step, index) => {

            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                  active
                    ? "bg-blue-50 border border-blue-200"
                    : ""
                }`}
              >

                {completed ? (
                  <HiOutlineCheckCircle
                    className="text-green-600"
                    size={24}
                  />
                ) : active ? (
                  <HiOutlineArrowPath
                    className="animate-spin text-blue-600"
                    size={24}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                )}

                <span
                  className={`${
                    completed
                      ? "text-green-700 font-semibold"
                      : active
                      ? "text-blue-700 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  {step}
                </span>

              </div>
            );
          })}

        </div>

        {/* Footer */}

        <div className="mt-8 text-center">

          <p className="text-sm text-slate-500">
            This may take a few seconds depending on the selected location.
          </p>

        </div>

      </div>

    </div>
  );
}