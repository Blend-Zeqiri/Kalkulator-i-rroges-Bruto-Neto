import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] }, boxShadow: { card: "0 4px 24px rgba(15, 23, 42, 0.08)" } } },
  plugins: [],
} satisfies Config;
