import { motion } from "framer-motion";

function GlassCard({
    children,
    className = "",
    hover = true,
    glow = false,
    animate = false,
    delay = 0,
    ...props
}) {
    const Component = animate ? motion.div : "div";

    const motionProps = animate
        ? {
              initial: { opacity: 0, y: 24 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: "-40px" },
              transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
          }
        : {};

    return (
        <Component
            {...motionProps}
            {...props}
            className={`
                relative
                glass
                rounded-3xl
                shadow-xl
                shadow-black/20
                ${hover ? "glass-hover" : ""}
                ${glow ? "border-cyan-400/20" : ""}
                ${className}
            `}
        >
            {children}
        </Component>
    );
}

export default GlassCard;

