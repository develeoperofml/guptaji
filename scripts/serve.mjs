import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const argument = process.argv.find(
  (value, index) => process.argv[index - 1] === "--port",
);
const port = Number(argument || process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
const longCache = new Set([".webp", ".woff2", ".ttf", ".svg"]);

const server = http.createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const resolved = path.resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const file = (await stat(resolved)).isDirectory()
      ? path.join(resolved, "index.html")
      : resolved;
    const data = await readFile(file);
    const ext = path.extname(file);
    response.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": longCache.has(ext)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Page not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`Gupta Ji Tour & Travels: http://127.0.0.1:${port}\n`),
);
server.on("error", (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
