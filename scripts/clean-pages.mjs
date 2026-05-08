import { rmSync } from "node:fs";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/manifest.webmanifest",
  "docs/icon.svg",
  "docs/sw.js"
]) {
  rmSync(path, { force: true, recursive: true });
}
