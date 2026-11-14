import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
/** Vercel default Output Directory is `public`. Keep `release` as an alias copy. */
const outDirName = "public";
const out = path.join(root, outDirName);
const releaseAlias = path.join(root, "release");

const { siteConfig } = await import(
  pathToFileURL(path.join(dist, "site-config.js")).href
);

const origin = String(siteConfig.origin || "").replace(/\/$/, "");
if (!origin) {
  throw new Error("siteConfig.origin is required");
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(dist, "assets"), path.join(out, "assets"), {
  recursive: true,
});

/** Recompress WebP in the publish folder so Vercel ships smaller images. */
async function optimizePublicWebp() {
  const assetsDir = path.join(out, "assets");
  const files = await readdir(assetsDir);
  let saved = 0;
  for (const file of files) {
    if (!file.endsWith(".webp")) continue;
    const full = path.join(assetsDir, file);
    const before = (await stat(full)).size;
    const isSmall = file.includes("-small");
    const width = isSmall ? 720 : 1200;
    const quality = isSmall ? 62 : 68;
    try {
      const buf = await sharp(full)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (buf.length >= before * 0.98) continue;
      const tmp = `${full}.${process.pid}.tmp.webp`;
      await writeFile(tmp, buf);
      try {
        await unlink(full);
        await rename(tmp, full);
      } catch {
        /* Windows file locks: overwrite in place, then drop tmp */
        try {
          await writeFile(full, buf);
        } catch {
          /* keep original */
        }
        try {
          await unlink(tmp);
        } catch {
          /* ignore leftover tmp */
        }
      }
      saved += before - buf.length;
    } catch {
      /* keep original if sharp cannot rewrite this file */
    }
  }
  if (saved > 0) {
    console.log(`Optimized WebP assets (−${Math.round(saved / 1024)} KiB)`);
  }
}

await optimizePublicWebp();

await build({
  entryPoints: [path.join(dist, "app.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: path.join(out, "app.js"),
  logLevel: "silent",
});

await build({
  entryPoints: [path.join(dist, "styles.css")],
  bundle: false,
  minify: true,
  outfile: path.join(out, "styles.css"),
  logLevel: "silent",
  allowOverwrite: true,
});

await build({
  entryPoints: [path.join(dist, "stranger-trips.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: path.join(out, "stranger-trips.js"),
  logLevel: "silent",
});

const robotsContent = siteConfig.allowIndexing
  ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  : "noindex, nofollow";

const verificationTag = siteConfig.googleSiteVerification
  ? `<meta name="google-site-verification" content="${siteConfig.googleSiteVerification}" />`
  : "";

const analyticsTag = siteConfig.gaMeasurementId
  ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${siteConfig.gaMeasurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${siteConfig.gaMeasurementId}', { anonymize_ip: true });
    </script>`
  : "";

function applyOrigin(html) {
  return html
    .replaceAll("https://www.example.com", origin)
    .replaceAll("https://guptajitourtravel.cognivx.com", origin);
}

async function publishHtml(fileName) {
  let html = await readFile(path.join(dist, fileName), "utf8");
  html = applyOrigin(html);
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
    `<meta name="robots" content="${robotsContent}" />`,
  );
  html = html.replace("<!-- SEO_VERIFICATION -->", verificationTag);
  html = html.replace("<!-- SEO_ANALYTICS -->", analyticsTag);
  await writeFile(path.join(out, fileName), html);
}

await publishHtml("index.html");
await publishHtml("stranger-trips.html");

const robots = siteConfig.allowIndexing
  ? `User-agent: *
Allow: /

# Keep planner/dialog fragments out of crawl noise if linked with query params
Disallow: /*?*utm_
Disallow: /*?*fbclid=

Sitemap: ${origin}/sitemap.xml
`
  : `User-agent: *
Disallow: /

Sitemap: ${origin}/sitemap.xml
`;
await writeFile(path.join(out, "robots.txt"), robots);
await writeFile(path.join(dist, "robots.txt"), robots);

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="${origin}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />
  </url>
  <url>
    <loc>${origin}/stranger-trips.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="${origin}/stranger-trips.html" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/stranger-trips.html" />
  </url>
</urlset>
`;
await writeFile(path.join(out, "sitemap.xml"), sitemap);
await writeFile(path.join(dist, "sitemap.xml"), sitemap);

const ogImage = `${origin}${siteConfig.ogImagePath || "/assets/amber.webp"}`;
const manifest = {
  name: siteConfig.businessName,
  short_name: "Gupta Ji Travels",
  description: siteConfig.defaultDescription,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#183f35",
  lang: "en-IN",
  dir: "ltr",
  categories: ["travel", "lifestyle"],
  icons: [
    {
      src: "/assets/favicon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
  ],
  shortcuts: [
    {
      name: "Plan a route",
      short_name: "Plan",
      url: "/#trip-finder",
    },
    {
      name: "Manali weekend",
      short_name: "Manali",
      url: "/stranger-trips.html#book",
    },
    {
      name: "Call us",
      short_name: "Call",
      url: `tel:${siteConfig.phoneTel}`,
    },
  ],
};
await writeFile(
  path.join(out, "site.webmanifest"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const humans = `/* TEAM */
Business: ${siteConfig.businessName}
Contact: ${siteConfig.enquiryEmail}
Phone: ${siteConfig.phoneDisplay}
WhatsApp: ${siteConfig.whatsappDisplay}
Instagram: ${siteConfig.instagramHandle}
Location: Jaipur, Rajasthan, India

/* SITE */
Standards: HTML5, CSS3, ES modules
Components: Private cabs, India packages, Manali stranger trips
Last update: ${today}
`;
await writeFile(path.join(out, "humans.txt"), humans);

/* Lightweight social share hint file for ops (not required by crawlers) */
await writeFile(
  path.join(out, "seo-share.txt"),
  `Primary share image: ${ogImage}
Canonical home: ${origin}/
Canonical stranger trips: ${origin}/stranger-trips.html
Sitemap: ${origin}/sitemap.xml
Indexing: ${siteConfig.allowIndexing ? "on" : "off"}
Next steps: Google Search Console → Add property → Submit sitemap
`,
);

await rm(releaseAlias, { recursive: true, force: true });
await cp(out, releaseAlias, { recursive: true });

process.stdout.write(
  `Built ${outDirName}/ (and release/) for ${origin} (indexing ${siteConfig.allowIndexing ? "on" : "off"})\n`,
);
