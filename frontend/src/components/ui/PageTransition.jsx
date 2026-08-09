import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

/**
 * PageTransition — wraps page content with a premium 3D "flip-down" entry
 * animation and a subtle exit, giving smooth feeling between routes.
 */
export default function PageTransition({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24, rotateX: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, rotateX: -6, scale: 0.99 }}
            transition={{ duration: 0.55, ease }}
            style={{ transformPerspective: 1200 }}
        >
            {children}
        </motion.div>
    );
}
