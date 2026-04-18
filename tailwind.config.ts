import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        muted: "var(--muted)",
      },
      boxShadow: {
        soft: "0 18px 44px rgba(15, 23, 42, 0.10)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(13, 148, 136, 0.16), transparent 40%), radial-gradient(circle at bottom right, rgba(234, 179, 8, 0.16), transparent 35%)",
      },
      fontFamily: {
        sans: ["var(--font-atkinson)", "sans-serif"],
        display: ["var(--font-atkinson)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
