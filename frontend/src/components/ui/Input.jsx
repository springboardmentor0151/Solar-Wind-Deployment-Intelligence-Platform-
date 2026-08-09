import { forwardRef } from "react";

const Input = forwardRef(
    (
        {
            label,
            error,
            className = "",
            icon,
            ...props
        },
        ref
    ) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        {...props}
                        className={`
                            w-full
                            rounded-xl
                            border
                            border-white/10
                            bg-white/[0.04]
                            px-4
                            py-3
                            text-white
                            placeholder:text-slate-500
                            outline-none
                            transition-all
                            duration-300
                            focus:border-cyan-400/60
                            focus:bg-white/[0.06]
                            focus:ring-2
                            focus:ring-cyan-400/20
                            hover:border-white/20
                            ${icon ? "pl-11" : ""}
                            ${className}
                        `}
                    />
                </div>

                {error && (
                    <p className="mt-2 text-sm text-red-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
