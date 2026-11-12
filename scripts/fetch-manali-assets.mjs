import sharp from "sharp";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = path.join(root, "dist", "assets");
const tmpDir = path.join(root, ".tmp-assets");
await mkdir(tmpDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const files = [
  {
    id: "manali-hero",
    title: "Manali deodar mist landscape",
    name: "Grass_Deodar_Monsoon_Mist_Manali_Sep20_R16_04026.jpg",
    author: "Ranjithsiji",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Grass_Deodar_Monsoon_Mist_Manali_Sep20_R16_04026.jpg",
  },
  {
    id: "manali-solang",
    title: "Solang Valley, Manali",
    name: "Solang_Valley,_India.jpg",
    author: "Ninaras",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Solang_Valley,_India.jpg",
  },
  {
    id: "manali-hadimba",
    title: "Hadimba Devi Temple, Manali",
    name: "Hadimba_Devi_Temple_Manali.jpg",
    author: "Ninaras",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Hadimba_Devi_Temple_Manali.jpg",
  },
  {
    id: "manali-old",
    title: "Old Manali village lanes",
    name: "Old_Manali,_Manali,_India_(Unsplash_MSK-2kuYJDE).jpg",
    author: "Unsplash / Wikimedia Commons",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Old_Manali,_Manali,_India_(Unsplash_MSK-2kuYJDE).jpg",
  },
  {
    id: "manali-mall",
    title: "Mall Road, Manali",
    name: "Mall_Road,_Manali.jpg",
    author: "Ninaras",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Mall_Road,_Manali.jpg",
  },
  {
    id: "manali-road",
    title: "Manali mountain highway scenery",
    name: "Manali_to_Rohtang_5.jpg",
    author: "Ninaras",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Manali_to_Rohtang_5.jpg",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const credits = [];

for (const file of files) {
  const large = path.join(outDir, `${file.id}.webp`);
  const small = path.join(outDir, `${file.id}-small.webp`);
  let exists = false;
  try {
    await access(large);
    exists = true;
  } catch {
    exists = false;
  }

  if (!exists) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.name)}?width=1600`;
    process.stdout.write(`Fetching ${file.id}…\n`);
    let response;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "GuptaJiTourSite/1.0 (asset prep; local development)",
        },
        redirect: "follow",
      });
      if (response.ok) break;
      if (response.status === 429 || response.status >= 500) {
        await sleep(1800 * attempt);
        continue;
      }
      throw new Error(`Failed ${file.id}: ${response.status}`);
    }
    if (!response.ok) throw new Error(`Failed ${file.id}: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(path.join(tmpDir, file.name), buffer);
    await sleep(1200);

    const meta = await sharp(buffer).rotate().metadata();
    const targetWidth = Math.min(1200, meta.width || 1200);
    await sharp(buffer)
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(large);
    await sharp(buffer)
      .rotate()
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(small);
  } else {
    process.stdout.write(`Skip existing ${file.id}\n`);
  }

  const info = await sharp(large).metadata();
  credits.push({
    file: `${file.id}.webp`,
    title: file.title,
    author: file.author,
    license: file.license,
    licenseUrl: file.licenseUrl,
    source: file.source,
    changes: `Resized and compressed to WebP; ${info.width} × ${info.height}`,
  });
}

let existing = [];
try {
  const raw = JSON.parse(await readFile(path.join(outDir, "credits.json"), "utf8"));
  existing = Array.isArray(raw) ? raw : raw.images || raw.assets || [];
} catch {
  existing = [];
}
const merged = [
  ...existing.filter(
    (item) => !credits.some((credit) => credit.file === (item.file || item.filename)),
  ),
  ...credits,
];
await writeFile(path.join(outDir, "credits.json"), JSON.stringify(merged, null, 2));
process.stdout.write(`Saved ${credits.length} Manali stranger-trip assets.\n`);
