import sharp from "sharp";
import path from "path";
import fs from "fs";

const assets = "dist/assets";
const src = ".tmp-manali-real";

async function makePair(source, baseName, { width = 1400, smallWidth = 720 } = {}) {
  const input = path.join(src, source);
  if (!fs.existsSync(input)) throw new Error(`Missing source: ${source}`);
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 74, effort: 5 })
    .toFile(path.join(assets, `${baseName}.webp`));
  await sharp(input)
    .rotate()
    .resize({ width: smallWidth, withoutEnlargement: true })
    .webp({ quality: 66, effort: 5 })
    .toFile(path.join(assets, `${baseName}-small.webp`));
  console.log("wrote", baseName, "←", source);
}

// Real Manali visitor / street / pass photos from Wikimedia Commons only.
const slides = [
  ["r01.jpg", "trip-success-01"], // Hadimba temple visitors
  ["r02.jpg", "trip-success-02"], // Hadimba visitors + camera
  ["r04.jpg", "trip-success-03"], // Solang paragliding
  ["r11.jpg", "trip-success-04"], // Old Manali market group
  ["r08.jpg", "trip-success-05"], // Mall Road walkers
  ["r09.jpg", "trip-success-06"], // Mall Road rainy day
  ["r17.jpg", "trip-success-07"], // Couple in Solang snow
  ["r14.jpg", "trip-success-08"], // Rohtang tourist vehicles
  ["r27.jpg", "trip-success-09"], // Rohtang snow crowd
  ["r16.jpg", "trip-success-10"], // Marhi roadside dhaba
  ["r20.jpg", "trip-success-11"], // Manali bus stand
  ["r07.jpg", "trip-success-12"], // Manali market juice stall
];

for (const [source, name] of slides) {
  await makePair(source, name);
}

console.log("done");
