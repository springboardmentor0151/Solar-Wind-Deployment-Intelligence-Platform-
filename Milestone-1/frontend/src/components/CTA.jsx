import { motion } from 'framer-motion'
import { HiArrowRight, HiOutlineDocumentText } from 'react-icons/hi2'

export default function CTA() {
  return (
    <section
      id="contact"
      className="relative py-20 lg:py-28 px-6 lg:px-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl
        bg-gradient-to-r from-white via-slate-50 to-green-50
        shadow-2xl border border-slate-200
        px-8 py-16 lg:py-20 text-center"
      >
        {/* Background Glow */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-green-300/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight max-w-3xl mx-auto">
            Ready to Build the Future of Renewable Energy?
          </h2>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Start your renewable energy project today and let AI analyze
            environmental, geographic, and climatic data to recommend the
            best Solar and Wind deployment locations.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <a
              href="#home"
              className="group inline-flex items-center gap-2 rounded-full
              bg-gradient-to-r from-blue-600 to-green-500
              px-8 py-4 font-semibold text-white
              shadow-lg transition-all duration-300
              hover:scale-105 hover:shadow-xl"
            >
              Start Your Project
              <HiArrowRight className="transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full
              border border-slate-300
              bg-white
              px-8 py-4
              font-semibold
              text-slate-800
              transition-all duration-300
              hover:bg-slate-100"
            >
              <HiOutlineDocumentText />
              View Documentation
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}