import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--tg-bg)",
        "bg-2": "var(--tg-bg-2)",
        "bg-3": "var(--tg-bg-3)",
        accent: "var(--tg-accent)",
        muted: "var(--tg-text-muted)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
