import { motion } from "framer-motion";
import { WiDaySunny } from "react-icons/wi";
import { GiWindsock } from "react-icons/gi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { TbRobot } from "react-icons/tb";

const cards = [
  {
    icon: WiDaySunny,
    title: "Solar Intelligence",
    desc: "Models irradiance, panel yield, and seasonal sun exposure to score solar viability for any site.",
  },
  {
    icon: GiWindsock,
    title: "Wind Intelligence",
    desc: "Evaluates wind speed patterns, turbulence, and terrain roughness to estimate turbine output.",
  },
  {
    icon: HiOutlineGlobeAlt,
    title: "GIS Analytics",
    desc: "Layers satellite imagery, elevation, and land-use data for precise geographic assessment.",
  },
  {
    icon: TbRobot,
    title: "AI Recommendations",
    desc: "Combines environmental, geographic, and infrastructure intelligence to recommend the best renewable energy deployment locations.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="relative py-15 lg:py-18 bg-gradient-to-b from-white via-slate-50 to-green-50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-green-700 bg-green-100 px-5 py-2 rounded-full shadow-sm">
            About the Platform
          </span>

          <h2 className="mt-6 text-4xl md:text-5xl font-extrabold text-black leading-tight">
            One Intelligent Platform for
            <span className="block text-blue-600">
              Renewable Energy Site Selection
            </span>
          </h2>

          <p className="mt-6 text-lg text-black leading-8">
            Solar & Wind Deployment Intelligence Platform is an AI-powered
            decision-support system that combines environmental,
            geographical, climatic, and infrastructure data to identify,
            evaluate, and recommend the most suitable locations for renewable
            energy projects.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
              }}
              whileHover={{
                y: -10,
                scale: 1.03,
              }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-green-500 text-white text-4xl mb-6 shadow-md">
                <card.icon />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-black mb-3">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-black leading-7 text-[15px]">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}