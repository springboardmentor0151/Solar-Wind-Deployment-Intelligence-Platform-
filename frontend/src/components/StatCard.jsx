import { motion } from "framer-motion";

function StatCard({ icon, title, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className="
      bg-white
      rounded-2xl
      shadow-md
      p-6
      border
      border-gray-200"
    >
      <div className="text-4xl mb-3">
        {icon}
      </div>

      <h3 className="text-gray-500">
        {title}
      </h3>

      <h2 className="text-3xl font-bold text-green-700">
        {value}
      </h2>
    </motion.div>
  );
}

export default StatCard;