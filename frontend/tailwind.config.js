export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ocean: { 50: "#ecfeff", 500: "#06b6d4", 700: "#0e7490" },
        canopy: { 50: "#ecfdf5", 500: "#10b981", 700: "#047857" }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
