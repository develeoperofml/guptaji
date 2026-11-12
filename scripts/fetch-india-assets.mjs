import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = path.join(root, "dist", "assets");
const tmpDir = path.join(root, ".tmp-assets");
await mkdir(tmpDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const files = [
  {
    id: "sedan",
    title: "Maruti Suzuki Dzire sedan",
    name: "Maruti_Suzuki_Dzire_VXi_VVT_(front).JPG",
    author: "Biswarup Ganguly",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Maruti_Suzuki_Dzire_VXi_VVT_(front).JPG",
  },
  {
    id: "ertiga",
    title: "Suzuki Ertiga MPV",
    name: "2013_Suzuki_Ertiga_1.4_GX_wagon_(ZE81S;_01-20-2019),_South_Tangerang.jpg",
    author: "Spotter2",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:2013_Suzuki_Ertiga_1.4_GX_wagon_(ZE81S;_01-20-2019),_South_Tangerang.jpg",
  },
  {
    id: "innova",
    title: "Toyota Innova Crysta",
    name: "Toyota_Innova_Crysta_2.4_Z_front_right.jpg",
    author: "Premnath Kudva",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_front_right.jpg",
  },
  {
    id: "traveller",
    title: "Force Traveller",
    name: "Force_Traveller,_Leh-Manali_Highway.jpg",
    author: "Timothy A. Gonsalves",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Force_Traveller,_Leh-Manali_Highway.jpg",
  },
  {
    id: "urbania",
    title: "Force Traveller Luxury (illustrative premium group van)",
    name: "Force_Traveller_Luxury.jpg",
    author: "Force Motors (via Wikimedia Commons upload)",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Force_Traveller_Luxury.jpg",
    note: "Used as an illustrative premium group-van visual until a licensed Force Urbania photo is supplied by the client.",
  },
  {
    id: "amber",
    title: "Amber Fort, Jaipur",
    name: "Amber_Fort_-_Outside_view.jpg",
    author: "Bernie",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Amber_Fort_-_Outside_view.jpg",
  },
  {
    id: "delhi",
    title: "India Gate, New Delhi",
    name: "India_Gate_in_New_Delhi_03-2016.jpg",
    author: "A.Savin",
    license: "FAL",
    licenseUrl: "https://artlibre.org/licence/lal/en/",
    source:
      "https://commons.wikimedia.org/wiki/File:India_Gate_in_New_Delhi_03-2016.jpg",
  },
];

const credits = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const file of files) {
  const large = path.join(outDir, `${file.id}.webp`);
  const small = path.join(outDir, `${file.id}-small.webp`);
  let exists = false;
  try {
    await import("node:fs/promises").then((fs) => fs.access(large));
    exists = true;
  } catch {
    exists = false;
  }

  if (!exists) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.name)}`;
    process.stdout.write(`Fetching ${file.id}…\n`);
    let response;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "GuptaJiTourSite/1.0 (asset prep; contact: local development)",
        },
        redirect: "follow",
      });
      if (response.ok) break;
      if (response.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      throw new Error(`Failed ${file.id}: ${response.status}`);
    }
    if (!response.ok) throw new Error(`Failed ${file.id}: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(path.join(tmpDir, file.name), buffer);
    await sleep(1500);

    const image = sharp(buffer).rotate();
    const meta = await image.metadata();
    const targetWidth = Math.min(1200, meta.width || 1200);
    await image
      .clone()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(large);
    await sharp(buffer)
      .rotate()
      .resize({ width: 560, withoutEnlargement: true })
      .webp({ quality: 72 })
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
    changes: `Resized and compressed to WebP; ${info.width} × ${info.height}${file.note ? `. ${file.note}` : ""}`,
  });
}

const existing = JSON.parse(
  await import("node:fs/promises").then((fs) =>
    fs.readFile(path.join(outDir, "credits.json"), "utf8"),
  ),
);
const list = Array.isArray(existing)
  ? existing
  : existing.images || existing.assets || [];
const merged = [
  ...list.filter(
    (item) => !credits.some((credit) => credit.file === (item.file || item.filename)),
  ),
  ...credits,
];
await writeFile(path.join(outDir, "credits.json"), JSON.stringify(merged, null, 2));
process.stdout.write(`Saved ${credits.length} India service assets.\n`);
