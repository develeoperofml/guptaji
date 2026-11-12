import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../dist/index.html", import.meta.url);
let html = await readFile(path, "utf8");

const destMarker = 'class="destinations section container"';
const journeysMarker = 'class="journeys-section section"';
const notesMarker = 'class="travel-notes section container"';

const destStart = html.lastIndexOf("<section", html.indexOf(destMarker));
const destEnd = html.lastIndexOf("<section", html.indexOf(journeysMarker));
if (destStart < 0 || destEnd < 0 || destEnd <= destStart) {
  throw new Error(`Could not locate destinations block (${destStart}, ${destEnd})`);
}

const destinations = html.slice(destStart, destEnd);
html = html.slice(0, destStart) + html.slice(destEnd);

const notesStart = html.lastIndexOf("<section", html.indexOf(notesMarker));
if (notesStart < 0) throw new Error("Could not locate travel-notes");

const beyond = destinations
  .replace(
    "FOLLOW YOUR CURIOSITY",
    "BEYOND INDIA",
  )
  .replace(
    "Some places call to you.<br /><em>Go answer.</em>",
    "Also explore further<br /><em>afield.</em>",
  )
  .replace(
    "From familiar favourites to wonderfully unexpected corners. Find\n              the place that feels like your next chapter.",
    "International inspiration when you want it — kept secondary to our core India services from Jaipur.",
  );

html = html.slice(0, notesStart) + beyond + html.slice(notesStart);
await writeFile(path, html);
console.log("Moved destinations after process as Beyond India.");
