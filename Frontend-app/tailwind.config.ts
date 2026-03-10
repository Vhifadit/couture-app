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
        emeraude: {
          DEFAULT: "#2D6A4F",
          light: "#52B788",
          dark: "#1B4332",
        },
        pierre: {
          DEFAULT: "#C9B99A",
          light: "#F5EFE6",
          dark: "#A08060",
        },
        ardoise: {
          DEFAULT: "#4A5568",
          light: "#718096",
        },
      },
    },
  },
  plugins: [],
};
export default config;