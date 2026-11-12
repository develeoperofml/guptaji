import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const order = [
  "hero-title",
  "from-jaipur",
  "journeys",
  "our-story",
  "how-it-works",
  "destinations",
  "travel-notes",
  "faq-title",
];
const positions = order.map((id) => ({ id, pos: html.indexOf(`id="${id}"`) }));
for (const item of positions) {
  if (item.pos < 0) throw new Error(`Missing ${item.id}`);
}
const sorted = [...positions].sort((a, b) => a.pos - b.pos).map((item) => item.id);
console.log(sorted.join(" -> "));
if (sorted.join() !== order.join()) {
  throw new Error("Section order mismatch");
}
