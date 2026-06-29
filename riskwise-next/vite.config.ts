import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/, so
// assets must be prefixed with the repo path. The deploy workflow passes the
// real repo name via BASE_PATH; local dev/build keep "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
