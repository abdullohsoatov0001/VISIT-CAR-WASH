import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          blue: "#0EA5E9",
          cyan: "#06B6D4",
          purple: "#8B5CF6",
          "blue-dark": "#0284C7",
          "blue-glow": "#38BDF8",
        },
        surface: {
          DEFAULT: "#F8FAFF",
          elevated: "#EEF2FF",
          card: "#FFFFFF",
          border: "#E2E8F0",
          "border-light": "#CBD5E1",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["Cal Sans", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)",
        "gradient-light": "linear-gradient(180deg, #F8FAFF 0%, #EEF2FF 100%)",
        "grid-pattern": "linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "60px 60px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "fade-up": "fade-up 0.6s ease-out",
        "spin-slow": "spin 8s linear infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "orbit": "orbit 12s linear infinite",
        "car-drive": "car-drive 4s ease-in-out infinite",
        "ripple": "ripple 1.5s ease-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "border-beam": "border-beam 8s linear infinite",
        "meteor": "meteor 5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(14,165,233,0.2)" },
          "50%": { boxShadow: "0 0 60px rgba(14,165,233,0.4), 0 0 100px rgba(14,165,233,0.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(120px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(120px) rotate(-360deg)" },
        },
        "car-drive": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(20px)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "border-beam": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "100% 100%" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: "0" },
        },
      },
      boxShadow: {
        "brand": "0 0 30px rgba(14,165,233,0.2)",
        "brand-lg": "0 0 60px rgba(14,165,233,0.3)",
        "card": "0 4px 24px rgba(0,0,0,0.07)",
        "card-hover": "0 8px 48px rgba(0,0,0,0.12)",
        "glow-blue": "0 0 40px rgba(14,165,233,0.3)",
        "glow-purple": "0 0 40px rgba(139,92,246,0.3)",
        "inner-glow": "inset 0 0 30px rgba(14,165,233,0.06)",
        "premium": "0 20px 80px rgba(0,0,0,0.1), 0 0 0 1px rgba(14,165,233,0.1)",
      },
      blur: {
        "4xl": "80px",
        "5xl": "120px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
