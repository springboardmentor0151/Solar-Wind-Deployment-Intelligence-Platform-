import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { WiDaySunny } from "react-icons/wi";
import { GiWindTurbine } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";
import { BsGraphUpArrow } from "react-icons/bs";

import HeroIllustration from "./illustrations/HeroIllustration.jsx";
import FloatingCard from "./FloatingCard.jsx";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-24 pb-16 lg:pt-24 lg:pb-20"
    >
      {/* Background Blobs */}
      <div className="absolute -top-24 -left-32 h-96 w-96 rounded-full bg-blue/20 blur-3xl animate-blob" />
      <div
        className="absolute top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-green/20 blur-3xl animate-blob"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-navy/10 blur-3xl animate-blob"
        style={{ animationDelay: "6s" }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-extrabold leading-[1.1] text-navy sm:text-5xl lg:text-6xl">
            AI-Powered Renewable Energy{" "}
            <span className="text-gradient">Site Intelligence</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy/60">
            Analyze environmental, geographic, climatic and infrastructure data
            to discover the most suitable locations for Solar and Wind Farms
            using Artificial Intelligence.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white transition hover:scale-105"
            >
              Get Started
              <HiArrowRight />
            </Link>

            <Link
              to="/login"
              className="rounded-full border border-slate-300 px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
          </div>

          {/* Statistics */}
          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-2xl font-extrabold text-navy">1000+</p>
              <p className="text-sm text-navy/50">Regions analyzed</p>
            </div>

            <div className="h-10 w-px bg-navy/10" />

            <div>
              <p className="text-2xl font-extrabold text-navy">98%</p>
              <p className="text-sm text-navy/50">Prediction Accuracy</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <HeroIllustration />

          <FloatingCard
            icon={WiDaySunny}
            label="Solar Score"
            value="92 / 100"
            accent="green"
            delay={0.4}
            className="absolute -top-2 left-0 lg:-left-8 animate-float"
          />

          <FloatingCard
            icon={GiWindTurbine}
            label="Wind Score"
            value="87 / 100"
            accent="blue"
            delay={0.55}
            className="absolute top-1/3 -right-2 lg:-right-10 animate-floatSlow"
          />

          <FloatingCard
            icon={TbTargetArrow}
            label="Suitability"
            value="High"
            accent="green"
            delay={0.7}
            className="absolute bottom-14 -left-4 lg:-left-12 animate-float"
          />

          <FloatingCard
            icon={BsGraphUpArrow}
            label="Energy Prediction"
            value="4.6 GWh/yr"
            accent="navy"
            delay={0.85}
            className="absolute -bottom-4 right-4 lg:right-0 animate-floatSlow"
          />
        </motion.div>
      </div>
    </section>
  );
}