import sharp from "sharp";
import fs from "fs";

const src = "dist/assets/logo-master.jpg";

async function circular(size, out, format = "webp", quality = 88) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  const { data, info } = await sharp(src)
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let pipeline = sharp(data, { raw: info }).composite([
    { input: mask, blend: "dest-in" },
  ]);

  if (format === "png") await pipeline.png().toFile(out);
  else await pipeline.webp({ quality, effort: 6 }).toFile(out);

  console.log(out, Math.round(fs.statSync(out).size / 1024) + "kb");
}

await circular(512, "dist/assets/logo.webp");
await circular(128, "dist/assets/logo-small.webp");
await circular(180, "dist/assets/apple-touch-icon.png", "png");
await circular(64, "dist/assets/favicon.png", "png");
await circular(32, "dist/assets/favicon-32.png", "png");
await circular(400, "dist/assets/logo.png", "png");
