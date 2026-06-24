import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "Segoe UI", "sans-serif"],
      },
      colors: {
        app: { bg: "#f4f6fa" },
        ink: { DEFAULT: "#0f172a", muted: "#64748b" },
        brand: { 600: "#2563eb", 900: "#1f4e79" },
        navy: "#0f172a",
        line: "#e5e9f0",
        // Status chip palettes (background / foreground pairs)
        status: {
          "green-bg": "#dcfce7",
          "green-fg": "#166534",
          "amber-bg": "#fef3c7",
          "amber-fg": "#92400e",
          "red-bg": "#fee2e2",
          "red-fg": "#991b1b",
          "blue-bg": "#dbeafe",
          "blue-fg": "#1e3a8a",
          "neutral-bg": "#e2e8f0",
          "neutral-fg": "#334155",
        },
      },
      borderRadius: { card: "14px" },
      boxShadow: {
        soft: "0 6px 14px -8px rgba(37,99,235,.7)",
      },
    },
  },
  plugins: [],
};

export default config;
