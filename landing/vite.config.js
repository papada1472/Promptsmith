import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so dist/index.html works when opened directly from disk,
  // hosted in a subfolder, or shared as a zip — no server root assumptions.
  base: "./",
  plugins: [react()],
});

