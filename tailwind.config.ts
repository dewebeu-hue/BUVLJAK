import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#23251f",
        field: "#f7f6ef",
        moss: "#2f7d5f",
        mossDark: "#235d49",
        clay: "#d85f3f",
        honey: "#f4b942",
        skywash: "#d8ece9",
        plum: "#6d4b7b"
      },
      opacity: {
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        16: "0.16",
        18: "0.18",
        22: "0.22",
        24: "0.24",
        28: "0.28",
        34: "0.34",
        38: "0.38",
        42: "0.42",
        46: "0.46",
        48: "0.48",
        52: "0.52",
        58: "0.58",
        62: "0.62",
        64: "0.64",
        66: "0.66",
        68: "0.68",
        74: "0.74",
        76: "0.76",
        78: "0.78",
        82: "0.82",
        88: "0.88",
        92: "0.92"
      },
      spacing: {
        13: "3.25rem"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(35, 37, 31, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
