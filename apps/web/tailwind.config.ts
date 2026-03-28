import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f2efe7",
        panel: "#fbfaf6",
        ink: "#162019",
        accent: "#516044",
        accentStrong: "#324132",
        line: "#d8d2c3",
        "line-subtle": "#e6e1d6",
        "muted-warm": "#8a8479",
        surface: "#f7f2e7"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards"
      }
    }
  },
  plugins: []
} satisfies Config;
