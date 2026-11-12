# Gupta Ji Tour & Travels

A premium travel discovery and enquiry website with a cinematic landscape hero, original editorial layouts, responsive destination browsing, journey filters, itinerary details, saved favourites, currency display, travel notes, FAQs, and a two-step WhatsApp enquiry planner.

## Run locally

Node.js 20 or newer is sufficient. Runtime has no production dependencies; `esbuild` is a devDependency used only for the release build.

```sh
npm run dev
```

Open **http://127.0.0.1:4173**. An alternative port can be chosen with `npm run dev -- --port 4174`. Use an HTTP server rather than opening the HTML file directly: the site uses JavaScript modules and fetches its photography credits.

```sh
npm run check
npm run build
```

`npm run build` writes a minified deployable site to `release/`. Before public launch, edit `dist/site-config.js` and follow **LAUNCH.md**.

## Project structure

- `dist/index.html`: meaningful initial HTML, metadata, sections, navigation, FAQ, and planner form.
- `dist/styles.css`: responsive styles, typography, accessible focus states, dialogs, and reduced-motion support.
- `dist/data.js`: editable destinations, sample trip details, itineraries, inclusions, and articles.
- `dist/site-config.js`: domain, indexing, WhatsApp, optional email, support hours, FX display rates.
- `dist/app.js`: filters, currency display, favourites, accessible native dialogs, and enquiry preparation.
- `dist/assets/`: locally hosted optimised WebP photography, responsive sizes, WOFF2 fonts, and credits.
- `dist/robots.txt` / `dist/sitemap.xml`: SEO scaffolding for launch.
- `scripts/serve.mjs`: local static server with long-cache headers for images and fonts.
- `scripts/build.mjs`: minified `release/` output for hosting.
- `LAUNCH.md`: go-live checklist.
- `RESEARCH.md`: live official-site research and resulting design choices.
- `ASSETS.md`: original photo authors, source links, transformations, and licences.

## Real enquiry route

The client supplied **9602970369**, interpreted as the Indian WhatsApp number **+91 96029 70369**. The header planning actions open the planner. After validation, it prepares a URL-encoded message containing the entered trip and contact details for `https://wa.me/919602970369`.

The visitor clicks **Open WhatsApp to send**, reviews the message in WhatsApp, and taps Send. The website never claims the message has been sent automatically, never sends through a server, and never confirms a booking. The footer and floating chat action also open this real WhatsApp contact. Confirm the country code and ownership with the client before a public launch.

Name and country are required; email and phone are optional. A past departure date is rejected. No personal information is saved to local storage unless the visitor checks the optional save checkbox. The page also offers a downloadable enquiry copy and a privacy action to delete a saved request. Saving can fail gracefully when browser storage is blocked. No payment, CRM, email service, inventory system, customer login, analytics, cookies for tracking, or newsletter is connected.

## Configure before public launch

Follow the full checklist in **LAUNCH.md**. Short version:

1. Edit `dist/site-config.js` (domain, WhatsApp, optional enquiry email, indexing flag, support hours).
2. Replace illustrative journeys in `dist/data.js` with verified client offers.
3. Approve privacy / booking terms, then run `npm run build` and host `release/`.
4. Flip `allowIndexing` only after content approval.
5. Keep photo credits in `ASSETS.md` when changing photography.

## Currency display

The selector supports USD, INR, GBP, and EUR and always labels the currency code. This preview uses fixed **demonstration rates**, not live exchange rates: `1 USD = 85 INR = 0.79 GBP = 0.92 EUR`. Converted prices are rounded to the nearest 10 display-currency units. Rates live in `dist/app.js`; all prices originate as sample USD values in `dist/data.js`. The final written quote and payment currency govern a real booking.

## Responsive and accessible interaction

Layouts accommodate narrow phones, tablets, laptops, and desktops. Native dialog elements provide modal semantics, keyboard focus containment, Escape handling, and focus return; the mobile menu announces its state. Inputs have explicit labels, native validation, 16px text for mobile usability, and generous targets. FAQs use native details/summary, filters expose their selected state, favourite buttons expose pressed state, status updates use live regions, and the page includes a skip link and reduced-motion support.

All photography and fonts are hosted locally. Images below the fold are lazy-loaded, the hero has a matching responsive preload, and there is no client framework runtime. Research observations, recommendations, visual checks, and any known QA limits are recorded separately by the site owner.
