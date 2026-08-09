import { motion } from "framer-motion";
import useTilt from "../../hooks/useTilt";

/**
 * TiltCard — a reusable 3D-tilting glass card.
 * - Follows the cursor with spring-driven rotateX / rotateY.
 * - Renders a cursor-tracking glare highlight.
 * - Supports floating "depth" layers that translate on the Z axis.
 *
 * Props:
 *   tilt (number)      max tilt degrees (default 10)
 *   glare (bool)       show cursor-tracking glare overlay
 *   className (string) extra classes
 *   depth (node)       optional 3D layer rendered with translateZ
 *   hoverScale (number) extra scale on hover
 */
export default function TiltCard({
    children,
    className = "",
    tilt = 10,
    glare = true,
    depth = null,
    hoverScale = 1.02,
    ...props
}) {
    const { ref, rotateX, rotateY, glareX, glareY, onMouseMove, onMouseLeave } =
        useTilt(tilt);

    return (
        <motion.div
            ref={ref}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            whileHover={{ scale: hoverScale }}
            transition={{ type: "spring", stiffness: 250, damping: 22 }}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 900,
                transformStyle: "preserve-3d",
            }}
            className={`group relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}
            {...props}
        >
            {/* Content */}
            <div className="relative z-30">{children}</div>

            {/* Floating depth layer (translates toward viewer) */}
            {depth && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
                    style={{ transform: "translateZ(40px)" }}
                >
                    {depth}
                </div>
            )}

            {/* Cursor-tracking glare */}
            {glare && (
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(420px circle at ${glareX} ${glareY}, rgba(255,255,255,0.14), transparent 45%)`,
                    }}
                />
            )}
        </motion.div>
    );
}
