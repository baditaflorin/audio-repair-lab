import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  version: string;
};

function gitShortSha() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  base: "/audio-repair-lab/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_RELEASE_VERSION ?? pkg.version),
    __APP_COMMIT__: JSON.stringify(gitShortSha()),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
    __APP_REPO_URL__: JSON.stringify("https://github.com/baditaflorin/audio-repair-lab"),
    __APP_SUPPORT_URL__: JSON.stringify("https://www.paypal.com/paypalme/florinbadita")
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/fft.js")) return "fft";
          if (id.includes("node_modules/@tanstack")) return "query";
          if (id.includes("node_modules/react")) return "react";
          return undefined;
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["node_modules/**", "docs/**", "tests/e2e/**"],
    coverage: {
      reporter: ["text", "json-summary"]
    }
  }
});
