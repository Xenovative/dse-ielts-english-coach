import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sapphire: {
          bg: "#07070d",
          surface: "#0f0f18",
          card: "#14141f",
          "card-hover": "#1a1a28",
          border: "rgba(255,255,255,0.06)",
          "border-glow": "rgba(139,92,246,0.35)",
          muted: "#6b6b80",
          text: "#e8e8f0",
          "text-dim": "#9898a8",
          purple: "#8b5cf6",
          "purple-light": "#a78bfa",
          pink: "#ec4899",
          orange: "#f97316",
          green: "#22c55e",
          red: "#ef4444",
        },
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans TC",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(139, 92, 246, 0.15)",
        "glow-lg": "0 0 60px rgba(139, 92, 246, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.06) 100%)",
        "gradient-hero": "radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.35) 0%, transparent 60%)",
        "gradient-sidebar": "linear-gradient(180deg, #0f0f18 0%, #07070d 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
