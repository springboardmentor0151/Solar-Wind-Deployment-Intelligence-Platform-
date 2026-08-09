import { motion } from "framer-motion";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCloudArrowDown,
  HiOutlineMap,
  HiOutlineSquares2X2,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";

import { WiDaySunny } from "react-icons/wi";
import { GiWindTurbine } from "react-icons/gi";
import { TbBrain } from "react-icons/tb";

const features = [
  {
    icon: HiOutlineClipboardDocumentList,
    title: "Project Management",
    desc: "Create, track, and organize renewable siting projects from one workspace.",
  },
  {
    icon: HiOutlineCloudArrowDown,
    title: "Environmental Data",
    desc: "Collect weather, climate, and environmental information automatically.",
  },
  {
    icon: HiOutlineMap,
    title: "GIS Analysis",
    desc: "Analyze elevation, land-use, and terrain using GIS technologies.",
  },
  {
    icon: WiDaySunny,
    title: "Solar Prediction",
    desc: "Estimate solar irradiance and future energy generation.",
  },
  {
    icon: GiWindTurbine,
    title: "Wind Prediction",
    desc: "Forecast wind energy potential using AI-powered models.",
  },
  {
    icon: TbBrain,
    title: "AI Suitability",
    desc: "Rank locations based on environmental and infrastructure factors.",
  },
  {
    icon: HiOutlineSquares2X2,
    title: "Interactive Dashboard",
    desc: "View analytics, maps, charts, and recommendations.",
  },
  {
    icon: HiOutlineDocumentChartBar,
    title: "Reports",
    desc: "Generate PDF reports for investment and deployment planning.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
            Platform Features
          </span>

          <h2 className="mt-6 text-4xl font-bold text-black">
            Everything a Renewable Energy Team Needs
          </h2>

          <p className="mt-5 text-lg text-gray-600">
            From environmental data collection to AI-powered site
            recommendations — everything in one intelligent platform.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-7 mt-16">
          {features.map((feature) => (
            <motion.div
              whileHover={{ y: -10 }}
              key={feature.title}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500 flex items-center justify-center text-white text-3xl">
                <feature.icon />
              </div>

              <h3 className="mt-6 text-xl font-bold text-black">
                {feature.title}
              </h3>

              <p className="mt-3 text-gray-600 leading-7">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}