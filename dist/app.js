import { tours, styles, articles, fleet, indiaExperiences } from "./data.js";
import { siteConfig } from "./site-config.js";
import {
  countryCurrency,
  vehicleRatesInr,
  packageApproxInr,
  indiaRegions,
  searchablePlaces,
  findPlace,
  searchPlaces,
} from "./destinations-data.js";
import {
  nextWeekendDeparture,
  formatWeekendRange,
} from "./weekend.js";
import { bindLeadTracking, trackLead } from "./analytics.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

bindLeadTracking();
const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const rates = { ...siteConfig.rates };
const savedIds = storage.get("gupta-saved-journeys", []);
let saved = new Set(
  Array.isArray(savedIds)
    ? savedIds.filter((id) => tours.some((tour) => tour.id === id))
    : [],
);
let currency = siteConfig.defaultCurrency || "INR";
if (!Object.hasOwn(rates, currency)) currency = "INR";
let state = {
  destination: "India",
  style: "all",
  month: "all",
  showAll: false,
  mode: "car",
  placeId: "india-anywhere",
  pickupId: "india-jaipur",
  vehicle: "ertiga",
  regionId: null,
};
let currencyFollowsCountry = true;
const vehicleImages = {
  sedan: "sedan",
  ertiga: "ertiga",
  innova: "innova",
  traveller: "traveller",
  urbania: "urbania",
};
let lastRequest = null;
let toastTimer;
const contentDialog = $("#content-dialog");
const plannerDialog = $("#planner-dialog");
const plannerForm = $("#planner-form");
const whatsappNumber = siteConfig.whatsappNumber;

function price(amount) {
  const converted = Math.round((amount * rates[currency]) / 10) * 10;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(converted);
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}
function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("dialog-open");
  dialog.scrollTop = 0;
}
function syncScrollLock() {
  document.body.classList.toggle("dialog-open", $$("dialog[open]").length > 0);
}
for (const dialog of [contentDialog, plannerDialog]) {
  $(".dialog-close", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", syncScrollLock);
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
}
function content(html) {
  $("#dialog-content").innerHTML = html;
  openDialog(contentDialog);
}
function photo(tour, className = "") {
  const sources =
    tour.image === "hero"
      ? "assets/hero-small.webp 960w, assets/hero.webp 1920w"
      : `assets/${tour.image}-small.webp 500w, assets/${tour.image}.webp 1000w`;
  const sizes =
    className === "dialog-hero"
      ? "(max-width:700px) calc(100vw - 32px), 800px"
      : "(max-width:700px) calc(100vw - 40px), (max-width:980px) 45vw, 400px";
  return `<img ${className ? `class="${className}"` : ""} src="assets/${tour.image}.webp" srcset="${sources}" sizes="${sizes}" alt="${escape(tour.alt)}" width="1000" height="750" loading="lazy" decoding="async">`;
}
function durationLabel(tour) {
  if (tour.nights === 0 && tour.days === 1) return "DAY TOUR";
  if (tour.nights === 0) return `${tour.days} DAYS`;
  return `${tour.days} DAYS · ${tour.nights} NIGHTS`;
}
function priceBasis(tour) {
  return tour.priceBasis === "vehicle" ? "sample vehicle day" : "per person";
}
function card(tour) {
  return `<article class="tour-card"><div class="tour-image">${photo(tour)}<span class="tour-tag">${styles[tour.style].toUpperCase()}</span><button class="favorite icon-button" data-save="${tour.id}" aria-label="${saved.has(tour.id) ? "Remove saved journey" : "Save"} ${escape(tour.title)}" aria-pressed="${saved.has(tour.id)}">${icon("heart")}</button></div><div class="tour-content"><p class="tour-region">${tour.region}<span>${durationLabel(tour)}</span></p><h3>${tour.title}</h3><p>${tour.tagline}</p><div class="tour-bottom"><p>Sample from <strong data-price="${tour.price}">${price(tour.price)}</strong><span>${priceBasis(tour)}</span></p><button class="tour-explore" data-tour="${tour.id}" aria-label="Explore ${escape(tour.title)}">${icon("arrow-up")}</button></div></div></article>`;
}
function matches() {
  const filtered = tours.filter(
    (tour) =>
      (state.destination === "all" || tour.country === state.destination) &&
      (state.style === "all" || tour.style === state.style) &&
      (state.month === "all" || tour.months.includes(Number(state.month))),
  );
  return filtered.sort((a, b) => {
    const aIndia = a.country === "India" ? 0 : 1;
    const bIndia = b.country === "India" ? 0 : 1;
    if (aIndia !== bIndia) return aIndia - bIndia;
    return 0;
  });
}
function renderTours() {
  const results = matches();
  const visible = state.showAll ? results : results.slice(0, 3);
  $("#tour-grid").innerHTML = visible.length
    ? visible.map(card).join("")
    : `<div class="empty-state">${icon("compass")}<h3>A different adventure is waiting.</h3><p>No example journeys match every choice. Try another month or travel style, or let us plan something personal.</p><button class="button primary" data-action="reset-filters">Explore all journeys ${icon("arrow")}</button></div>`;
  $("#results-count").textContent = results.length
    ? `${results.length} ${results.length === 1 ? "journey" : "journeys"} to inspire you`
    : "No matching journeys";
  const viewAll = $("#view-all-journeys");
  viewAll.hidden = results.length <= 3;
  viewAll.innerHTML = state.showAll
    ? `Show a few favourites ${icon("arrow-up")}`
    : `View all ${results.length} journeys ${icon("arrow-up")}`;
  const filters = $("#active-filters");
  const choices = [];
  if (state.destination !== "all") choices.push(state.destination);
  if (state.style !== "all") choices.push(styles[state.style]);
  if (state.month !== "all")
    choices.push(
      `${$("#search-month").selectedOptions[0].textContent} · suggested season`,
    );
  filters.hidden = !choices.length;
  filters.innerHTML = choices.length
    ? `<span>${choices.map(escape).join(" &nbsp; / &nbsp; ")}</span><button data-action="reset-filters">Clear filters</button>`
    : "";
  $$("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === state.style;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
function syncClearButtons() {
  const pickup = $("#pickup-search");
  const drop = $("#place-search");
  const pickupClear = $('[data-clear="pickup"]');
  const dropClear = $('[data-clear="drop"]');
  if (pickupClear) pickupClear.hidden = !String(pickup?.value || "").trim();
  if (dropClear) dropClear.hidden = !String(drop?.value || "").trim();
}
function resetFilters() {
  state = {
    destination: "India",
    style: "all",
    month: "all",
    showAll: false,
    mode: "car",
    placeId: "india-anywhere",
    pickupId: "india-jaipur",
    vehicle: "ertiga",
    regionId: null,
  };
  const drop = findPlace("india-anywhere");
  const pickup = findPlace("india-jaipur");
  $("#search-destination").value = "India";
  $("#search-place-id").value = drop.id;
  $("#search-pickup-id").value = pickup.id;
  $("#search-style").value = "all";
  $("#pickup-search").value = pickup.label;
  $("#place-search").value = drop.label;
  $("#search-month").value = "all";
  syncCurrencyForCountry(drop.countryCode, true);
  setTripMode("car");
  syncClearButtons();
  renderRegionRail();
  renderFinderResults();
  renderTours();
}
function scrollToJourneys() {
  $("#journeys").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}
function syncCurrencyForCountry(countryCode, force = false) {
  if (!currencyFollowsCountry && !force) return;
  const next = countryCurrency[countryCode] || siteConfig.defaultCurrency || "INR";
  if (!Object.hasOwn(rates, next)) return;
  currency = next;
  currencyFollowsCountry = true;
  storage.set("gupta-currency", currency);
  $("#currency").value = currency;
  $$("[data-price]").forEach((element) => {
    element.textContent = price(Number(element.dataset.price));
  });
  renderFinderResults();
}
function formatInrApprox(amountInr, { roundTo = 1 } = {}) {
  const inUsd = amountInr / (rates.INR || 85);
  const raw = inUsd * (rates[currency] || 1);
  const converted =
    roundTo > 1 ? Math.round(raw / roundTo) * roundTo : Math.round(raw);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(converted);
}
function setTripMode(mode) {
  state.mode = mode;
  $$(".mode-chip").forEach((chip) => {
    const active = chip.dataset.mode === mode;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  renderFinderResults();
}
function selectPickup(place) {
  state.pickupId = place.id;
  $("#search-pickup-id").value = place.id;
  $("#pickup-search").value = place.label;
  $("#pickup-suggestions").hidden = true;
  $("#pickup-search").setAttribute("aria-expanded", "false");
  syncClearButtons();
  renderFinderResults();
}
function selectPlace(place) {
  state.placeId = place.id;
  state.destination = place.filterCountry || place.country || "India";
  $("#search-destination").value = state.destination;
  $("#search-place-id").value = place.id;
  $("#place-search").value = place.label;
  $("#place-suggestions").hidden = true;
  $("#place-search").setAttribute("aria-expanded", "false");
  syncCurrencyForCountry(place.countryCode, true);
  syncClearButtons();
  renderFinderResults();
}
function renderSuggestions(listEl, inputEl, query, target) {
  const results = searchPlaces(query, { indiaOnly: true, limit: 16 });
  if (!results.length) {
    listEl.innerHTML =
      '<button type="button" disabled>Type any city or place in India</button>';
    listEl.hidden = false;
    inputEl.setAttribute("aria-expanded", "true");
    return;
  }
  listEl.innerHTML = results
    .map((place) => {
      const title = place.custom
        ? `Use “${escape(place.label)}”`
        : escape(place.label);
      const meta = place.custom
        ? "Any place in India"
        : `${escape(place.region)} · India`;
      return `<button type="button" role="option" data-${target}-id="${escape(place.id)}" data-place-label="${escape(place.label)}"><strong>${title}</strong><span class="place-meta">${meta}</span></button>`;
    })
    .join("");
  listEl.hidden = false;
  inputEl.setAttribute("aria-expanded", "true");
}
function renderRegionRail() {
  const chips = $("#region-chips");
  const cities = $("#region-cities");
  if (!chips || !cities) return;
  chips.innerHTML = indiaRegions
    .map(
      (region) =>
        `<button type="button" data-region="${escape(region.id)}" class="${state.regionId === region.id ? "active" : ""}">${escape(region.name)}</button>`,
    )
    .join("");
  const active = indiaRegions.find((region) => region.id === state.regionId);
  if (!active) {
    cities.hidden = true;
    cities.innerHTML = "";
    return;
  }
  cities.hidden = false;
  cities.innerHTML = active.cities
    .map(
      (city) =>
        `<button type="button" data-city-label="${escape(`${city}, ${active.name}`)}">${escape(city)}</button>`,
    )
    .join("");
}
function pickupLabel() {
  if (!state.pickupId) return "Choose pickup";
  return findPlace(state.pickupId).label;
}
function dropLabel() {
  return findPlace(state.placeId).label;
}
function routeSummary() {
  return `<p class="finder-route"><span>Pickup</span> <strong>${escape(pickupLabel())}</strong> <span>→ Drop</span> <strong>${escape(dropLabel())}</strong></p>`;
}
function placeVisual(place) {
  const region = String(place.region || "").toLowerCase();
  const label = String(place.label || "").toLowerCase();
  if (region.includes("delhi") || label.includes("delhi") || label.includes("noida") || label.includes("gurugram") || label.includes("gurgaon"))
    return "redfort";
  if (label.includes("manali") || label.includes("solang") || label.includes("himachal") || region.includes("himachal"))
    return "manali-hero";
  if (region.includes("rajasthan") || label.includes("jaipur") || label.includes("amber") || label.includes("udaipur") || label.includes("jodhpur") || label.includes("pushkar") || label.includes("ajmer"))
    return "amber";
  if (label.includes("agra") || label.includes("taj")) return "india";
  if (place.countryCode === "IN") return "india";
  return "hero";
}
function finderBrief() {
  const vehicle = vehicleRatesInr[state.vehicle]?.label || "Sedan";
  const trip =
    state.mode === "car"
      ? `Only car / km · preferred ${vehicle}`
      : "Full package with itinerary";
  return `Pickup: ${pickupLabel()}. Drop: ${dropLabel()}. ${trip}. Please share an approx quote for my dates and budget.`;
}
function renderFinderResults() {
  const root = $("#finder-results");
  if (!root) return;
  const place = findPlace(state.placeId);
  const hostCta = $("#finder-host-cta");
  if (hostCta) {
    hostCta.dataset.planFocus = `India — ${pickupLabel()} to ${dropLabel()}`;
  }
  if (state.mode === "car") {
    const selected = vehicleRatesInr[state.vehicle] || vehicleRatesInr.sedan;
    root.innerHTML = `<article class="finder-card">
      <h3>Only car · approx per km</h3>
      ${routeSummary()}
      <p>Indicative outstation ranges. Tolls, parking, state tax, driver allowance and minimum km/day are confirmed by our host — never locked before conversation.</p>
      <div class="vehicle-rate-grid">
        ${Object.entries(vehicleRatesInr)
          .map(([id, rate]) => {
            const image = vehicleImages[id] || "sedan";
            return `<button type="button" class="vehicle-rate ${state.vehicle === id ? "active" : ""}" data-vehicle="${id}">
              <span class="vehicle-rate-photo"><img src="assets/${image}.webp" srcset="assets/${image}-small.webp 560w, assets/${image}.webp 1200w" sizes="180px" width="320" height="200" alt="${escape(rate.label)}" loading="lazy" decoding="async" /></span>
              <span class="vehicle-rate-body">
                <strong>${escape(rate.label)}</strong>
                <em>≈ ${formatInrApprox(rate.from)}–${formatInrApprox(rate.to)}/km</em>
                <small>${escape(rate.seats)}</small>
              </span>
            </button>`;
          })
          .join("")}
      </div>
      <p class="finder-price">Selected: ${escape(selected.label)} · approx ${formatInrApprox(selected.from)}–${formatInrApprox(selected.to)} / km
        <span>Not a final fare. After talking with our host, your quote is adjusted to route, dates, and budget.</span>
      </p>
    </article>`;
    return;
  }
  const band = packageApproxInr[place.packageType] || packageApproxInr.short;
  const visual = placeVisual(place);
  root.innerHTML = `<article class="finder-card">
    <h3>Full package with itinerary</h3>
    ${routeSummary()}
    <div class="package-visual">
      <img src="assets/${visual}.webp" srcset="assets/${visual}-small.webp 560w, assets/${visual}.webp 1200w" sizes="(max-width:700px) 92vw, 220px" width="440" height="300" alt="${escape(place.label)}" loading="lazy" decoding="async" />
      <div>
        <p>Approx planning range for this route — stays, pacing, and inclusions shaped with you. Guidance only, not a locked tariff.</p>
        <p class="finder-price">Approx from ${formatInrApprox(band.from, { roundTo: 10 })} – ${formatInrApprox(band.to, { roundTo: 10 })}
          <span>${escape(band.unit)} · final price after host conversation for your dates and budget</span>
        </p>
      </div>
    </div>
  </article>
  <article class="finder-card">
    <h3>Prefer only the car?</h3>
    <p>Switch to <strong>Only car / km</strong> to compare sedan, Ertiga, Innova, Traveller and Urbania with photos and approx per-km ranges.</p>
  </article>`;
}
function resolveTypedPlace(inputValue, fallbackId) {
  const typed = String(inputValue || "").trim();
  if (!typed) return findPlace(fallbackId || "india-anywhere");
  const exact = searchablePlaces.find(
    (place) =>
      place.countryCode === "IN" &&
      place.label.toLowerCase() === typed.toLowerCase(),
  );
  if (exact) return exact;
  const suggested = searchPlaces(typed, { indiaOnly: true, limit: 8 }).find(
    (place) => !place.custom,
  );
  // Accept any typed Indian place — never block free-text routes.
  return suggested && suggested.label.toLowerCase().startsWith(typed.toLowerCase())
    ? suggested
    : findPlace(typed);
}
$("#journey-search").addEventListener("submit", (event) => {
  event.preventDefault();
  const pickup = resolveTypedPlace(pickupSearch?.value, state.pickupId || "india-jaipur");
  const place = resolveTypedPlace(placeSearch?.value, state.placeId || "india-anywhere");
  selectPickup(pickup);
  selectPlace(place);
  state = {
    ...state,
    destination: place.filterCountry || "India",
    style: "all",
    month: $("#search-month").value,
    showAll: true,
  };
  $("#search-destination").value = state.destination;
  renderFinderResults();
  renderTours();
  const panel = $("#finder-panel") || $("#trip-finder");
  panel?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
});
$("#view-all-journeys").addEventListener("click", () => {
  state.showAll = !state.showAll;
  renderTours();
});
$("#all-destinations").addEventListener("click", (event) => {
  const expanded = $(".destination-grid").classList.toggle("expanded");
  $$(".extra-destination").forEach((card) => {
    card.hidden = !expanded;
  });
  event.currentTarget.setAttribute("aria-expanded", String(expanded));
  event.currentTarget.innerHTML = `${expanded ? "A few favourite destinations" : "Explore all destinations"} ${icon("arrow-up")}`;
});
function updateSavedUI() {
  $("#saved-count").textContent = saved.size;
  $("#saved-count").hidden = !saved.size;
  $(".saved-button").setAttribute(
    "aria-label",
    `Saved journeys${saved.size ? `, ${saved.size} saved` : ""}`,
  );
  $$("[data-save]").forEach((button) => {
    const isSaved = saved.has(button.dataset.save);
    const tour = tours.find((item) => item.id === button.dataset.save);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute(
      "aria-label",
      `${isSaved ? "Remove saved journey" : "Save"} ${tour?.title || "journey"}`,
    );
  });
}
function toggleSave(id) {
  const tour = tours.find((item) => item.id === id);
  if (!tour) return;
  if (saved.has(id)) {
    saved.delete(id);
    showToast("Journey removed from your favourites.");
  } else {
    saved.add(id);
    showToast("A little inspiration, saved for later.");
  }
  const persisted = storage.set("gupta-saved-journeys", [...saved]);
  if (!persisted)
    showToast(
      "Saved for this visit. Your browser could not keep it for later.",
    );
  updateSavedUI();
  if ($("#saved-list")) openSaved();
}
function openSaved() {
  const list = tours.filter((tour) => saved.has(tour.id));
  content(
    `<div class="dialog-inner"><p class="eyebrow">KEEP THE DREAMING GOING</p><h2 id="dialog-title">Your saved <em>journeys.</em></h2><p>A few places to come back to. Favourites are stored in this browser when available.</p><div id="saved-list" class="saved-list">${list.length ? list.map((tour) => `<article class="saved-item">${photo(tour)}<div><h3>${tour.title}</h3><p>${tour.days} days · Sample ${price(tour.price)} per person</p><button data-tour="${tour.id}">Explore journey ↗</button></div><button class="icon-button" data-save="${tour.id}" aria-label="Remove ${escape(tour.title)} from saved journeys">${icon("close")}</button></article>`).join("") : `<div class="empty-state">${icon("heart")}<h3>Your next chapter is still unwritten.</h3><p>Tap the heart on a journey to keep it here while you explore.</p><button class="button primary" data-action="close-and-explore">Explore journeys ${icon("arrow")}</button></div>`}</div></div>`,
  );
}
function openTour(id) {
  const tour = tours.find((item) => item.id === id);
  if (!tour) return;
  content(
    `${photo(tour, "dialog-hero")}<div class="dialog-inner"><p class="eyebrow">${tour.region} · ${styles[tour.style].toUpperCase()}</p><h2 id="dialog-title">${tour.title}</h2><p>${tour.description}</p><div class="dialog-facts"><span>${icon("clock")}${durationLabel(tour)}</span><span>${icon("pin")}${tour.route}</span></div><div class="detail-price"><p>Illustrative starting price, ${priceBasis(tour)}<strong data-price="${tour.price}">${price(tour.price)}</strong>Final quote depends on your dates, group, and choices.</p><button class="button primary" data-plan-tour="${tour.id}">${tour.country === "India" ? "Enquire on WhatsApp" : "Make this journey mine"} ${icon("arrow-up")}</button></div><h3>Your journey, at a glance</h3><ol class="detail-itinerary">${tour.itinerary.map(([day, detail]) => `<li><strong>${day}</strong><span>${detail}</span></li>`).join("")}</ol><div class="detail-columns"><section><h3>Example inclusions</h3><ul>${tour.included.map((item) => `<li>${item}</li>`).join("")}</ul></section><section><h3>Not included</h3><ul>${tour.excluded.map((item) => `<li>${item}</li>`).join("")}</ul></section></div><p class="form-notice">This is an illustrative itinerary, not a live bookable offer. Availability, accessibility, accommodation, inclusions, cancellation terms, and a final price must be confirmed in writing before booking. Month filters indicate suggested seasons, not guaranteed availability.</p></div>`,
  );
}
function openArticle(id) {
  const article = articles[id];
  if (!article) return;
  content(
    `<img class="dialog-hero" src="assets/${article.image}.webp" alt="${escape(article.alt)}" width="1000" height="550"><div class="dialog-inner article-dialog"><p class="eyebrow">${article.category}</p><h2 id="dialog-title">${article.title}</h2><p><em>${article.subtitle}</em></p><article>${article.body}</article><button class="button primary" data-action="plan" style="margin-top:25px">Plan a journey like this ${icon("arrow-up")}</button></div>`,
  );
}
const privacyHtml = `<div class="dialog-inner"><p class="eyebrow">YOUR DETAILS, HANDLED WITH CARE</p><h2 id="dialog-title">Privacy <em>information.</em></h2><p>This site uses Google Analytics 4 with anonymized IP addresses to understand visits and whether enquiry actions (WhatsApp, book form, itinerary PDF) are used. Display currency and saved journey IDs are stored in your browser when local storage is available.</p><h3>Your travel enquiry</h3><p>The planner prepares a WhatsApp message with the details you enter. Preparing a message does not send it. If you choose “Open WhatsApp to send”, those details are passed to WhatsApp in a link; you can review the message and choose whether to send it. WhatsApp's own privacy terms apply when you open its service.</p><p>Your name, email (if provided), country, optional phone, and travel preferences are kept in this page's memory while you plan. Your enquiry is saved in this browser only if you choose the optional save checkbox. You can also download a copy to your device.</p><h3>Your choices</h3><p>To remove a locally saved request, use the button below. Saved journey favourites can be removed using their heart buttons. You can clear all site data through your browser settings. Avoid saving personal information on a shared device.</p><button class="button outline" data-action="delete-request" style="margin-top:20px">Delete saved travel request</button><p>A final business privacy policy, business contact details, retention terms, and any future data-processing services must be confirmed before public launch.</p></div>`;
function openPrivacy() {
  content(privacyHtml);
}
function openTerms() {
  content(
    `<div class="dialog-inner"><p class="eyebrow">A FEW IMPORTANT DETAILS</p><h2 id="dialog-title">Before you <em>book.</em></h2><h3>Example journeys and prices</h3><p>All itineraries, inclusions, and prices shown on this website are illustrative examples for this preview. They are not live offers or a guarantee of availability. Prices are shown per person based on the example accommodation arrangements. Currency conversions use fixed demonstration rates: ${escape(rateSummary())}. These are not current exchange rates, payment rates, or binding quotations.</p><h3>Your personal proposal</h3><p>A written proposal should confirm your exact dates, traveller details, accommodations, transfers, accessibility needs, inclusions, exclusions, taxes, total price, payment schedule, cancellation terms, and the business's booking conditions.</p><h3>Enquiry and confirmation</h3><p>The trip planner prepares a WhatsApp enquiry for you to review and send${siteConfig.enquiryEmail ? ", with an optional email copy" : ""}. No payment is taken on this website. An enquiry does not confirm any booking. Do not make non-refundable arrangements until the relevant provider has confirmed your trip and terms in writing.</p><h3>Travel requirements</h3><p>International flights, visas, insurance, and personal expenses are excluded unless clearly stated in the final quote. Check official government and embassy guidance for entry rules, passport requirements, health requirements, and travel advice for your nationality and dates.</p><h3>Response hours</h3><p>We typically respond during ${escape(siteConfig.supportHours)}. Messages outside these hours are reviewed on the next working day.</p></div>`,
  );
}
async function openCredits() {
  content(
    `<div class="dialog-inner"><p class="eyebrow">THE PEOPLE BEHIND THE PICTURES</p><h2 id="dialog-title">Photo <em>credits.</em></h2><p id="credit-status" role="status">Loading photography credits…</p><ul id="credits-list" class="credits-list"></ul></div>`,
  );
  try {
    const response = await fetch("assets/credits.json");
    if (!response.ok) throw new Error("Could not load credits");
    const raw = await response.json();
    const items = Array.isArray(raw)
      ? raw
      : raw.images || raw.assets || Object.values(raw);
    $("#credit-status").textContent =
      "Destination photographs are locally hosted and resized to WebP. Original authors and licences are listed below.";
    $("#credits-list").innerHTML = items
      .map(
        (item) =>
          `<li><strong>${escape(item.title || item.name || item.file || item.filename || "Destination photograph")}</strong><br>${escape(item.author || item.artist || "See original source for author")}<br>${item.source || item.sourceUrl || item.source_url ? `<a href="${escape(item.source || item.sourceUrl || item.source_url)}" target="_blank" rel="noopener noreferrer">Original photograph ↗</a><br>` : ""}${escape(item.license || item.licence || "")}${item.licenseUrl || item.license_url ? ` · <a href="${escape(item.licenseUrl || item.license_url)}" target="_blank" rel="noopener noreferrer">Licence terms ↗</a>` : ""}${item.changes ? `<br>${escape(item.changes)}` : ""}</li>`,
      )
      .join("");
  } catch {
    if ($("#credit-status"))
      $("#credit-status").textContent =
        "Credits could not be loaded. Please try again. Full original-photo author and licence details are also included in the project’s ASSETS.md.";
  }
}
function rateSummary() {
  return `1 USD = ${rates.INR} INR = ${rates.GBP} GBP = ${rates.EUR} EUR (as of ${siteConfig.ratesAsOf})`;
}
function currencyInfo() {
  content(
    `<div class="dialog-inner"><p class="eyebrow">SIMPLE, TRANSPARENT PRICE DISPLAY</p><h2 id="dialog-title">A note on <em>currencies.</em></h2><p>You can explore sample prices in USD, INR, GBP, or EUR using the selector in the header. Every price is labelled with its currency code and is indicative only.</p><p>This preview uses fixed demonstration rates: ${escape(rateSummary())}. Display prices are rounded to the nearest 10 in the selected currency.</p><p>${escape(siteConfig.ratesNote)}</p><p>Changing the display currency here does not change a confirmed quote.</p></div>`,
  );
}
$("#currency").value = currency;
$("#currency").addEventListener("change", (event) => {
  currency = event.target.value;
  currencyFollowsCountry = false;
  storage.set("gupta-currency", currency);
  $$("[data-price]").forEach((element) => {
    element.textContent = price(Number(element.dataset.price));
  });
  renderFinderResults();
  showToast(`Indicative prices now shown in ${currency}.`);
});
const pickupSearch = $("#pickup-search");
const pickupSuggestions = $("#pickup-suggestions");
const placeSearch = $("#place-search");
const placeSuggestions = $("#place-suggestions");

function wireCombobox(input, list, target, onSelect) {
  if (!input || !list) return;
  input.addEventListener("focus", () => {
    renderSuggestions(list, input, input.value, target);
  });
  input.addEventListener("input", () => {
    if (target === "pickup" || target === "drop") syncClearButtons();
    else syncPlannerClearButtons();
    if (target.startsWith("planner")) syncPlannerDestination();
    renderSuggestions(list, input, input.value, target);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const typed = String(input.value || "").trim();
      if (!typed) return;
      const place = resolveTypedPlace(typed, typed);
      if (typeof onSelect === "function") onSelect(place);
      else if (target === "pickup") selectPickup(place);
      else selectPlace(place);
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
  list.addEventListener("click", (event) => {
    const button = event.target.closest(`[data-${target}-id]`);
    if (!button) return;
    const label =
      button.getAttribute("data-place-label") ||
      button.getAttribute(`data-${target}-id`);
    const place = findPlace(label);
    if (typeof onSelect === "function") onSelect(place);
    else if (target === "pickup") selectPickup(place);
    else selectPlace(place);
  });
}
wireCombobox(pickupSearch, pickupSuggestions, "pickup");
wireCombobox(placeSearch, placeSuggestions, "drop");

const plannerPickup = $("#planner-pickup");
const plannerPickupSuggestions = $("#planner-pickup-suggestions");
const plannerDrop = $("#planner-drop");
const plannerDropSuggestions = $("#planner-drop-suggestions");
wireCombobox(
  plannerPickup,
  plannerPickupSuggestions,
  "planner-pickup",
  (place) => {
    plannerPickup.value = place.label;
    plannerPickupSuggestions.hidden = true;
    plannerPickup.setAttribute("aria-expanded", "false");
    syncPlannerDestination();
  },
);
wireCombobox(plannerDrop, plannerDropSuggestions, "planner-drop", (place) => {
  plannerDrop.value = place.label;
  plannerDropSuggestions.hidden = true;
  plannerDrop.setAttribute("aria-expanded", "false");
  syncPlannerDestination();
});

$$("[data-clear]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const which = button.dataset.clear;
    if (which === "pickup") {
      pickupSearch.value = "";
      state.pickupId = "";
      $("#search-pickup-id").value = "";
      pickupSearch.focus();
      renderSuggestions(pickupSuggestions, pickupSearch, "", "pickup");
      syncClearButtons();
      renderFinderResults();
    } else if (which === "drop") {
      placeSearch.value = "";
      state.placeId = "india-anywhere";
      $("#search-place-id").value = "india-anywhere";
      $("#search-destination").value = "India";
      placeSearch.focus();
      renderSuggestions(placeSuggestions, placeSearch, "", "drop");
      syncClearButtons();
      renderFinderResults();
    } else if (which === "planner-pickup") {
      plannerPickup.value = "";
      plannerPickup.focus();
      renderSuggestions(plannerPickupSuggestions, plannerPickup, "", "planner-pickup");
      syncPlannerDestination();
    } else if (which === "planner-drop") {
      plannerDrop.value = "";
      plannerDrop.focus();
      renderSuggestions(plannerDropSuggestions, plannerDrop, "", "planner-drop");
      syncPlannerDestination();
    }
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest('[data-combobox="pickup"]')) {
    if (pickupSuggestions) {
      pickupSuggestions.hidden = true;
      pickupSearch?.setAttribute("aria-expanded", "false");
    }
  }
  if (!event.target.closest('[data-combobox="drop"]')) {
    if (placeSuggestions) {
      placeSuggestions.hidden = true;
      placeSearch?.setAttribute("aria-expanded", "false");
    }
  }
  if (!event.target.closest('[data-combobox="planner-pickup"]')) {
    if (plannerPickupSuggestions) {
      plannerPickupSuggestions.hidden = true;
      plannerPickup?.setAttribute("aria-expanded", "false");
    }
  }
  if (!event.target.closest('[data-combobox="planner-drop"]')) {
    if (plannerDropSuggestions) {
      plannerDropSuggestions.hidden = true;
      plannerDrop?.setAttribute("aria-expanded", "false");
    }
  }
});
$$(".mode-chip").forEach((chip) => {
  chip.addEventListener("click", () => setTripMode(chip.dataset.mode));
});
$("#region-chips").addEventListener("click", (event) => {
  const button = event.target.closest("[data-region]");
  if (!button) return;
  state.regionId =
    state.regionId === button.dataset.region ? null : button.dataset.region;
  renderRegionRail();
});
$("#region-cities").addEventListener("click", (event) => {
  const button = event.target.closest("[data-city-label]");
  if (!button) return;
  const place =
    searchablePlaces.find((item) => item.label === button.dataset.cityLabel) ||
    findPlace("india-anywhere");
  selectPlace(place);
  showToast(`${place.label} selected — operated from Jaipur, routes across India.`);
});
$("#finder-results").addEventListener("click", (event) => {
  const vehicle = event.target.closest("[data-vehicle]");
  if (!vehicle) return;
  state.vehicle = vehicle.dataset.vehicle;
  renderFinderResults();
});
const supportHours = $("#support-hours");
if (supportHours) {
  const emailBit = siteConfig.enquiryEmail
    ? ` · ${siteConfig.enquiryEmail}`
    : "";
  supportHours.textContent = `Enquiries: ${siteConfig.supportHours} · English${emailBit}`;
}
const phoneTel = siteConfig.phoneTel || `+${whatsappNumber}`;
const phoneDisplay = siteConfig.phoneDisplay || siteConfig.whatsappDisplay;
const callFloat = $("#call-float");
if (callFloat) {
  callFloat.href = `tel:${phoneTel}`;
  callFloat.setAttribute(
    "aria-label",
    `Call ${siteConfig.businessName} at ${phoneDisplay}`,
  );
}
const whatsappFloat = $("#whatsapp-float");
if (whatsappFloat) {
  whatsappFloat.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${siteConfig.businessName}! I would like to plan a trip.`)}`;
}
$$('a[href^="https://wa.me/"]').forEach((link) => {
  if (link.id === "whatsapp-float") return;
  if (link.textContent.includes("96029") || link.textContent.includes("WhatsApp")) {
    link.href = `https://wa.me/${whatsappNumber}`;
    const label = link.querySelector(".footer-social-label");
    if (label) label.textContent = `WhatsApp ${siteConfig.whatsappDisplay}`;
    else if (!link.querySelector(".icon")) {
      link.textContent = `WhatsApp ${siteConfig.whatsappDisplay} ↗`;
    }
  }
});
$$('a[href^="tel:"]').forEach((link) => {
  link.href = `tel:${phoneTel}`;
  const label = link.querySelector(".footer-social-label");
  if (label) label.textContent = `Call ${phoneDisplay}`;
});

function setFooterSocial(link, href, labelText) {
  if (!link || !href) return;
  link.href = href;
  const label = link.querySelector(".footer-social-label");
  if (label) label.textContent = labelText;
}

setFooterSocial(
  $("#footer-call"),
  `tel:${phoneTel}`,
  `Call ${phoneDisplay}`,
);
setFooterSocial(
  $("#footer-email"),
  siteConfig.enquiryEmail ? `mailto:${siteConfig.enquiryEmail}` : "",
  siteConfig.enquiryEmail ? `Email ${siteConfig.enquiryEmail}` : "",
);
setFooterSocial(
  $("#footer-instagram"),
  siteConfig.instagramUrl,
  `Instagram ${siteConfig.instagramHandle}`,
);
setFooterSocial(
  $("#footer-linkedin"),
  siteConfig.linkedinUrl,
  siteConfig.linkedinLabel,
);

$$(".footer-social-chip").forEach((chip) => {
  const label = (chip.getAttribute("aria-label") || "").toLowerCase();
  if (label.includes("call") || label.startsWith("call ")) {
    chip.href = `tel:${phoneTel}`;
    chip.setAttribute("aria-label", `Call ${phoneDisplay}`);
  } else if (label.includes("email") && siteConfig.enquiryEmail) {
    chip.href = `mailto:${siteConfig.enquiryEmail}`;
    chip.setAttribute("aria-label", `Email ${siteConfig.enquiryEmail}`);
  } else if (label.includes("whatsapp")) {
    chip.href = `https://wa.me/${whatsappNumber}`;
  } else if (label.includes("instagram") && siteConfig.instagramUrl) {
    chip.href = siteConfig.instagramUrl;
  } else if (label.includes("linkedin") && siteConfig.linkedinUrl) {
    chip.href = siteConfig.linkedinUrl;
  }
});

function setStep(step) {
  for (const index of [1, 2]) {
    const fieldset = $(index === 1 ? "#planner-step-one" : "#planner-step-two");
    fieldset.hidden = index !== step;
    fieldset.disabled = index !== step;
  }
  $("#step-one-marker").classList.toggle("current", step === 1);
  $("#step-two-marker").classList.toggle("current", step === 2);
  const firstInput = $(
    "input, select, textarea",
    $(step === 1 ? "#planner-step-one" : "#planner-step-two"),
  );
  if (plannerDialog.open) firstInput.focus({ preventScroll: true });
}
function syncPlannerDestination() {
  const pickup = String(plannerForm.elements.pickup?.value || "").trim();
  const drop = String(plannerForm.elements.drop?.value || "").trim();
  const route =
    pickup && drop
      ? `${pickup} → ${drop}`
      : pickup || drop || "India — travel anywhere from Jaipur";
  if (plannerForm.elements.destination) {
    plannerForm.elements.destination.value = route;
  }
  syncPlannerClearButtons();
  return route;
}
function syncPlannerClearButtons() {
  const pickupClear = $('[data-clear="planner-pickup"]');
  const dropClear = $('[data-clear="planner-drop"]');
  if (pickupClear)
    pickupClear.hidden = !String(plannerForm.elements.pickup?.value || "").trim();
  if (dropClear)
    dropClear.hidden = !String(plannerForm.elements.drop?.value || "").trim();
}
function setPlannerRoute(pickupLabelValue, dropLabelValue) {
  if (plannerForm.elements.pickup)
    plannerForm.elements.pickup.value = pickupLabelValue || "";
  if (plannerForm.elements.drop)
    plannerForm.elements.drop.value = dropLabelValue || "";
  syncPlannerDestination();
}
function setPlannerDestination(value) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();
  const finderPickup = pickupLabel() === "Choose pickup" ? "Jaipur" : pickupLabel();
  const finderDrop = dropLabel();

  if (!raw) {
    setPlannerRoute(finderPickup, finderDrop);
    return;
  }
  if (lower.includes("→")) {
    const [from, to] = raw.split("→").map((part) => part.trim());
    setPlannerRoute(from || "Jaipur", to || finderDrop);
    return;
  }
  if (lower.includes(" to ")) {
    const cleaned = raw.replace(/^india\s*[—-]\s*/i, "");
    const [from, to] = cleaned.split(/\s+to\s+/i).map((part) => part.trim());
    if (from && to) {
      setPlannerRoute(from, to);
      return;
    }
  }
  if (lower.includes("jaipur") && lower.includes("sight")) {
    setPlannerRoute("Jaipur", "Jaipur");
    return;
  }
  if (lower.includes("delhi") && lower.includes("sight")) {
    setPlannerRoute("Delhi / New Delhi", "Delhi / New Delhi");
    return;
  }
  if (
    lower.includes("delhi") &&
    (lower.includes("jaipur") || lower.includes("↔") || lower.includes("<->"))
  ) {
    setPlannerRoute("Jaipur", "Delhi / New Delhi");
    return;
  }
  if (
    lower.includes("intercity") ||
    lower.includes("only car") ||
    lower.includes("/ km") ||
    lower.includes("cab") ||
    lower.includes("vehicle") ||
    lower.includes("travel anywhere") ||
    lower.includes("package") ||
    lower.includes("rajasthan") ||
    lower.includes("hills") ||
    lower.includes("golden")
  ) {
    setPlannerRoute(finderPickup || "Jaipur", finderDrop || "India · travel anywhere");
    return;
  }
  if (
    ["japan", "bali", "italy", "switzerland", "kenya"].some((place) =>
      lower.includes(place),
    )
  ) {
    const place = findPlace(
      searchablePlaces.find((item) =>
        item.label.toLowerCase().includes(lower.split("—").pop().trim()),
      )?.id || raw,
    );
    setPlannerRoute("Jaipur", place.label || raw.replace(/^India\s*[—-]\s*/i, ""));
    return;
  }
  if (lower.startsWith("india")) {
    setPlannerRoute(finderPickup || "Jaipur", finderDrop || "India · travel anywhere");
    return;
  }
  setPlannerRoute("Jaipur", raw);
}
function appendPlannerNote(note) {
  if (!plannerForm.elements.notes || !note) return;
  const current = plannerForm.elements.notes.value.trim();
  if (current.includes(note)) return;
  const withoutBrief = current
    .replace(
      /Pickup:\s*.*?Please share an approx quote for my dates and budget\.?/gis,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
  plannerForm.elements.notes.value = [withoutBrief, note]
    .filter(Boolean)
    .join(" ");
}
function openPlanner(tourId, focus) {
  if (contentDialog.open) contentDialog.close();
  const tour = tours.find((item) => item.id === tourId);
  if (tour) {
    if (tour.country === "India") {
      if (tour.id === "jaipur-day") setPlannerDestination("India — Jaipur sightseeing");
      else if (tour.id === "delhi-day")
        setPlannerDestination("India — Delhi sightseeing");
      else if (tour.id === "delhi-jaipur")
        setPlannerDestination("India — Jaipur to Delhi / New Delhi");
      else setPlannerDestination("India — travel anywhere from Jaipur");
    } else setPlannerDestination(tour.country);
  } else if (focus === "India" || focus?.startsWith?.("India")) {
    setPlannerDestination(
      typeof focus === "string" && focus.startsWith("India")
        ? focus
        : "India — travel anywhere from Jaipur",
    );
  } else {
    setPlannerDestination("");
  }
  syncPlannerDestination();
  if ($("#planner-success").hidden === false) {
    $("#planner-success").hidden = true;
    plannerForm.hidden = false;
    $(".planner-progress").hidden = false;
  }
  setStep(1);
  openDialog(plannerDialog);
}
function renderIndiaServices() {
  const fleetGrid = $("#fleet-grid");
  const experienceGrid = $("#india-experience-grid");
  if (!fleetGrid || !experienceGrid) return;
  fleetGrid.innerHTML = fleet
    .map(
      (vehicle) => `<article class="fleet-card">
        <div class="fleet-image">
          <img src="assets/${vehicle.image}.webp" srcset="assets/${vehicle.image}-small.webp 560w, assets/${vehicle.image}.webp 1200w" sizes="(max-width:700px) 80vw, 220px" width="640" height="420" loading="lazy" decoding="async" alt="${escape(vehicle.alt)}" />
        </div>
        <div class="fleet-copy">
          <p class="fleet-model">${escape(vehicle.model)}</p>
          <h4>${escape(vehicle.name)}</h4>
          <p>${escape(vehicle.seats)}</p>
          <p class="fleet-best">${escape(vehicle.bestFor)}</p>
          <button class="text-link" data-action="plan" data-plan-focus="India — Intercity cab / per km" data-vehicle="${escape(vehicle.name)}">Request this vehicle ${icon("arrow-up")}</button>
        </div>
      </article>`,
    )
    .join("");
  experienceGrid.innerHTML = indiaExperiences
    .map(
      (item) => `<article class="india-experience">
        <img src="assets/${item.image}.webp" srcset="assets/${item.image}-small.webp 560w, assets/${item.image}.webp 1200w" sizes="(max-width:700px) 90vw, 360px" width="900" height="600" loading="lazy" decoding="async" alt="${escape(item.alt)}" />
        <div>
          <h3>${escape(item.title)}</h3>
          <p>${escape(item.tagline)}</p>
          <ul>${item.points.map((point) => `<li>${escape(point)}</li>`).join("")}</ul>
          <button class="button outline" data-action="plan" data-plan-focus="${item.id === "jaipur-sightseeing" ? "India — Jaipur sightseeing" : item.id === "delhi-sightseeing" ? "India — Delhi sightseeing" : "India — Intercity cab / per km"}">Enquire on WhatsApp ${icon("arrow-up")}</button>
        </div>
      </article>`,
    )
    .join("");
}
$("#planner-next").addEventListener("click", () => {
  syncPlannerDestination();
  const fields = $$("input,select,textarea", $("#planner-step-one")).filter(
    (field) => field.type !== "hidden",
  );
  for (const field of fields) {
    if (!field.reportValidity()) return;
  }
  setStep(2);
});
$("#planner-back").addEventListener("click", () => setStep(1));
$("#planner-privacy").addEventListener("click", openPrivacy);
const localDate = new Date();
const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
plannerForm.elements.departure.min = today;
function requestText(request) {
  const routeLine =
    request.pickup || request.drop
      ? `Pickup: ${request.pickup || "—"}\nDrop: ${request.drop || "—"}`
      : `Destination: ${request.destination || "—"}`;
  return `Hello Gupta Ji Tour & Travels! I would like to plan a journey.\n\n${routeLine}\nPreferred departure: ${request.departure}\nTravellers: ${request.travellers}\n\nName: ${request.name}\nCountry of residence: ${request.country}${request.email ? `\nEmail: ${request.email}` : ""}${request.phone ? `\nPhone: ${request.phone}` : ""}${request.notes ? `\n\nWhat would make this trip special:\n${request.notes}` : ""}\n\nPlease help me with a personal itinerary, availability, and a final quote. I understand this is an enquiry, not a confirmed booking.`;
}
function whatsappUrl(request) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(requestText(request))}`;
}
function mailtoUrl(request) {
  if (!siteConfig.enquiryEmail) return "";
  const subject = encodeURIComponent(
    `Travel enquiry — ${request.destination} — ${request.name}`,
  );
  const body = encodeURIComponent(requestText(request));
  return `mailto:${siteConfig.enquiryEmail}?subject=${subject}&body=${body}`;
}
function downloadRequest() {
  if (!lastRequest) return;
  const blob = new Blob(
    [
      `TRAVEL ENQUIRY — ${siteConfig.businessName.toUpperCase()}\n\n${requestText(lastRequest)}\n\nPrepared locally. To contact Gupta Ji, open WhatsApp and tap Send.\nBusiness WhatsApp: ${siteConfig.whatsappDisplay}${siteConfig.enquiryEmail ? `\nEmail: ${siteConfig.enquiryEmail}` : ""}\n`,
    ],
    { type: "text/plain;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-gupta-ji-travel-enquiry.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  syncPlannerDestination();
  if (!plannerForm.reportValidity()) return;
  lastRequest = Object.fromEntries(
    [
      "pickup",
      "drop",
      "destination",
      "departure",
      "travellers",
      "notes",
      "name",
      "email",
      "country",
      "phone",
    ].map((key) => [key, String(plannerForm.elements[key].value || "").trim()]),
  );
  if (!lastRequest.name || !lastRequest.country) {
    showToast("Please enter your name and country.");
    return;
  }
  const saveLocally = plannerForm.elements.consent.checked;
  const didSave =
    saveLocally &&
    storage.set("gupta-travel-request", {
      ...lastRequest,
      preparedAt: new Date().toISOString(),
    });
  trackLead({ method: "planner_form", cta: "prepare_enquiry" });
  plannerForm.hidden = true;
  $(".planner-progress").hidden = true;
  const success = $("#planner-success");
  success.hidden = false;
  const emailLink = mailtoUrl(lastRequest)
    ? `<a class="button outline" href="${escape(mailtoUrl(lastRequest))}">Email a copy of my enquiry ${icon("arrow-up")}</a>`
    : "";
  success.innerHTML = `<div class="planner-success-content"><div class="success-symbol">${icon("check")}</div><h3>Your next chapter is taking shape.</h3><p>Your enquiry is ready. Open WhatsApp, review your message, and tap <strong>Send</strong> to contact ${escape(siteConfig.businessName)}. Nothing has been sent yet, and no booking is confirmed.</p><div class="request-summary"><p><span>Pickup</span><strong>${escape(lastRequest.pickup || "—")}</strong></p><p><span>Drop</span><strong>${escape(lastRequest.drop || lastRequest.destination || "—")}</strong></p><p><span>Preferred departure</span><strong>${escape(lastRequest.departure)}</strong></p><p><span>Travellers</span><strong>${escape(lastRequest.travellers)}</strong></p><p><span>Name</span><strong>${escape(lastRequest.name)}</strong></p></div><a class="button primary" href="${escape(whatsappUrl(lastRequest))}" target="_blank" rel="noopener noreferrer">Open WhatsApp to send ${icon("arrow-up")}</a>${emailLink}<button class="inline-link" data-action="download-request">Download a copy of my enquiry</button><button class="inline-link" data-action="edit-request">Edit my details</button><p style="font-size:10px;margin-top:18px">${saveLocally ? (didSave ? "A copy was also saved in this browser, as you requested." : "Your browser could not save a copy. You can download it instead.") : "Your personal details have not been saved in browser storage."} Typical reply window: ${escape(siteConfig.supportHours)}.</p></div>`;
  plannerDialog.scrollTop = 0;
  $(".planner-success-content a", success).focus({ preventScroll: true });
});
const menuToggle = $("#menu-toggle");
function closeMenu() {
  $("#mobile-nav").hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
}
menuToggle.addEventListener("click", () => {
  const opening = $("#mobile-nav").hidden;
  $("#mobile-nav").hidden = !opening;
  menuToggle.setAttribute("aria-expanded", String(opening));
  menuToggle.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
});
$("#mobile-nav").addEventListener("click", (event) => {
  if (event.target.closest("a,button")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#mobile-nav").hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
matchMedia("(min-width:981px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});
document.addEventListener("click", (event) => {
  const destination = event.target.closest("[data-destination]");
  if (destination) {
    state = {
      ...state,
      destination: destination.dataset.destination,
      style: "all",
      month: "all",
      showAll: true,
    };
    $("#search-destination").value = state.destination;
    $("#search-style").value = "all";
    $("#search-month").value = "all";
    renderTours();
    scrollToJourneys();
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.style = filter.dataset.filter;
    state.showAll = true;
    $("#search-style").value = state.style;
    renderTours();
    return;
  }
  const save = event.target.closest("[data-save]");
  if (save) {
    toggleSave(save.dataset.save);
    return;
  }
  const tour = event.target.closest("[data-tour]");
  if (tour) {
    openTour(tour.dataset.tour);
    return;
  }
  const article = event.target.closest("[data-article]");
  if (article) {
    openArticle(article.dataset.article);
    return;
  }
  const planTour = event.target.closest("[data-plan-tour]");
  if (planTour) {
    openPlanner(planTour.dataset.planTour);
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  switch (action.dataset.action) {
    case "plan": {
      const focus = action.dataset.planFocus;
      const vehicle = action.dataset.vehicle;
      openPlanner(undefined, focus);
      if (action.id === "finder-host-cta") appendPlannerNote(finderBrief());
      if (vehicle) appendPlannerNote(`Preferred vehicle: ${vehicle}.`);
      break;
    }
    case "saved":
      openSaved();
      break;
    case "reset-filters":
      resetFilters();
      break;
    case "close-and-explore":
      contentDialog.close();
      scrollToJourneys();
      break;
    case "privacy":
      openPrivacy();
      break;
    case "terms":
      openTerms();
      break;
    case "credits":
      openCredits();
      break;
    case "currency-info":
      currencyInfo();
      break;
    case "delete-request": {
      try {
        localStorage.removeItem("gupta-travel-request");
        showToast("Saved travel request deleted from this browser.");
      } catch {
        showToast(
          "Browser storage is unavailable. Clear site data in your browser settings.",
        );
      }
      break;
    }
    case "download-request":
      downloadRequest();
      break;
    case "edit-request":
      $("#planner-success").hidden = true;
      plannerForm.hidden = false;
      $(".planner-progress").hidden = false;
      setStep(1);
      break;
  }
});
$("#year").textContent = new Date().getFullYear();
$("#search-destination").value = state.destination;
$("#currency").value = currency;
const initialPickup = findPlace(state.pickupId);
const initialPlace = findPlace(state.placeId);
$("#pickup-search").value = initialPickup.label;
$("#search-pickup-id").value = initialPickup.id;
$("#place-search").value = initialPlace.label;
$("#search-place-id").value = initialPlace.id;
syncClearButtons();
syncCurrencyForCountry(initialPlace.countryCode, true);
renderRegionRail();
renderFinderResults();
renderIndiaServices();
renderTours();
updateSavedUI();
{
  const { friday, monday } = nextWeekendDeparture();
  const range = formatWeekendRange(friday, monday);
  $$("[data-home-next-weekend]").forEach((el) => {
    el.textContent = range;
  });
}

/* Soft scroll reveals — keep pages feeling alive without noise */
if ("IntersectionObserver" in window) {
  const reveals = $$(".reveal");
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    reveals.forEach((el) => io.observe(el));
  }
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-visible"));
}

/* Mobile sticky plan bar on homepage */
if (document.body.classList.contains("home-page")) {
  const stickyBar = document.createElement("a");
  stickyBar.className = "home-mobile-bar";
  stickyBar.href = "#trip-finder";
  stickyBar.innerHTML =
    `<span>Plan any India route · <strong>host quote</strong></span><em>Plan trip</em>`;
  document.body.appendChild(stickyBar);

  const finderCta =
    $(".search-submit") || $("[data-action='whatsapp-quote']") || $("#trip-finder");
  if (finderCta && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        stickyBar.classList.toggle("is-hidden", entry.isIntersecting);
      },
      { threshold: 0.55, rootMargin: "-12% 0px -12% 0px" }
    );
    observer.observe(finderCta);
  }
}
