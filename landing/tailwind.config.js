/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        surface: "#18181B", // zinc-900
        line: "#27272A", // zinc-800
        base: "#09090B", // zinc-950
        accent: "#3B82F6", // blue-500
      },
      boxShadow: {
        "glow-white": "0 0 20px rgba(255,255,255,0.1)",
        "glow-blue": "0 0 30px rgba(59,130,246,0.5)",
        "glow-blue-soft": "0 0 30px rgba(59,130,246,0.15)",
        "glow-blue-md": "0 0 30px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [],
};
