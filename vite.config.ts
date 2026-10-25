import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// WRANGLER_STATE lets Windows users keep local D1 state on a short path (MAX_PATH limits).
const statePath = process.env.WRANGLER_STATE;

export default defineConfig({
  plugins: [react(), cloudflare({ persistState: statePath ? { path: statePath } : true })],
});
