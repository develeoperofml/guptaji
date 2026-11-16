import { siteConfig } from "./site-config.js";
import {
  STRANGER_PICKUPS,
  formatInr,
  strangerLeaveTime,
  upcomingDepartures,
  findTripSharing,
  tripBookingUrl,
  tripEnquireUrl,
  formatWeekendRange,
  formatWeekendLong,
} from "./weekend.js";
import { getTrip } from "./trips/catalog.js";
import { bindLeadTracking, trackBookSeat } from "./analytics.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

bindLeadTracking();

const tripSlug = document.body.getAttribute("data-trip") || "";
const trip = getTrip(tripSlug);
if (!trip) {
  console.error(`Unknown trip slug: ${tripSlug}`);
}

const phoneTel = siteConfig.phoneTel || `+${siteConfig.whatsappNumber}`;
const phoneDisplay = siteConfig.phoneDisplay || siteConfig.whatsappDisplay;

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

function refreshTripLabels() {
  if (!trip) return;
  const next = upcomingDepartures({
    departureRule: trip.departureRule,
    nights: trip.nights,
    count: 1,
  })[0];
  const rangeLabel = next
    ? formatWeekendRange(next.depart, next.returnDate)
    : "upcoming departure";
  const enquireUrl = tripEnquireUrl(
    trip,
    siteConfig.whatsappNumber,
    siteConfig.businessName,
  );

  $$("[data-next-weekend]").forEach((el) => {
    el.textContent = rangeLabel;
  });
  $$("[data-next-friday]").forEach((el) => {
    if (next) el.textContent = formatWeekendLong(next.depart);
  });
  $$("[data-stranger-enquire]").forEach((el) => {
    el.setAttribute("href", enquireUrl);
  });

  const float = $("#whatsapp-float");
  if (float) float.href = enquireUrl;
}

refreshTripLabels();

const year = $("#year");
if (year) year.textContent = String(new Date().getFullYear());

const callFloat = $("#call-float");
if (callFloat) {
  callFloat.href = `tel:${phoneTel}`;
  callFloat.setAttribute(
    "aria-label",
    `Call ${siteConfig.businessName} at ${phoneDisplay}`,
  );
}

function setFooterSocial(link, href, labelText) {
  if (!link || !href) return;
  link.href = href;
  const label = link.querySelector(".footer-social-label");
  if (label) label.textContent = labelText;
}

setFooterSocial($("#footer-call"), `tel:${phoneTel}`, `Call ${phoneDisplay}`);
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
  } else if (label.includes("email") && siteConfig.enquiryEmail) {
    chip.href = `mailto:${siteConfig.enquiryEmail}`;
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

/* ── Booking ── */
const bookForm = $("#stranger-book-form");
const dateChips = $("#stranger-date-chips");
const shareChips = $("#stranger-share-chips");
const peopleInput = $("#book-people");
const pickupSelect = $("#book-pickup");
const nameInput = $("#book-name");
const noteInput = $("#book-note");
const summary = $("#book-summary");

const bookingState = {
  departureId: "",
  sharing: trip?.sharing?.[0]?.id || "quad",
  people: 1,
};

function clampPeople(value) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(12, n));
}

function tripDepartures(count = 6) {
  if (!trip) return [];
  return upcomingDepartures({
    departureRule: trip.departureRule,
    nights: trip.nights,
    count,
  });
}

function renderPickupOptions() {
  if (!pickupSelect) return;
  const options = STRANGER_PICKUPS.map(
    (place) => `<option value="${escapeAttr(place)}">${escapeHtml(place)}</option>`,
  ).join("");
  pickupSelect.innerHTML = `<option value="">Choose a pickup point</option>${options}`;
}

function renderDateChips({ keepSelection = false } = {}) {
  if (!dateChips || !trip) return;
  const list = tripDepartures(6);
  const stillOpen =
    keepSelection && list.some((item) => item.id === bookingState.departureId);
  bookingState.departureId = stillOpen
    ? bookingState.departureId
    : list[0]?.id || "";
  dateChips.innerHTML = list
    .map((item) => {
      const selected = item.id === bookingState.departureId;
      const isNext = item.id === list[0]?.id;
      return `<label class="stranger-date-chip${selected ? " is-selected" : ""}">
        <input type="radio" name="weekendId" value="${escapeAttr(item.id)}" ${selected ? "checked" : ""} />
        <span class="chip-day">${escapeHtml(item.shortLabel)}</span>
        <span class="chip-range">${escapeHtml(trip.chipRangeLabel || "Leave → return")}</span>
        <span class="chip-status">${isNext ? "Next open" : "Open"}</span>
      </label>`;
    })
    .join("");
}

function renderShareChips() {
  if (!shareChips || !trip) return;
  shareChips.innerHTML = trip.sharing.map((option) => {
    const selected = option.id === bookingState.sharing;
    return `<label class="stranger-share-chip${selected ? " is-selected" : ""}">
      <input type="radio" name="sharing" value="${escapeAttr(option.id)}" ${selected ? "checked" : ""} />
      <span class="share-label">${escapeHtml(option.label)}</span>
      <span class="share-price">${escapeHtml(formatInr(option.price))}</span>
      <span class="share-hint">${escapeHtml(option.hint)}</span>
    </label>`;
  }).join("");
}

function updateSummary() {
  if (!summary || !trip) return;
  const list = tripDepartures(6);
  const chosen =
    list.find((item) => item.id === bookingState.departureId) || list[0];
  const share = findTripSharing(trip.sharing, bookingState.sharing);
  const people = clampPeople(peopleInput?.value || bookingState.people);
  bookingState.people = people;
  if (peopleInput) peopleInput.value = String(people);
  const pickup = String(pickupSelect?.value || "").trim();
  const total = formatInr(share.price * people);
  const leaveHint = pickup
    ? `Leave ~${strangerLeaveTime(pickup)}`
    : trip.leaveHintDefault;

  summary.innerHTML = `
    <p class="summary-total"><strong>${total}</strong> <span>approx for ${people} · ${escapeHtml(share.label)}</span></p>
    <p class="summary-meta">${escapeHtml(chosen?.label || "upcoming departure")} · ${formatInr(share.price)}/person</p>
    <p class="summary-pickup">${pickup ? `Pickup: ${escapeHtml(pickup)}` : "Choose a pickup point to continue"} · ${escapeHtml(leaveHint)}</p>
  `;
}

function refreshBookable() {
  refreshTripLabels();
  if (!dateChips) return;
  renderDateChips({ keepSelection: true });
  updateSummary();
}

if (bookForm && dateChips && peopleInput && pickupSelect && trip) {
  renderPickupOptions();
  renderDateChips();
  renderShareChips();
  updateSummary();

  const syncDateSelection = (departureId) => {
    bookingState.departureId = departureId;
    $$(".stranger-date-chip", dateChips).forEach((chip) => {
      const input = chip.querySelector('input[name="weekendId"]');
      const selected = input?.value === bookingState.departureId;
      if (input) input.checked = Boolean(selected);
      chip.classList.toggle("is-selected", Boolean(selected));
    });
    updateSummary();
  };

  const syncShareSelection = (sharingId) => {
    bookingState.sharing = findTripSharing(trip.sharing, sharingId).id;
    $$(".stranger-share-chip", shareChips).forEach((chip) => {
      const input = chip.querySelector('input[name="sharing"]');
      const selected = input?.value === bookingState.sharing;
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

  shareChips?.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="sharing"]');
    if (!input) return;
    syncShareSelection(input.value);
  });
  shareChips?.addEventListener("click", (event) => {
    const chip = event.target.closest(".stranger-share-chip");
    const input = chip?.querySelector('input[name="sharing"]');
    if (!input) return;
    syncShareSelection(input.value);
  });

  peopleInput.addEventListener("input", updateSummary);
  peopleInput.addEventListener("change", () => {
    peopleInput.value = String(clampPeople(peopleInput.value));
    updateSummary();
  });
  pickupSelect.addEventListener("change", updateSummary);

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
      const pickupLine = summary.querySelector(".summary-pickup");
      if (pickupLine) {
        pickupLine.textContent =
          "Choose a pickup point so the host can plan boarding.";
      }
      return;
    }
    pickupSelect.removeAttribute("aria-invalid");
    trackBookSeat({
      pickup,
      sharing: bookingState.sharing,
      people,
      weekendId: bookingState.departureId,
      trip: trip.slug,
    });
    const url = tripBookingUrl({
      trip,
      whatsappNumber: siteConfig.whatsappNumber,
      businessName: siteConfig.businessName,
      departureId: bookingState.departureId,
      people,
      pickup,
      sharing: bookingState.sharing,
      name: nameInput?.value,
      note: noteInput?.value,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshBookable();
  });
  window.setInterval(refreshBookable, 60_000);
}

if ("IntersectionObserver" in window) {
  const reveals = $$(".reveal");
  if (reveals.length) {
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealIo.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    reveals.forEach((el) => revealIo.observe(el));
  }
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-visible"));
}

/* Mobile sticky book bar */
if (trip) {
  const stickyBar = document.createElement("a");
  stickyBar.className = "stranger-mobile-bar";
  stickyBar.href = "#book";
  stickyBar.innerHTML = `<span>From <strong>${formatInr(trip.fromPrice)}</strong></span><em>Book seat</em>`;
  document.body.appendChild(stickyBar);

  const bookSection = $("#book");
  if (bookSection && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        stickyBar.classList.toggle("is-hidden", entry.isIntersecting);
      },
      { threshold: 0.2 },
    );
    io.observe(bookSection);
  }
}

function fullImageSrc(img) {
  const srcset = img.getAttribute("srcset") || "";
  if (srcset) {
    const parts = srcset
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return img.currentSrc || img.getAttribute("src") || "";
}

function initImageLightbox() {
  const root = $("#image-lightbox");
  const stageImg = $("#image-lightbox-img");
  const caption = $("#image-lightbox-caption");
  const count = $("#image-lightbox-count");
  if (!root || !stageImg) return;

  const selectors = [
    ".stranger-stay-grid img",
    ".stranger-day-photo img",
    ".stranger-places img",
    ".stranger-book-mood img",
    ".trip-success-slide img",
    ".stranger-hero-static img",
  ].join(", ");

  const images = $$(selectors).filter((img) => Boolean(fullImageSrc(img)));
  if (!images.length) return;

  let index = 0;
  let lastFocus = null;

  const render = () => {
    const img = images[index];
    if (!img) return;
    stageImg.src = fullImageSrc(img);
    stageImg.alt = img.getAttribute("alt") || "Trip photo";
    caption.textContent = stageImg.alt;
    if (count) count.textContent = `${index + 1} / ${images.length}`;
  };

  const open = (i) => {
    index = Math.max(0, Math.min(images.length - 1, i));
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("lightbox-open");
    render();
    root.querySelector("[data-lightbox-close]")?.focus();
  };

  const close = () => {
    root.hidden = true;
    document.body.classList.remove("lightbox-open");
    stageImg.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  const step = (delta) => {
    index = (index + delta + images.length) % images.length;
    render();
  };

  images.forEach((img, i) => {
    img.classList.add("is-zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      `View larger: ${img.getAttribute("alt") || "trip photo"}`,
    );
    img.addEventListener("click", () => open(i));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(i);
      }
    });
  });

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-lightbox-close]") || target === root) close();
    else if (target.closest("[data-lightbox-prev]")) step(-1);
    else if (target.closest("[data-lightbox-next]")) step(1);
  });

  document.addEventListener("keydown", (event) => {
    if (root.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}

function initTripSuccessSlider() {
  const root = document.querySelector("[data-trip-slider]");
  if (!root) return;
  const track = root.querySelector("[data-trip-track]");
  const slides = [...root.querySelectorAll(".trip-success-slide")];
  const dotsWrap = root.querySelector("[data-trip-dots]");
  const countEl = root.querySelector("[data-trip-count]");
  const prevBtn = root.querySelector("[data-trip-prev]");
  const nextBtn = root.querySelector("[data-trip-next]");
  if (!track || slides.length < 2) return;

  let index = 0;
  let timer = null;
  let touchX = 0;

  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });
    if (dotsWrap) {
      [...dotsWrap.children].forEach((dot, i) => {
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    }
    if (countEl) countEl.textContent = `${index + 1} / ${slides.length}`;
  };

  const go = (next) => {
    index = (next + slides.length) % slides.length;
    render();
  };

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Show trip photo ${i + 1}`);
      dot.addEventListener("click", () => {
        go(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    });
  }

  prevBtn?.addEventListener("click", () => {
    go(index - 1);
    restart();
  });
  nextBtn?.addEventListener("click", () => {
    go(index + 1);
    restart();
  });

  const viewport = root.querySelector(".trip-success-viewport");
  viewport?.addEventListener(
    "touchstart",
    (event) => {
      touchX = event.changedTouches?.[0]?.clientX || 0;
    },
    { passive: true },
  );
  viewport?.addEventListener(
    "touchend",
    (event) => {
      const endX = event.changedTouches?.[0]?.clientX || 0;
      const delta = endX - touchX;
      if (Math.abs(delta) < 40) return;
      go(delta < 0 ? index + 1 : index - 1);
      restart();
    },
    { passive: true },
  );

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    timer = window.setInterval(() => go(index + 1), 5200);
  };
  const restart = () => {
    stop();
    start();
  };

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) start();
  });

  render();
  start();
}

initTripSuccessSlider();
initImageLightbox();
