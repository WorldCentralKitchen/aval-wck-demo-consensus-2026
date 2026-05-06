/**
 * WCK brand-token Tailwind preset.
 *
 * Colors are pulled from the v3 design doc §7 Phase 3 polish notes:
 *   Wild Blueberry  #1565ad — primary
 *   Spanish Saffron #e86027 — accent / CTA
 *   Sea Foam        #d0ecf2 — soft background
 *
 * All five Vite apps extend this preset so we get one palette, one type scale.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        wck: {
          blueberry: {
            DEFAULT: "#1565ad",
            50: "#eaf2fa",
            100: "#cfe0f1",
            200: "#9fc1e3",
            300: "#6fa1d4",
            400: "#3f82c6",
            500: "#1565ad",
            600: "#11518c",
            700: "#0d3d6a",
            800: "#082849",
            900: "#041427",
          },
          saffron: {
            DEFAULT: "#e86027",
            50: "#fdeee6",
            100: "#fad3bf",
            200: "#f5a780",
            300: "#f17b40",
            400: "#ed6f30",
            500: "#e86027",
            600: "#b94d1f",
            700: "#8b3a17",
            800: "#5d2710",
            900: "#2e1308",
          },
          seafoam: {
            DEFAULT: "#d0ecf2",
            50: "#f4fbfc",
            100: "#e5f4f7",
            200: "#d0ecf2",
            300: "#a3d8e3",
            400: "#76c3d4",
            500: "#49afc5",
          },
          ink: "#0a0f14",
          parchment: "#fdfaf3",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,40,73,0.05), 0 4px 12px rgba(8,40,73,0.06)",
        focus: "0 0 0 3px rgba(21,101,173,0.35)",
      },
    },
  },
  plugins: [],
};
