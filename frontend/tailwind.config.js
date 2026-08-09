/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1a14",
        canvas: "#f6f8f5",
        panel: "#ffffff",
        line: "#e2e8df",
        moss: {
          50: "#f1faf2",
          100: "#dcf3de",
          200: "#b8e6bd",
          300: "#8ad395",
          400: "#57b869",
          500: "#2f9c48",
          600: "#1f7d38",
          700: "#166534",
          800: "#154f2c",
          900: "#0f3a21",
        },
        clay: "#c9702f",
        sun: "#e0a52c",
        sky: "#3a7ca5",
        rust: "#c04a3d",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,26,20,0.04), 0 1px 12px rgba(15,26,20,0.05)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
    },
  },
  plugins: [],
};
