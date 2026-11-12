import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../dist/index.html", import.meta.url);
let html = await readFile(path, "utf8");

const gridStart = html.indexOf('<div class="destination-grid">');
const gridEnd = html.indexOf("</div>", html.indexOf('data-destination="Kenya"'));
if (gridStart < 0 || gridEnd < 0) throw new Error("destination grid not found");
const close = html.indexOf("</div>", gridEnd + 1); // end of destination-grid
const gridHtml = html.slice(gridStart, close + 6);

const buttonRegex =
  /<button[\s\S]*?class="destination-card[\s\S]*?<\/button>/g;
const buttons = gridHtml.match(buttonRegex) || [];
const india = buttons.find((b) => b.includes('data-destination="India"'));
const others = buttons.filter((b) => !b.includes('data-destination="India"'));
if (!india) throw new Error("India card missing");

const rebuilt = `<div class="destination-grid">\n          ${[india, ...others].join(
  "\n          ",
)}\n        </div>`;
html = html.slice(0, gridStart) + rebuilt + html.slice(close + 6);
await writeFile(path, html);
console.log("India destination card moved first.");
