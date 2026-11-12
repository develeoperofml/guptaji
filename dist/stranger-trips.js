import { siteConfig } from "./site-config.js";
import {
  nextWeekendDeparture,
  formatWeekendRange,
  formatWeekendLong,
  strangerEnquireUrl,
  strangerBookingUrl,
  upcomingWeekends,
  STRANGER_PICKUPS,
} from "./weekend.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function refreshWeekendLabels() {
  const { friday, monday } = nextWeekendDeparture();
  const rangeLabel = formatWeekendRange(friday, monday);
  const enquireUrl = strangerEnquireUrl(
    siteConfig.whatsappNumber,
    siteConfig.businessName,
  );

  $$("[data-next-weekend]").forEach((el) => {
    el.textContent = rangeLabel;
  });
  $$("[data-next-friday]").forEach((el) => {
    el.textContent = formatWeekendLong(friday);
  });
  $$("[data-next-monday]").forEach((el) => {
    el.textContent = formatWeekendLong(monday);
  });
  $$("[data-stranger-enquire]").forEach((el) => {
    el.setAttribute("href", enquireUrl);
  });

  const float = $("#whatsapp-float");
  if (float) float.href = enquireUrl;
}

refreshWeekendLabels();

const year = $("#year");
if (year) year.textContent = String(new Date().getFullYear());

function setFooterSocial(link, href, labelText) {
  if (!link || !href) return;
  link.href = href;
  const label = link.querySelector(".footer-social-label");
  if (label) label.textContent = labelText;
}

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
  if (label.includes("email") && siteConfig.enquiryEmail) {
    chip.href = `mailto:${siteConfig.enquiryEmail}`;
    chip.setAttribute("aria-label", `Email ${siteConfig.enquiryEmail}`);
  } else if (label.includes("whatsapp")) {
    chip.href = `https://wa.me/${siteConfig.whatsappNumber}`;
  } else if (label.includes("instagram") && siteConfig.instagramUrl) {
    chip.href = siteConfig.instagramUrl;
  } else if (label.includes("linkedin") && siteConfig.linkedinUrl) {
    chip.href = siteConfig.linkedinUrl;
  }
});

const menuToggle = $("#menu-toggle");
const mobileNav = $("#mobile-nav");
if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
  });
  mobileNav.addEventListener("click", (event) => {
    if (event.target.closest("a,button")) {
      mobileNav.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
  });
}

/* ── Easy booking ── */
const bookForm = $("#stranger-book-form");
const dateChips = $("#stranger-date-chips");
const peopleInput = $("#book-people");
const pickupSelect = $("#book-pickup");
const nameInput = $("#book-name");
const noteInput = $("#book-note");
const summary = $("#book-summary");

const bookingState = {
  weekendId: "",
  people: 1,
};

function clampPeople(value) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(12, n));
}

function renderPickupOptions() {
  if (!pickupSelect) return;
  const options = STRANGER_PICKUPS.map(
    (place) => `<option value="${escapeAttr(place)}">${escapeHtml(place)}</option>`,
  ).join("");
  pickupSelect.innerHTML = `<option value="">Choose a pickup point</option>${options}`;
}

function renderDateChips({ keepSelection = false } = {}) {
  if (!dateChips) return;
  const weekends = upcomingWeekends(6);
  const stillOpen =
    keepSelection &&
    weekends.some((weekend) => weekend.id === bookingState.weekendId);
  bookingState.weekendId = stillOpen
    ? bookingState.weekendId
    : weekends[0]?.id || "";
  dateChips.innerHTML = weekends
    .map((weekend) => {
      const selected = weekend.id === bookingState.weekendId;
      const isNext = weekend.id === weekends[0]?.id;
      return `<label class="stranger-date-chip${selected ? " is-selected" : ""}">
        <input type="radio" name="weekendId" value="${escapeAttr(weekend.id)}" ${selected ? "checked" : ""} />
        <span class="chip-day">${escapeHtml(weekend.shortLabel)}</span>
        <span class="chip-range">Fri → Mon</span>
        <span class="chip-status">${isNext ? "Next open" : "Open"}</span>
      </label>`;
    })
    .join("");
}

function refreshBookableWeekends() {
  refreshWeekendLabels();
  if (!dateChips) return;
  renderDateChips({ keepSelection: true });
  updateSummary();
}

function updateSummary() {
  if (!summary) return;
  const weekends = upcomingWeekends(6);
  const chosen =
    weekends.find((weekend) => weekend.id === bookingState.weekendId) ||
    weekends[0];
  const people = clampPeople(peopleInput?.value || bookingState.people);
  bookingState.people = people;
  if (peopleInput) peopleInput.value = String(people);
  const pickup = String(pickupSelect?.value || "").trim();
  summary.textContent = pickup
    ? `${people} traveller${people === 1 ? "" : "s"} · ${chosen?.label || "upcoming weekend"} · pickup ${pickup}`
    : `${people} traveller${people === 1 ? "" : "s"} · ${chosen?.label || "upcoming weekend"} · choose pickup to continue`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

if (bookForm && dateChips && peopleInput && pickupSelect) {
  renderPickupOptions();
  renderDateChips();
  updateSummary();

  const syncDateSelection = (weekendId) => {
    bookingState.weekendId = weekendId;
    $$(".stranger-date-chip", dateChips).forEach((chip) => {
      const input = chip.querySelector('input[name="weekendId"]');
      const selected = input?.value === bookingState.weekendId;
      if (input) input.checked = Boolean(selected);
      chip.classList.toggle("is-selected", Boolean(selected));
    });
    updateSummary();
  };

  dateChips.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="weekendId"]');
    if (!input) return;
    syncDateSelection(input.value);
  });

  dateChips.addEventListener("click", (event) => {
    const chip = event.target.closest(".stranger-date-chip");
    const input = chip?.querySelector('input[name="weekendId"]');
    if (!input) return;
    syncDateSelection(input.value);
  });

  peopleInput.addEventListener("input", updateSummary);
  peopleInput.addEventListener("change", () => {
    peopleInput.value = String(clampPeople(peopleInput.value));
    updateSummary();
  });
  pickupSelect.addEventListener("change", updateSummary);
  nameInput?.addEventListener("input", updateSummary);
  noteInput?.addEventListener("input", updateSummary);

  $$("[data-people-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.getAttribute("data-people-step") || 0);
      peopleInput.value = String(clampPeople(Number(peopleInput.value || 1) + step));
      updateSummary();
    });
  });

  bookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const people = clampPeople(peopleInput.value);
    const pickup = String(pickupSelect.value || "").trim();
    if (!pickup) {
      pickupSelect.focus();
      pickupSelect.setAttribute("aria-invalid", "true");
      summary.textContent = "Choose a pickup point so the host can plan boarding.";
      return;
    }
    pickupSelect.removeAttribute("aria-invalid");
    const url = strangerBookingUrl({
      whatsappNumber: siteConfig.whatsappNumber,
      businessName: siteConfig.businessName,
      weekendId: bookingState.weekendId,
      people,
      pickup,
      name: nameInput?.value,
      note: noteInput?.value,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // Drop a Friday batch automatically after Saturday 01:00, even if the tab stays open.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshBookableWeekends();
  });
  window.setInterval(refreshBookableWeekends, 60_000);
}
