import { motion } from "framer-motion";

function PageHeader({ title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-4xl font-bold text-slate-800">
        {title}
      </h1>

      <p className="text-slate-500 mt-2 text-lg">
        {subtitle}
      </p>
    </motion.div>
  );
}

export default PageHeader;