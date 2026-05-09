import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const docsDir = join(process.cwd(), "docs");
const base = "/audio-repair-lab";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"]
]);

function fileForUrl(url) {
  const parsed = new URL(url, "http://127.0.0.1");
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === base) pathname = `${base}/`;
  if (!pathname.startsWith(`${base}/`)) return null;
  pathname = pathname.slice(base.length + 1);
  const candidate = normalize(join(docsDir, pathname || "index.html"));
  if (!candidate.startsWith(docsDir)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return join(docsDir, "index.html");
}

const server = createServer((request, response) => {
  const filePath = fileForUrl(request.url ?? "/");
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.setHeader(
    "Content-Type",
    contentTypes.get(extname(filePath)) ?? "application/octet-stream"
  );
  createReadStream(filePath).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 4174;

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "tests/e2e/smoke.spec.ts", "--project=chromium"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}${base}/`
    }
  }
);

const exitCode = await new Promise((resolve) => child.on("exit", resolve));
server.close();
process.exit(Number(exitCode ?? 1));
