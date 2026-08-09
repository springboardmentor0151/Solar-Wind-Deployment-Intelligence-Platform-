import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

function AnimatedCounter({
    value,
    duration = 1.6,
    decimals = 0,
    prefix = "",
    suffix = "",
    className = "",
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, {
        duration: duration * 1000,
        bounce: 0,
    });

    useEffect(() => {
        if (inView) {
            motionValue.set(value);
        }
    }, [inView, value, motionValue]);

const [display, setDisplay] = useState("0");

    useEffect(() => {
        const unsubscribe = spring.on("change", (latest) => {
            setDisplay(
                latest.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                })
            );
        });
        return () => unsubscribe();
    }, [spring, decimals]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            {display}
            {suffix}
        </span>
    );
}

export default AnimatedCounter;

