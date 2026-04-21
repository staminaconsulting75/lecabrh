import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs officielles CABRH
        // PANTONE 2925 C — bleu ciel
        cabrh: {
          sky: "#009ADE",
          navy: "#004D71",
          skyLight: "#E6F5FB",
          skyMid: "#66C5EC",
          navyLight: "#336D8A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
