import { motion } from "framer-motion";

function PrimaryButton({ text, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="
      bg-gradient-to-r
      from-emerald-600
      to-blue-600
      text-white
      font-semibold
      px-6
      py-3
      rounded-xl
      shadow-lg
      hover:shadow-xl
      transition-all
      duration-300
      "
    >
      {text}
    </motion.button>
  );
}

export default PrimaryButton;