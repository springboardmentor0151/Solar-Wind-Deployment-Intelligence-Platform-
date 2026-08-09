import { motion } from "framer-motion";
import { HiArrowRight, HiArrowDown } from "react-icons/hi";
import {
  HiOutlineFolderPlus,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMapPin,
  HiOutlineCloudArrowDown,
  HiOutlineMap,
  HiOutlineCpuChip,
  HiOutlineCalculator,
  HiOutlineSparkles,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";

const steps = [
  { icon: HiOutlineFolderPlus, label: "Create Project" },
  { icon: HiOutlineAdjustmentsHorizontal, label: "Select Solar / Wind" },
  { icon: HiOutlineMapPin, label: "Select Region" },
  { icon: HiOutlineCloudArrowDown, label: "Collect Environmental Data" },
  { icon: HiOutlineMap, label: "Collect Geographic Data" },
  { icon: HiOutlineCpuChip, label: "AI Analysis" },
  { icon: HiOutlineCalculator, label: "Calculate Suitability" },
  { icon: HiOutlineSparkles, label: "Best Site Recommendation" },
  { icon: HiOutlineDocumentChartBar, label: "Dashboard & Report" },
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="relative py-28 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-visible"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-200/30 blur-3xl rounded-full -top-20 -left-20"></div>
        <div className="absolute w-96 h-96 bg-green-200/30 blur-3xl rounded-full bottom-0 right-0"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold uppercase">
            Workflow
          </span>

          <h2 className="mt-6 text-4xl lg:text-5xl font-extrabold text-slate-900">
            AI Powered Renewable Energy
            <span className="block text-blue-600">
              Site Selection Process
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Our intelligent pipeline analyzes environmental and geographical
            datasets to recommend the most suitable locations for renewable
            energy deployment.
          </p>
        </motion.div>

        {/* Desktop */}
        <div className="hidden lg:block mt-24 overflow-x-auto overflow-y-visible pb-8">
          <div className="flex items-center gap-5 min-w-max px-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.03,
                  }}
                  className="group"
                >
                  <div className="relative w-60 h-72 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col items-center justify-center px-6">

                    {/* Step Number */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-lg">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-4xl shadow-lg transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <step.icon />
                    </div>

                    {/* Title */}
                    <h3 className="mt-8 text-center text-xl font-bold text-slate-800 min-h-[64px] flex items-center">
                      {step.label}
                    </h3>
                  </div>
                </motion.div>

                {index !== steps.length - 1 && (
                  <div className="w-14 flex justify-center">
                    <HiArrowRight className="text-3xl text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden mt-16 flex flex-col gap-6">
          {steps.map((step, index) => (
            <div key={index}>
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.08,
                }}
                className="relative bg-white rounded-3xl shadow-xl border border-slate-200 p-6"
              >
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl">
                    <step.icon />
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">
                    {step.label}
                  </h3>
                </div>
              </motion.div>

              {index !== steps.length - 1 && (
                <div className="flex justify-center py-4">
                  <HiArrowDown className="text-3xl text-blue-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}