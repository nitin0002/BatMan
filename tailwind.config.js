/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Include your src, public, or wherever you place .tsx files
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
    // Add shadcn/ui paths if you’re using any prebuilt components from that package
    // Example if you have the .ts files in node_modules or a local /components/ui folder:
    "./node_modules/@shadcn/ui/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@shadcn/ui/dist/*.mjs",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@shadcn/ui/tailwind') 
  ],
}

