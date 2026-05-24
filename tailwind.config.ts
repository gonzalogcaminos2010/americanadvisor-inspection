import type { Config } from "tailwindcss";

// Brand palette — derived from americanad.com.ar logo + site CSS.
// Navy = "AMERICAN" wordmark + figure (#1A365D, sits at 700).
// Cyan = dome / "ADVISOR" wordmark (#00A6D6, sits at 500).
const navy = {
  50:  '#EFF3F8',
  100: '#D5DFEC',
  200: '#ACBED9',
  300: '#7E9CC2',
  400: '#4E78A6',
  500: '#2E558A',
  600: '#244670',
  700: '#1A365D', // brand
  800: '#122749',
  900: '#0A1830',
};

const accent = {
  50:  '#E0F6FD',
  100: '#B3E7F8',
  200: '#80D5F2',
  300: '#4DC4EC',
  400: '#26B7E5',
  500: '#00A6D6', // brand
  600: '#008BB8',
  700: '#006F95',
  800: '#005572',
  900: '#003A50',
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Override the generic Tailwind blue so every `bg-blue-*`,
        // `text-blue-*`, `ring-blue-*` already in the codebase rebrands
        // automatically to American Advisor navy.
        blue: navy,
        primary: navy,
        accent,
      },
    },
  },
  plugins: [],
};
export default config;
