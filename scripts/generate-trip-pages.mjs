import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const { allTrips } = await import(
  pathToFileURL(path.join(dist, "trips", "catalog.js")).href
);

const ORIGIN = "https://guptajitourtravel.cognivx.com";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function imgPair(base, alt, { eager = false, sizes = "(max-width:800px) 94vw, 900px", w = 1400, h = 933 } = {}) {
  const loading = eager ? "eager" : "lazy";
  const fetch = eager ? ' fetchpriority="high"' : "";
  return `<img src="assets/${base}.webp" srcset="assets/${base}-small.webp 720w, assets/${base}.webp ${w}w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" loading="${loading}" decoding="async"${fetch} />`;
}

function renderStay(trip) {
  return trip.stay
    .map((item) => {
      const cls = [
        "stranger-stay-card",
        item.feature ? "stay-feature" : "",
        item.night ? "stay-night" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<figure class="${cls}">${imgPair(item.src, item.alt, {
        eager: Boolean(item.feature),
        sizes: item.feature
          ? "(max-width:900px) 94vw, 640px"
          : "(max-width:900px) 45vw, 280px",
      })}</figure>`;
    })
    .join("\n");
}

function renderSuccess(trip) {
  return trip.success
    .map((item, i) => {
      return `<figure class="trip-success-slide${i === 0 ? " is-active" : ""}">
                  ${imgPair(item.src, item.alt, { eager: i === 0 })}
                  <figcaption>${esc(item.caption)}</figcaption>
                </figure>`;
    })
    .join("\n");
}

function renderItinerary(trip) {
  return trip.itinerary
    .map(
      (day) => `<li class="stranger-day">
              <div class="stranger-day-photo">${imgPair(day.photo, day.photoAlt, {
                sizes: "(max-width:900px) 94vw, 420px",
              })}</div>
              <div class="stranger-day-copy">
                <h3>${esc(day.title)}</h3>
                <ul>${day.body.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
              </div>
            </li>`,
    )
    .join("\n");
}

function renderPlaces(trip) {
  return trip.places
    .map(
      (place) => `<article class="has-photo" data-priority="${esc(place.priority)}">
              ${imgPair(place.photo, place.title, {
                sizes: "(max-width:900px) 45vw, 280px",
                w: 900,
                h: 700,
              })}
              <div>
                <h3>${esc(place.title)}</h3>
                <p>${esc(place.text)}</p>
              </div>
            </article>`,
    )
    .join("\n");
}

function renderSnapshot(trip) {
  return trip.snapshot
    .map(
      (cell) => `<div class="snapshot-cell">
            <span>${esc(cell.label)}</span>
            <strong>${esc(cell.value)}</strong>
          </div>`,
    )
    .join("\n");
}

function renderNotes(trip) {
  return trip.notes
    .map(
      (note) => `<article>
              <h3>${esc(note.title)}</h3>
              <p>${esc(note.text)}</p>
            </article>`,
    )
    .join("\n");
}

function renderList(items, exclude = false) {
  const cls = exclude ? ' class="stranger-exclude"' : "";
  return items
    .map(
      (item) => `<li${cls}><svg class="icon"><use href="#check" /></svg> ${esc(item)}</li>`,
    )
    .join("\n");
}

function moodThumbs(trip) {
  const picks = trip.success.slice(0, 3);
  return picks
    .map(
      (item) =>
        `<img src="assets/${item.src}-small.webp" width="160" height="120" alt="${esc(item.alt)}" loading="lazy" decoding="async" />`,
    )
    .join("\n");
}

function pageHtml(trip) {
  const fromPrice = `₹${Number(trip.fromPrice).toLocaleString("en-IN")}`;
  const canonical = `${ORIGIN}${trip.path}`;
  const productOffers = trip.sharing
    .map(
      (s) => `{
          "@type": "Offer",
          "name": "${s.label}",
          "price": "${s.price}",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "url": "${canonical}#book"
        }`,
    )
    .join(",\n        ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ffd60a" />
    <meta name="color-scheme" content="light" />
    <title>${esc(trip.name)} Stranger Trip from Delhi | From ${fromPrice} — Gupta Ji Tour &amp; Travels</title>
    <meta name="description" content="${esc(trip.metaDescription)}" />
    <meta name="keywords" content="${esc(trip.keywords)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="Gupta Ji Tour & Travels" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en-IN" href="${canonical}" />
    <link rel="alternate" hreflang="x-default" href="${canonical}" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="icon" href="assets/favicon.png" type="image/png" />
    <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_IN" />
    <meta property="og:site_name" content="Gupta Ji Tour & Travels" />
    <meta property="og:title" content="${esc(trip.name)} Stranger Trip | From ${fromPrice}" />
    <meta property="og:description" content="${esc(trip.metaDescription)}" />
    <meta property="og:image" content="${ORIGIN}/${trip.ogImage}" />
    <meta property="og:image:alt" content="${esc(trip.heroAlt)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(trip.name)} Stranger Trip | From ${fromPrice}" />
    <meta name="twitter:description" content="${esc(trip.metaDescription)}" />
    <meta name="twitter:image" content="${ORIGIN}/${trip.ogImage}" />
    <!-- SEO_VERIFICATION -->
    <!-- SEO_ANALYTICS -->
    <link rel="preload" as="image" href="${trip.heroImage}" fetchpriority="high" />
    <link rel="stylesheet" href="styles.css" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "${ORIGIN}/" },
          { "@type": "ListItem", "position": 2, "name": "Stranger trips", "item": "${ORIGIN}/#top-stranger-trips" },
          { "@type": "ListItem", "position": 3, "name": "${esc(trip.name)}", "item": "${canonical}" }
        ]
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "${esc(trip.name)} Stranger Trip",
        "description": "${esc(trip.metaDescription)}",
        "image": ["${ORIGIN}/${trip.ogImage}"],
        "brand": { "@type": "Brand", "name": "Gupta Ji Tour & Travels" },
        "offers": [
        ${productOffers}
        ]
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": "${esc(trip.name)} Stranger Trip",
        "description": "${esc(trip.metaDescription)}",
        "touristType": "Group travellers",
        "offers": {
          "@type": "Offer",
          "price": "${trip.fromPrice}",
          "priceCurrency": "INR",
          "url": "${canonical}#book"
        }
      }
    </script>
    <script type="module" src="trip-page.js"></script>
  </head>
  <body class="stranger-page" data-trip="${esc(trip.slug)}">
    <a class="skip-link" href="#main">Skip to content</a>
    <svg class="icon-library" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="arrow-up" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12" /></symbol>
        <symbol id="pin" viewBox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></symbol>
        <symbol id="clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
        <symbol id="check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></symbol>
        <symbol id="menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></symbol>
        <symbol id="compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6Z" /></symbol>
        <symbol id="spark" viewBox="0 0 24 24"><path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3Z" /></symbol>
        <symbol id="mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></symbol>
        <symbol id="phone" viewBox="0 0 24 24"><path d="M7.2 3.8c.5-.5 1.3-.6 1.9-.2l2.1 1.3c.6.4.8 1.1.6 1.8l-.6 2.1c-.1.5 0 1 .4 1.3l2.3 2.3c.4.4.8.5 1.3.4l2.1-.6c.7-.2 1.4 0 1.8.6l1.3 2.1c.4.6.3 1.4-.2 1.9l-1.1 1.1c-.6.6-1.4.9-2.2.8-2-.2-4.9-1.3-7.5-3.9S4.6 9.5 4.4 7.5c-.1-.8.2-1.6.8-2.2Z" /></symbol>
        <symbol id="whatsapp" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 2.08.62 4.02 1.7 5.63L2 22l4.7-1.53a9.86 9.86 0 0 0 5.34 1.56h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2zm0 17.98h-.01a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.12.81.83-3.04-.2-.31a8.1 8.1 0 0 1-1.25-4.28c0-4.5 3.68-8.16 8.21-8.16 4.53 0 8.21 3.66 8.21 8.16 0 4.5-3.68 8.14-8.21 8.14zm4.51-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.24 3.74 2.49 1.07 2.49.71 2.94.67.45-.04 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.05-.12-.22-.19-.47-.31z" /></symbol>
        <symbol id="instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></symbol>
        <symbol id="linkedin" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7.5v.01M12 17v-4.5a2.5 2.5 0 0 1 5 0V17" /></symbol>
      </defs>
    </svg>

    <header class="site-header">
      <div class="header-inner">
        <a href="/" class="brand">
          <span class="brand-mark" aria-hidden="true">
            <img src="assets/logo-small.webp" srcset="assets/logo-small.webp 128w, assets/logo.webp 512w" sizes="48px" width="48" height="48" alt="" decoding="async" />
          </span>
          <span class="brand-type">Gupta Ji<span>TOUR & TRAVELS</span></span>
          <span class="sr-only"> home</span>
        </a>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="/#trip-finder">Plan a route</a>
          <a href="/#from-jaipur">Cabs &amp; fleet</a>
          <a href="/#top-stranger-trips">Stranger trips</a>
          <a href="/#how-it-works">How it works</a>
        </nav>
        <div class="header-actions">
          <a class="button primary header-plan" href="#book">
            Book a seat
            <svg class="icon"><use href="#arrow-up" /></svg>
          </a>
          <button class="icon-button mobile-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
            <svg class="icon"><use href="#menu" /></svg>
          </button>
        </div>
      </div>
      <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" hidden>
        <a href="/#trip-finder">Plan a route</a>
        <a href="/#from-jaipur">Cabs &amp; fleet</a>
        <a href="/#top-stranger-trips">Stranger trips</a>
        <a href="/stranger-trips">Manali weekend</a>
        <a href="/#how-it-works">How it works</a>
        <a href="tel:+919602970369">Call +91 96029 70369</a>
        <a class="button primary" href="#book">Book a seat <svg class="icon"><use href="#arrow-up" /></svg></a>
      </nav>
    </header>

    <main id="main">
      <section class="stranger-hero stranger-hero-static" aria-labelledby="stranger-title">
        <div class="stranger-hero-media" aria-hidden="true">
          <img class="stranger-hero-image is-active" src="${trip.heroImage}" srcset="${trip.heroImageSmall} 900w, ${trip.heroImage} 1600w" sizes="100vw" width="1600" height="900" alt="" decoding="async" fetchpriority="high" />
          <div class="stranger-hero-shade"></div>
        </div>
        <div class="container stranger-hero-content">
          <p class="eyebrow hero-eyebrow"><span></span> ${esc(trip.eyebrow)}</p>
          <h1 id="stranger-title">${esc(trip.heroTitle)}<br /><em>${esc(trip.heroEm)}</em></h1>
          <p class="stranger-hero-lead">${esc(trip.heroLead)}</p>
          <div class="stranger-hero-actions">
            <a class="button lime" href="#book">Hold a seat · <span data-next-weekend>upcoming departure</span>
              <svg class="icon"><use href="#arrow-up" /></svg>
            </a>
            <a class="button outline light-outline hero-enquire" data-stranger-enquire href="https://wa.me/919602970369" target="_blank" rel="noopener noreferrer">
              <svg class="icon icon-brand" aria-hidden="true"><use href="#whatsapp" /></svg>
              Enquire now
            </a>
            <a class="button outline light-outline" href="${trip.pdfPath}" download="${esc(trip.pdfDownloadName)}">Download itinerary PDF
              <svg class="icon"><use href="#arrow-up" /></svg>
            </a>
          </div>
          <p class="stranger-hero-micro">Hold a seat below · Enquire opens WhatsApp · PDF ready to share · no payment on this page</p>
        </div>
      </section>

      <div class="stranger-snapshot container" aria-label="Trip snapshot">
          ${renderSnapshot(trip)}
      </div>

      <section class="section stranger-book-wrap band-sand reveal" id="book" aria-labelledby="book-title">
        <div class="container stranger-book-layout">
          <aside class="stranger-book-card">
            <div class="stranger-book-price">
              <p class="eyebrow">BOOK YOUR SEAT</p>
              <p class="stranger-book-from">from <strong>${fromPrice}</strong> / person</p>
              <p class="stranger-book-next">Next: <strong data-next-weekend>upcoming departure</strong></p>
            </div>
            <form id="stranger-book-form" class="stranger-book-form" novalidate>
              <fieldset>
                <legend>1. Departure</legend>
                <div id="stranger-date-chips" class="stranger-date-chips" role="radiogroup" aria-label="Departure dates"></div>
              </fieldset>
              <fieldset>
                <legend>2. Room sharing</legend>
                <div id="stranger-share-chips" class="stranger-share-chips" role="radiogroup" aria-label="Room sharing"></div>
              </fieldset>
              <div class="stranger-people-row">
                <label for="book-people">3. Number of people</label>
                <div class="stranger-people-stepper">
                  <button type="button" data-people-step="-1" aria-label="Fewer people">−</button>
                  <input id="book-people" name="people" type="number" min="1" max="12" value="1" required />
                  <button type="button" data-people-step="1" aria-label="More people">+</button>
                </div>
                <p class="field-hint">Price shown is per person for your sharing type</p>
              </div>
              <label class="stranger-field" for="book-pickup">4. Pickup point
                <select id="book-pickup" name="pickup" required>
                  <option value="">Choose a pickup point</option>
                </select>
              </label>
              <label class="stranger-field" for="book-name">Name <span class="optional">(optional)</span>
                <input id="book-name" name="name" type="text" autocomplete="name" />
              </label>
              <label class="stranger-field" for="book-note">Note for host <span class="optional">(optional)</span>
                <textarea id="book-note" name="note" rows="2"></textarea>
              </label>
              <div id="book-summary" class="stranger-book-summary" aria-live="polite"></div>
              <button class="button primary stranger-book-submit" type="submit">Continue on WhatsApp</button>
              <p class="stranger-book-fine">No payment on this page. Host confirms seats, then you pay as agreed.</p>
            </form>
          </aside>
          <div class="stranger-book-story">
            <p class="eyebrow">HOW BOOKING WORKS</p>
            <h2 id="book-title">Pick the departure.<br /><em>Host confirms seats.</em></h2>
            <p>Choose date, sharing, people and pickup — WhatsApp opens with a ready booking message.</p>
            <div class="stranger-book-mood" aria-hidden="false">${moodThumbs(trip)}</div>
            <ol class="stranger-book-steps">
              <li>Choose departure &amp; room sharing</li>
              <li>Add people &amp; pickup point</li>
              <li>Continue on WhatsApp — host confirms</li>
            </ol>
          </div>
        </div>
      </section>

      <section class="section stranger-stay band-warm reveal" id="stay" aria-labelledby="stay-title">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${esc(trip.stayEyebrow)}</p>
              <h2 id="stay-title">${esc(trip.stayTitle)}<br /><em>${esc(trip.stayEm)}</em></h2>
            </div>
            <p class="section-intro">${esc(trip.stayIntro)}</p>
          </div>
          <div class="stranger-stay-grid">${renderStay(trip)}</div>
        </div>
      </section>

      <section class="section stranger-success band-deep reveal" id="successful-trips" aria-labelledby="success-title">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">MEMORIES FROM THE ROAD</p>
              <h2 id="success-title">Successful trips.<br /><em>Groups that showed up.</em></h2>
            </div>
            <p class="section-intro">${esc(trip.successIntro)}</p>
          </div>
          <div class="trip-success-slider" data-trip-slider>
            <div class="trip-success-viewport">
              <div class="trip-success-track" data-trip-track>${renderSuccess(trip)}</div>
            </div>
            <div class="trip-success-controls">
              <button type="button" class="trip-success-btn" data-trip-prev aria-label="Previous trip photo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="trip-success-dots" data-trip-dots role="tablist" aria-label="Trip photo slides"></div>
              <button type="button" class="trip-success-btn" data-trip-next aria-label="Next trip photo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <p class="trip-success-count" data-trip-count aria-live="polite">1 / ${trip.success.length}</p>
          </div>
        </div>
      </section>

      <section class="section stranger-itinerary band-sand reveal" id="itinerary" aria-labelledby="itinerary-title">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">ITINERARY</p>
              <h2 id="itinerary-title">The trip rhythm.<br /><em>${esc(trip.departureLabel)}.</em></h2>
            </div>
            <p class="section-intro">Next: <strong data-next-weekend>upcoming departure</strong>. ${esc(trip.itineraryIntro)}</p>
          </div>
          <p class="stranger-pdf-row">
            <a class="button outline" href="${trip.pdfPath}" download="${esc(trip.pdfDownloadName)}">Download itinerary PDF</a>
            <span>Day-by-day outline — ready to share.</span>
          </p>
          <ol class="stranger-days">${renderItinerary(trip)}</ol>
        </div>
      </section>

      <section class="section band-mist reveal" aria-labelledby="places-title">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">ALONG THE WAY</p>
              <h2 id="places-title">${esc(trip.placesTitle)}</h2>
            </div>
            <p class="section-intro">${esc(trip.placesIntro)}</p>
          </div>
          <div class="stranger-places">${renderPlaces(trip)}</div>
        </div>
      </section>

      <section class="section stranger-include band-warm reveal" aria-labelledby="include-title">
        <div class="container stranger-include-grid">
          <div>
            <p class="eyebrow">BEFORE YOU JOIN</p>
            <h2 id="include-title">Included &amp; not promised.</h2>
            <p>${esc(trip.includesLead)}</p>
          </div>
          <div class="stranger-lists">
            <div>
              <h3>Included</h3>
              <ul>${renderList(trip.included)}</ul>
            </div>
            <div>
              <h3>Not promised</h3>
              <ul>${renderList(trip.notPromised, true)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section class="section stranger-notes band-sand reveal" aria-labelledby="notes-title">
        <div class="container">
          <h2 id="notes-title" class="sr-only">Good to know</h2>
          <div class="stranger-notes-grid">${renderNotes(trip)}</div>
        </div>
      </section>

      <section class="section final-cta band-deep reveal" aria-labelledby="final-title">
        <div class="container final-cta-inner">
          <p class="eyebrow light">NEXT DEPARTURE</p>
          <h2 id="final-title">Ready to join strangers on the road?</h2>
          <p>Next departure: <strong data-next-weekend>upcoming departure</strong>.</p>
          <a class="button primary" href="#book">Book a seat <svg class="icon"><use href="#arrow-up" /></svg></a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <a href="/" class="brand footer-brand">
            <span class="brand-mark" aria-hidden="true">
              <img src="assets/logo-small.webp" width="40" height="40" alt="" />
            </span>
            <span class="brand-type">Gupta Ji<span>TOUR & TRAVELS</span></span>
          </a>
          <p>${esc(trip.name)} Stranger Trip · ${esc(trip.departureLabel).toLowerCase()} from Jaipur or Delhi NCR.</p>
        </div>
        <nav aria-label="Footer">
          <a href="/">Home</a>
          <a href="/#trip-finder">Private cabs</a>
          <a href="/#top-stranger-trips">Stranger trips</a>
          <a href="/stranger-trips">Manali weekend</a>
        </nav>
        <nav class="footer-social" aria-label="Contact and social">
          <a id="footer-call" class="footer-social-chip" href="tel:+919602970369" aria-label="Call"><span class="footer-social-label">Call</span></a>
          <a id="footer-email" class="footer-social-chip" href="mailto:info@cognivx.com" aria-label="Email"><span class="footer-social-label">Email</span></a>
          <a class="footer-social-chip" href="https://wa.me/919602970369" aria-label="WhatsApp Gupta Ji Tour & Travels"><span class="footer-social-label">WhatsApp</span></a>
          <a id="footer-instagram" class="footer-social-chip" href="#" aria-label="Instagram"><span class="footer-social-label">Instagram</span></a>
          <a id="footer-linkedin" class="footer-social-chip" href="#" aria-label="LinkedIn"><span class="footer-social-label">LinkedIn</span></a>
        </nav>
      </div>
      <div class="container footer-meta">
        <p>© <span id="year">2026</span> Gupta Ji Tour &amp; Travels · Based in Jaipur, Rajasthan, India · <a href="tel:+919602970369">+91 96029 70369</a></p>
      </div>
    </footer>

    <div class="contact-floats" aria-label="Quick contact">
      <a id="call-float" class="contact-float call" href="tel:+919602970369" aria-label="Call Gupta Ji Tour & Travels">
        <svg class="icon"><use href="#phone" /></svg>
      </a>
      <a id="whatsapp-float" class="contact-float whatsapp" href="https://wa.me/919602970369" aria-label="Enquire on WhatsApp for ${esc(trip.name)}">
        <svg class="icon"><use href="#whatsapp" /></svg>
      </a>
    </div>

    <div id="image-lightbox" class="image-lightbox" hidden>
      <button type="button" class="lightbox-close" data-lightbox-close aria-label="Close">×</button>
      <button type="button" class="lightbox-nav prev" data-lightbox-prev aria-label="Previous">‹</button>
      <figure class="lightbox-stage">
        <img id="image-lightbox-img" alt="" />
        <figcaption>
          <span id="image-lightbox-caption"></span>
          <span id="image-lightbox-count"></span>
        </figcaption>
      </figure>
      <button type="button" class="lightbox-nav next" data-lightbox-next aria-label="Next">›</button>
    </div>
  </body>
</html>
`;
}

await mkdir(dist, { recursive: true });
for (const trip of allTrips()) {
  const out = path.join(dist, trip.htmlFile);
  await writeFile(out, pageHtml(trip), "utf8");
  console.log("wrote", trip.htmlFile);
}
console.log("done");
