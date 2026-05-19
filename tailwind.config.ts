import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "var(--mint-50)",
          100: "var(--mint-100)",
          200: "var(--mint-200)",
          300: "var(--mint-300)",
          400: "var(--mint-400)",
          500: "var(--mint-500)"
        },
        cream: {
          DEFAULT: "var(--cream)",
          2: "var(--cream-2)"
        },
        navy: {
          300: "var(--navy-300)",
          500: "var(--navy-500)",
          700: "var(--navy-700)",
          800: "var(--navy-800)",
          900: "var(--navy-900)"
        },
        ink: "var(--ink)"
      },
      borderRadius: {
        base: "var(--radius)",
        lg: "var(--radius-lg)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  plugins: []
};

export default config;
