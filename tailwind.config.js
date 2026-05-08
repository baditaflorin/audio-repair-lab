/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        ink: "#121619",
        panel: "#171d20",
        panel2: "#20282b",
        line: "#334142",
        mint: "#78dcca",
        amber: "#f2b15d",
        rose: "#ee6f8f"
      }
    }
  },
  plugins: []
};
