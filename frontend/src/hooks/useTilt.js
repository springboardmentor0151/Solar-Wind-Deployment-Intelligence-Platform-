import { useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * useTilt — tracks the mouse position over an element and exposes
 * smooth spring-driven rotateX / rotateY motion values for 3D tilt.
 *
 * Usage:
 *   const { ref, rotateX, rotateY, glareX, glareY, reset } = useTilt(12);
 *   <motion.div ref={ref} style={{ rotateX, rotateY, transformPerspective: 900 }} ...>
 */
export default function useTilt(maxTilt = 10) {
    const ref = useRef(null);

    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);

    const rotateX = useSpring(useTransform(my, [0, 1], [maxTilt, -maxTilt]), {
        stiffness: 200,
        damping: 20,
        mass: 0.5,
    });
    const rotateY = useSpring(useTransform(mx, [0, 1], [-maxTilt, maxTilt]), {
        stiffness: 200,
        damping: 20,
        mass: 0.5,
    });

    // Glare / highlight position (percentages)
    const glareX = useTransform(mx, [0, 1], ["0%", "100%"]);
    const glareY = useTransform(my, [0, 1], ["0%", "100%"]);

    const onMouseMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width);
        my.set((e.clientY - rect.top) / rect.height);
    };

    const onMouseLeave = () => {
        mx.set(0.5);
        my.set(0.5);
    };

    return { ref, rotateX, rotateY, glareX, glareY, onMouseMove, onMouseLeave };
}
