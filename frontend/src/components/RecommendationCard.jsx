import { motion } from "framer-motion";

function RecommendationCard({ recommendation }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
      bg-green-50
      border-l-4
      border-emerald-600
      rounded-xl
      p-6
      shadow-md
      "
    >
      <h2 className="text-2xl font-bold text-emerald-700 mb-3">
        💡 AI Recommendation
      </h2>

      <p className="text-slate-700 text-lg">
        {recommendation}
      </p>
    </motion.div>
  );
}

export default RecommendationCard;