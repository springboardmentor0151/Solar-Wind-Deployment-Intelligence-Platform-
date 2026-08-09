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
  {
    icon: HiOutlineFolderPlus,
    label: "Create Project",
  },
  {
    icon: HiOutlineAdjustmentsHorizontal,
    label: "Select Solar / Wind",
  },
  {
    icon: HiOutlineMapPin,
    label: "Select Region",
  },
  {
    icon: HiOutlineCloudArrowDown,
    label: "Collect Environmental Data",
  },
  {
    icon: HiOutlineMap,
    label: "Collect Geographic Data",
  },
  {
    icon: HiOutlineCpuChip,
    label: "AI Analysis",
  },
  {
    icon: HiOutlineCalculator,
    label: "Calculate Suitability",
  },
  {
    icon: HiOutlineSparkles,
    label: "Best Site Recommendation",
  },
  {
    icon: HiOutlineDocumentChartBar,
    label: "Dashboard & Report",
  },
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden py-28 bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-200/30 blur-3xl rounded-full -top-20 -left-20 animate-pulse"></div>

        <div className="absolute w-96 h-96 bg-green-200/30 blur-3xl rounded-full bottom-0 right-0 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wider uppercase">
            Workflow
          </span>

          <h2 className="mt-6 text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            AI Powered Renewable Energy
            <span className="block text-blue-600">
              Site Selection Process
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Our intelligent pipeline analyzes environmental and geographical
            datasets to recommend the most suitable locations for renewable
            energy deployment.
          </p>
        </motion.div>

        {/* Desktop */}

        <div className="hidden lg:block mt-24 overflow-x-auto pb-8">

          <div className="flex items-center min-w-max">

            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center">

                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * .08,
                    duration: .6,
                  }}
                  whileHover={{
                    y: -10,
                    scale: 1.05,
                  }}
                  className="group w-56"
                >

                  <div className="relative backdrop-blur-xl bg-white/70 border border-white rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-blue-200/70 hover:border-blue-300">

                    {/* Number */}

                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">

                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-lg">
                        {index + 1}
                      </div>

                    </div>

                    {/* Icon */}

                    <div className="mx-auto mt-5 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-4xl shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                      <step.icon />
                    </div>

                    <h3 className="mt-6 text-center text-slate-800 font-bold text-lg leading-snug">
                      {step.label}
                    </h3>

                  </div>

                </motion.div>

                {index !== steps.length - 1 && (

                  <div className="w-24 flex justify-center">

                    <HiArrowRight className="text-4xl text-blue-400 animate-pulse" />

                  </div>

                )}

              </div>
            ))}

          </div>

        </div>

        {/* Mobile */}

        <div className="lg:hidden mt-16 flex flex-col items-center">

          {steps.map((step, index) => (

            <div key={step.label} className="w-full max-w-md">

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * .06,
                  duration: .5,
                }}
                whileHover={{
                  scale: 1.03,
                }}
                className="relative bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-3xl p-6"
              >

                <div className="absolute -left-3 top-6">

                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div>

                </div>

                <div className="flex items-center gap-5 ml-4">

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-3xl shadow-lg">

                    <step.icon />

                  </div>

                  <h3 className="text-lg font-bold text-slate-800">
                    {step.label}
                  </h3>

                </div>

              </motion.div>

              {index !== steps.length - 1 && (

                <div className="flex justify-center py-4">

                  <HiArrowDown className="text-3xl text-blue-400 animate-bounce" />

                </div>

              )}

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}