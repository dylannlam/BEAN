/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        espresso: "#3D2B1F",
        cream: "#FFF8F0",
        latte: "#C8A27D",
        accent: "#E85D3D",
      },
    },
  },
  plugins: [],
};
