import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Three.js is a single large engine dependency; the application, React and
    // networking code are kept in separate cacheable chunks below.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/react")) return "react";
          if (id.includes("node_modules/socket.io") || id.includes("node_modules/engine.io")) return "network";
          return undefined;
        },
      },
    },
  },

  server: {
    hmr: {
      overlay: false,
    },
  },
});
