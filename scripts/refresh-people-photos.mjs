import sharp from "sharp";
import path from "path";
import fs from "fs";

const assets = "dist/assets";
const src = ".tmp-photo-candidates";

async function makePair(source, baseName, { width = 1200, smallWidth = 640 } = {}) {
  const input = path.join(src, source);
  if (!fs.existsSync(input)) throw new Error(`Missing source: ${source}`);
  const full = path.join(assets, `${baseName}.webp`);
  const small = path.join(assets, `${baseName}-small.webp`);
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 72, effort: 5 })
    .toFile(full);
  await sharp(input)
    .rotate()
    .resize({ width: smallWidth, withoutEnlargement: true })
    .webp({ quality: 64, effort: 5 })
    .toFile(small);
  console.log("wrote", baseName, "←", source);
}

// Rooms / tents intentionally NOT touched.
// Core stops — every card gets a unique source file (no shared hashes).
await makePair("c-people12.jpg", "manali-mall");
await makePair("c-hotspring.jpg", "manali-vashisht");
await makePair("m13.jpg", "manali-nehru");
await makePair("g01.jpg", "manali-atal");
await makePair("g10.jpg", "manali-naggar");
await makePair("g06.jpg", "manali-activity");

// Successful trips slideshow: use scripts/refresh-success-trips.mjs
// (real Wikimedia Manali visitor uploads in .tmp-manali-real/)

console.log("done");
