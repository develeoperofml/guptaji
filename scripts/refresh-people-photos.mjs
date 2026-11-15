import sharp from "sharp";
import path from "path";

const assets = "dist/assets";
const src = ".tmp-photo-candidates";

async function makePair(source, baseName, { width = 1200, smallWidth = 640 } = {}) {
  const full = path.join(assets, `${baseName}.webp`);
  const small = path.join(assets, `${baseName}-small.webp`);
  await sharp(path.join(src, source))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 72, effort: 5 })
    .toFile(full);
  await sharp(path.join(src, source))
    .rotate()
    .resize({ width: smallWidth, withoutEnlargement: true })
    .webp({ quality: 64, effort: 5 })
    .toFile(small);
  console.log("wrote", baseName);
}

// Rooms / tents intentionally NOT touched.
await makePair("hadimba-people.jpg", "manali-hadimba");
await makePair("solang-paraglide.jpg", "manali-solang");
await makePair("pexels-couple-mountains.jpg", "manali-activity");
await makePair("manali-people12.jpg", "manali-vashisht");
await makePair("manali-people5.jpg", "manali-nehru");
await makePair("unsplash-himachal-friends.jpg", "manali-road");
await makePair("manali-people5.jpg", "manali-hero");
await makePair("pexels-couple-mountains.jpg", "manali-atal");
// Friends on a heritage / outing day (keeps people energy for Naggar swap card)
await makePair("unsplash-himachal-friends.jpg", "manali-naggar");
// Keep Mall Road as a lively people-in-town scene (Vashisht street crowd)
await makePair("manali-people12.jpg", "manali-mall");

console.log("done");
