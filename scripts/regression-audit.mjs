import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const findings = [];
const pass = (name, detail = "") => findings.push({ status: "PASS", name, detail });
const fail = (name, detail = "") => findings.push({ status: "FAIL", name, detail });
const warn = (name, detail = "") => findings.push({ status: "WARN", name, detail });

const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const app = fs.readFileSync(path.join(dist, "app.js"), "utf8");

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(ids);
const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dups.length) fail("Duplicate HTML ids", [...new Set(dups)].join(", "));
else pass("No duplicate HTML ids");

const refs = [...app.matchAll(/\$\(\s*["']#([a-zA-Z0-9_-]+)["']/g)].map((m) => m[1]);
const dynamicDialogIds = new Set(["credit-status", "credits-list", "saved-list"]);
const missing = [...new Set(refs)]
  .filter((id) => !idSet.has(id) && !dynamicDialogIds.has(id))
  .sort();
if (missing.length) fail("app.js selectors missing in HTML", missing.join(", "));
else pass("All app.js #id selectors exist in HTML");

const required = [
  "trip-finder",
  "journey-search",
  "pickup-search",
  "place-search",
  "pickup-suggestions",
  "place-suggestions",
  "search-pickup-id",
  "search-place-id",
  "finder-results",
  "finder-host-cta",
  "region-chips",
  "region-cities",
  "fleet-grid",
  "india-experience-grid",
  "tour-grid",
  "planner-dialog",
  "planner-form",
  "planner-next",
  "planner-back",
  "planner-success",
  "currency",
  "whatsapp-float",
  "toast",
  "mobile-nav",
  "journeys",
  "from-jaipur",
];
const missingRequired = required.filter((id) => !idSet.has(id));
if (missingRequired.length) fail("Required UI ids missing", missingRequired.join(", "));
else pass("Required trip-finder / planner ids present");

const toFileUrl = (p) => pathToFileURL(p).href;
const {
  searchablePlaces,
  findPlace,
  searchPlaces,
  vehicleRatesInr,
  indiaRegions,
} = await import(toFileUrl(path.join(dist, "destinations-data.js")));
const { tours, fleet, indiaExperiences } = await import(
  toFileUrl(path.join(dist, "data.js"))
);
const { siteConfig } = await import(toFileUrl(path.join(dist, "site-config.js")));

if (!siteConfig.whatsappNumber?.startsWith("91"))
  fail("WhatsApp number format", String(siteConfig.whatsappNumber));
else pass("WhatsApp number configured", siteConfig.whatsappNumber);

if (siteConfig.defaultCurrency !== "INR")
  warn("Default currency not INR", siteConfig.defaultCurrency);
else pass("Default currency INR");

const assetNames = new Set([
  ...fleet.map((f) => f.image),
  ...indiaExperiences.map((i) => i.image),
  ...Object.keys(vehicleRatesInr),
  "amber",
  "delhi",
  "redfort",
  "india",
  "hero",
]);
const missingAssets = [];
for (const name of assetNames) {
  for (const suffix of [".webp", "-small.webp"]) {
    const file = path.join(dist, "assets", `${name}${suffix}`);
    if (!fs.existsSync(file)) missingAssets.push(`${name}${suffix}`);
  }
}
if (missingAssets.length) fail("Missing image assets", missingAssets.join(", "));
else pass("Fleet / finder / experience assets present", `${assetNames.size} bases`);

const regionCityLabels = indiaRegions.flatMap((r) =>
  r.cities.map((c) => `${c}, ${r.name}`),
);
const unmatchedCities = regionCityLabels.filter(
  (label) => !searchablePlaces.some((p) => p.label === label),
);
if (unmatchedCities.length)
  fail("Region city chips without searchable places", unmatchedCities.join("; "));
else pass("All region city chips map to searchable places");

const jaipur = findPlace("india-jaipur");
if (jaipur.label !== "Jaipur") fail("Jaipur pickup label", jaipur.label);
else pass("Jaipur pickup label", jaipur.label);

const manali = searchPlaces("Manali")[0];
if (!manali?.label.includes("Manali")) fail("Manali search");
else pass("Manali search works", manali.label);

const ratesOk = Object.values(vehicleRatesInr).every(
  (r) => r.from >= 8 && r.to <= 50 && r.from < r.to,
);
if (!ratesOk) fail("Vehicle INR per-km ranges look wrong", JSON.stringify(vehicleRatesInr));
else pass("Vehicle per-km ranges look market-sane");

const tourCountries = [...new Set(tours.map((t) => t.country))];
pass("Tours loaded", `${tours.length} tours · ${tourCountries.join(", ")}`);

console.log(JSON.stringify({ findings, counts: { places: searchablePlaces.length, regions: indiaRegions.length, tours: tours.length, fleet: fleet.length } }, null, 2));
const fails = findings.filter((f) => f.status === "FAIL");
process.exit(fails.length ? 1 : 0);
