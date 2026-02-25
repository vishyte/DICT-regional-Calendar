import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use relative base for production so assets work on Hosting (not only GH pages)
  base: mode === 'production' ? "./" : "/",
}));


