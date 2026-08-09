function Spinner({ size = 24, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={`animate-spin ${className}`}
            role="status"
            aria-label="Loading"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-cyan-400"
            />
        </svg>
    );
}

export default Spinner;
