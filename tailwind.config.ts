import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sglAcid: "#FFD400",
        sglYellow: "#FFD400",
        sglCyan: "#00FCED",
        sglInk: "#111111",
        sglGraphite: "#2E2E2E",
        sglCream: "#F6F3E8",
        sglPaper: "#FFFFFF",
        sglFog: "#E9E3D2"
      },
      maxWidth: {
        sgl: "1600px"
      }
    },
  },
  plugins: [],
};
export default config;
