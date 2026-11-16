/**
 * Search Wikimedia Commons for real destination photos, download, write WebP pairs + credits.
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tmpRoot = path.join(root, ".tmp-trip-photos");
const assets = path.join(root, "dist", "assets");
const creditsPath = path.join(assets, "credits.json");
const UA = "GuptaJiTourSite/1.0 (top5-trip-photos; contact info@cognivx.com)";

const TRIP_QUERIES = {
  "kasol-kheerganga": [
    "Kasol Himachal",
    "Parvati River Kasol",
    "Kheerganga",
    "Manikaran",
    "Parvati Valley",
    "Tosh Himachal",
  ],
  "mcleodganj-triund": [
    "McLeod Ganj",
    "McLeodganj",
    "Triund",
    "Bhagsu waterfall",
    "Dharamshala Himachal",
    "Tsuglagkhang",
  ],
  "chopta-tungnath": [
    "Chopta",
    "Tungnath",
    "Chandrashila",
    "Deoria Tal",
    "Chopta Uttarakhand",
  ],
  "jibhi-tirthan": [
    "Jibhi",
    "Tirthan Valley",
    "Jalori Pass",
    "Serolsar Lake",
    "Banjar Himachal",
  ],
  "spiti-valley": [
    "Key Monastery Spiti",
    "Kaza Spiti",
    "Chicham Bridge",
    "Dhankar Monastery",
    "Langza",
    "Kunzum Pass",
    "Spiti Valley",
  ],
};

const SLOT_SUFFIXES = [
  "hero",
  "stay-01",
  "stay-02",
  "stay-03",
  "stay-04",
  "stay-05",
  "stay-06",
  "stay-07",
  "success-01",
  "success-02",
  "success-03",
  "success-04",
  "success-05",
  "success-06",
  "success-07",
  "success-08",
  "day-01",
  "day-02",
  "day-03",
  "day-04",
  "place-01",
  "place-02",
  "place-03",
  "place-04",
  "place-05",
  "place-06",
];

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function commonsSearch(query, limit = 20) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: `filetype:bitmap ${query}`,
      gsrlimit: String(limit),
      gsrnamespace: "6",
      prop: "imageinfo",
      iiprop: "url|size|extmetadata|mime",
      iiurlwidth: "1600",
    });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const json = await res.json();
  const pages = Object.values(json.query?.pages || {});
  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.url) return null;
      const mime = info.mime || "";
      if (!mime.startsWith("image/") || mime.includes("svg")) return null;
      if ((info.size || 0) < 40000) return null;
      const m = info.extmetadata || {};
      const strip = (html) =>
        String(html || "")
          .replace(/<[^>]+>/g, "")
          .trim();
      const title = (p.title || "").replace(/^File:/, "");
      // Prefer photos with people/places — skip maps/diagrams by crude title filter
      if (/map|logo|icon|diagram|chart|flag of/i.test(title)) return null;
      return {
        title,
        thumburl: info.thumburl || info.url,
        url: info.url,
        width: info.width,
        height: info.height,
        author: strip(m.Artist?.value) || "Wikimedia Commons contributor",
        license: m.LicenseShortName?.value || "CC",
        licenseUrl: m.LicenseUrl?.value || "https://commons.wikimedia.org/",
        objectName: strip(m.ObjectName?.value) || title,
        source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title).replaceAll("%20", "_")}`,
      };
    })
    .filter(Boolean);
}

async function downloadUrl(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) return null;
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function makePair(input, baseName, { width = 1400, smallWidth = 720 } = {}) {
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 74, effort: 4 })
    .toFile(path.join(assets, `${baseName}.webp`));
  await sharp(input)
    .rotate()
    .resize({ width: smallWidth, withoutEnlargement: true })
    .webp({ quality: 66, effort: 4 })
    .toFile(path.join(assets, `${baseName}-small.webp`));
}

fs.mkdirSync(tmpRoot, { recursive: true });
fs.mkdirSync(assets, { recursive: true });

let credits = [];
if (fs.existsSync(creditsPath)) {
  try {
    credits = JSON.parse(fs.readFileSync(creditsPath, "utf8"));
  } catch {
    credits = [];
  }
}

let ok = 0;
let fail = 0;

for (const [slug, queries] of Object.entries(TRIP_QUERIES)) {
  console.log(`\n=== ${slug} ===`);
  const pool = [];
  const seen = new Set();
  for (const q of queries) {
    process.stdout.write(`search ${q}… `);
    const hits = await commonsSearch(q, 24);
    console.log(hits.length);
    for (const hit of hits) {
      if (seen.has(hit.title)) continue;
      seen.add(hit.title);
      pool.push(hit);
    }
    await sleep(350);
  }

  // Prefer landscape-ish photos for heroes; otherwise any
  pool.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));

  if (!pool.length) {
    console.log("NO PHOTOS for", slug);
    fail += SLOT_SUFFIXES.length;
    continue;
  }

  let poolIndex = 0;
  for (const suffix of SLOT_SUFFIXES) {
    const base = `${slug}-${suffix}`;
    const raw = path.join(tmpRoot, `${base}.jpg`);
    const metaPath = path.join(tmpRoot, `${base}.json`);

    let meta = null;
    if (fs.existsSync(raw) && fs.statSync(raw).size > 8000 && fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      console.log(`cache ${base}`);
    } else {
      let downloaded = null;
      for (let attempt = 0; attempt < pool.length && !downloaded; attempt += 1) {
        const candidate = pool[poolIndex % pool.length];
        poolIndex += 1;
        const url =
          candidate.thumburl ||
          `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(candidate.title)}?width=1600`;
        const len = await downloadUrl(url, raw);
        if (len) {
          downloaded = candidate;
          meta = candidate;
          fs.writeFileSync(metaPath, JSON.stringify(candidate, null, 2));
          console.log(`ok ${base} ← ${candidate.title.slice(0, 60)} (${len})`);
        } else {
          await sleep(150);
        }
      }
      if (!downloaded) {
        // reuse first successful raw in this trip folder
        const reuse = SLOT_SUFFIXES.map((s) => path.join(tmpRoot, `${slug}-${s}.jpg`)).find(
          (p) => fs.existsSync(p) && fs.statSync(p).size > 8000,
        );
        if (reuse) {
          fs.copyFileSync(reuse, raw);
          meta = pool[0];
          console.log(`reuse ${base}`);
        } else {
          console.log(`FAIL ${base}`);
          fail += 1;
          continue;
        }
      }
    }

    const isHero = suffix === "hero";
    await makePair(raw, base, {
      width: isHero ? 1600 : 1400,
      smallWidth: isHero ? 900 : 720,
    });

    const credit = {
      file: `${base}.webp`,
      title: meta?.objectName || meta?.title || base,
      author: meta?.author || "Wikimedia Commons",
      license: meta?.license || "CC",
      licenseUrl: meta?.licenseUrl || "https://commons.wikimedia.org/",
      source: meta?.source || "https://commons.wikimedia.org/",
      changes: "Resized and compressed to WebP",
    };
    credits = credits.filter((c) => c.file !== credit.file);
    credits.push(credit);
    ok += 1;
    await sleep(80);
  }
}

fs.writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`);
console.log(`\ndone ok=${ok} fail=${fail}`);
