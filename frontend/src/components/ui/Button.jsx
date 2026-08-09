import { motion } from "framer-motion";

function Button({
    children,
    onClick,
    type = "button",
    variant = "primary",
    className = "",
    disabled = false,
    icon = null,
}) {
    const variants = {
        primary:
            "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-lg shadow-blue-900/40 glow-blue",
        secondary:
            "glass text-white hover:bg-white/10",
        success:
            "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/40 glow-emerald",
        danger:
            "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-900/40",
        outline:
            "border border-white/15 text-white bg-transparent hover:border-cyan-400/50 hover:bg-white/5",
        ghost:
            "text-slate-300 hover:text-white hover:bg-white/5",
    };

    const hasShine = variant === "primary" || variant === "success";

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -2 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative
                inline-flex
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-xl
                px-5
                py-3
                text-sm
                font-semibold
                transition-all
                duration-300
                disabled:opacity-50
                disabled:cursor-not-allowed
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-cyan-400/50
                ${hasShine && !disabled ? "shine" : ""}
                ${variants[variant]}
                ${className}
            `}
        >
            {icon}
            {children}
        </motion.button>
    );
}

export default Button;
