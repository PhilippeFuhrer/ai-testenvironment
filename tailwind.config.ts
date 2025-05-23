import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./chatBot/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "arcon-green": "#004132",
        "arcon-light-green": "#1BCB80",
        "arcon-light-grey": "#f4f6f7",
        "arcon-grey": "#E4E8EB",
      },
      fontFamily: {
        sans: ["Karelia-Medium", "sans-serif"],
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      'xxl': '1600px',  
    }
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark", "winter", "forest", "corporate"],
  },
};
export default config;