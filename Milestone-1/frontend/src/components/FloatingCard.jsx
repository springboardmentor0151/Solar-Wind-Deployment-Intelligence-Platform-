import { motion } from 'framer-motion'

export default function FloatingCard({ icon: Icon, label, value, accent = 'green', className = '', delay = 0 }) {
  const accentClasses = {
    green: 'text-green bg-green/10',
    blue: 'text-blue bg-blue/10',
    navy: 'text-navy bg-navy/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className={`glass rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 ${className}`}
    >
      <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg ${accentClasses[accent]}`}>
        <Icon />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-wide text-navy/50 font-semibold">{label}</p>
        <p className="text-base font-bold text-navy">{value}</p>
      </div>
    </motion.div>
  )
}
