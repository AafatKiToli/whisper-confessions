import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const projectRoot = import.meta.dirname;
const distDir = path.resolve(projectRoot, "dist");

function copyPlainAppAssets() {
  return {
    name: "copy-plain-app-assets",

    closeBundle() {
      const filesToCopy = [
        "style.css",
        "script.js",
        "Doremon.png",
      ];

      for (const file of filesToCopy) {
        const source = path.resolve(projectRoot, file);
        const destination = path.resolve(distDir, file);

        if (fs.existsSync(source)) {
          fs.copyFileSync(source, destination);
          console.log(`Copied ${file} → dist/${file}`);
        } else {
          console.warn(`Warning: ${file} was not found.`);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    copyPlainAppAssets(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src"),
      "@assets": path.resolve(
        projectRoot,
        "..",
        "..",
        "attached_assets"
      ),
    },

    dedupe: ["react", "react-dom"],
  },

  root: projectRoot,

  publicDir: false,

  build: {
    outDir: distDir,
    emptyOutDir: true,

    rollupOptions: {
      input: path.resolve(projectRoot, "index.html"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});