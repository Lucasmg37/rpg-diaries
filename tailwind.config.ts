import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      colors: {
        // Paleta do HTML de referência (tema escuro de guilda).
        guild: {
          bg1: "#1a0a00",
          bg2: "#2d1200",
          gold: "#e8c46a", // dourado principal (títulos / destaque)
          goldsoft: "#d4a04a", // dourado vivo
          muted: "#a07a40", // texto apagado / corpo
          border: "#8b5e1a", // bordas e divisórias
          red: "#e07050",
          purple: "#9a60d8",
          green: "#4a7d3e",
          danger: "#8b3a1a", // borda de card "suspeito"
        },
      },
      backgroundImage: {
        "guild-gradient":
          "linear-gradient(135deg, #1a0a00 0%, #2d1200 40%, #1a0a00 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
