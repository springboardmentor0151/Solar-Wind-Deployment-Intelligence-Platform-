import { motion } from "framer-motion";

function Card({
    children,
    className = "",
    hover = true,
    initial,
    animate,
    transition,
}) {
    let motionProps = {};

    if (initial && animate) {
        motionProps = { initial, animate, transition };
    }

    return (
        <motion.div
            {...motionProps}
            whileHover={
                hover
                    ? {
                          y: -5,
                          scale: 1.008,
                      }
                    : undefined
            }
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`
                rounded-3xl
                border
                border-white/10
                bg-white/[0.03]
                backdrop-blur-xl
                shadow-xl
                shadow-black/20
                p-6
                transition-all
                duration-300
                hover:border-cyan-400/30
                hover:shadow-cyan-500/10
                ${hover ? "hover:-translate-y-1" : ""}
                ${className}
            `}
        >
            {children}
        </motion.div>
    );
}

export default Card;
