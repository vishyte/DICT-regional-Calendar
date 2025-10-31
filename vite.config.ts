import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/DICT-regional-Calendar/", // ✅ important for GitHub Pages
});


