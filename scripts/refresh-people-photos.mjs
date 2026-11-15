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

// Successful trips slideshow — 12 unique engaging group / people shots
const slides = [
  ["c-hadimba.jpg", "trip-success-01"],
  ["c-solang.jpg", "trip-success-02"],
  ["m16.jpg", "trip-success-03"],
  ["m14.jpg", "trip-success-04"],
  ["g07.jpg", "trip-success-05"],
  ["g04.jpg", "trip-success-06"],
  ["g02.jpg", "trip-success-07"],
  ["m17.jpg", "trip-success-08"],
  ["s12.jpg", "trip-success-09"],
  ["g13.jpg", "trip-success-10"],
  ["g11.jpg", "trip-success-11"],
  ["s01.jpg", "trip-success-12"],
];

for (const [source, name] of slides) {
  await makePair(source, name, { width: 1400, smallWidth: 720 });
}

console.log("done");
