import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const release = path.join(root, "release");

const { siteConfig } = await import(
  pathToFileURL(path.join(dist, "site-config.js")).href
);

await rm(release, { recursive: true, force: true });
await mkdir(release, { recursive: true });
await cp(path.join(dist, "assets"), path.join(release, "assets"), {
  recursive: true,
});

await build({
  entryPoints: [path.join(dist, "app.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: path.join(release, "app.js"),
  logLevel: "silent",
});

await build({
  entryPoints: [path.join(dist, "styles.css")],
  bundle: false,
  minify: true,
  outfile: path.join(release, "styles.css"),
  logLevel: "silent",
  allowOverwrite: true,
});

const robotsContent = siteConfig.allowIndexing
  ? "index, follow"
  : "noindex, nofollow";

async function publishHtml(fileName) {
  let html = await readFile(path.join(dist, fileName), "utf8");
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
    `<meta name="robots" content="${robotsContent}" />`,
  );
  html = html.replaceAll("https://www.example.com", siteConfig.origin);
  await writeFile(path.join(release, fileName), html);
}

await publishHtml("index.html");
await publishHtml("stranger-trips.html");

await build({
  entryPoints: [path.join(dist, "stranger-trips.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: path.join(release, "stranger-trips.js"),
  logLevel: "silent",
});

const robots = siteConfig.allowIndexing
  ? `User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.origin}/sitemap.xml\n`
  : `User-agent: *\nDisallow: /\n\nSitemap: ${siteConfig.origin}/sitemap.xml\n`;
await writeFile(path.join(release, "robots.txt"), robots);

const today = new Date().toISOString().slice(0, 10);
await writeFile(
  path.join(release, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteConfig.origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteConfig.origin}/stranger-trips.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`,
);

process.stdout.write(
  `Built release/ for ${siteConfig.origin} (indexing ${siteConfig.allowIndexing ? "on" : "off"})\n`,
);
