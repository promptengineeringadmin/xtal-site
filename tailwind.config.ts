import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        xtal: {
          navy: "#1B2D5B",
          ice: "#E8ECF1",
        },
      },
      letterSpacing: {
        brand: "0.25em",
      },
    },
  },
  plugins: [],
};
export default config;
