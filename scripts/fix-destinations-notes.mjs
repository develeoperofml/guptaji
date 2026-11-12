import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../dist/index.html", import.meta.url);
let html = await readFile(path, "utf8");

const destStart = html.indexOf('class="destinations section container"');
const faqStart = html.indexOf('class="faq-section section container"');
if (destStart < 0 || faqStart < 0) throw new Error("markers missing");

const sectionStart = html.lastIndexOf("<section", destStart);
const faqSectionStart = html.lastIndexOf("<section", faqStart);

const indiaCard = `<button class="destination-card" data-destination="India">
            <img
              src="assets/india.webp"
              srcset="assets/india-small.webp 500w, assets/india.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="The pink sandstone Hawa Mahal in Jaipur, India"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">JAIPUR BASE</span
              ><strong>India</strong
              ><span>Cabs, sightseeing, and road journeys from Jaipur.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span></button>`;

const italyCard = `<button class="destination-card" data-destination="Italy">
            <img
              src="assets/italy.webp"
              srcset="assets/italy-small.webp 500w, assets/italy.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="Colourful coastal houses of Cinque Terre in Italy"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">LA DOLCE VITA</span
              ><strong>Italy</strong
              ><span>Beautifully, unhurriedly yours.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span></button>`;

const japanCard = `<button class="destination-card" data-destination="Japan">
            <img
              src="assets/japan.webp"
              srcset="assets/japan-small.webp 500w, assets/japan.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="Vermilion torii gates at Fushimi Inari in Kyoto, Japan"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">OLD SOUL, NEW WORLDS</span
              ><strong>Japan</strong
              ><span>A little wonder around every corner.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span></button>`;

const baliCard = `<button class="destination-card" data-destination="Bali">
            <img
              src="assets/bali.webp"
              srcset="assets/bali-small.webp 500w, assets/bali.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="Lush green rice terraces in Bali"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">FIND YOUR SLOW</span
              ><strong>Bali</strong
              ><span>Island days. A different kind of time.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span></button>`;

const swissCard = `<button
            class="destination-card extra-destination"
            data-destination="Switzerland"
            hidden
          >
            <img
              src="assets/swiss.webp"
              srcset="assets/swiss-small.webp 500w, assets/swiss.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="Mountain peaks and a Swiss alpine landscape"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">TAKE THE SCENIC ROUTE</span
              ><strong>Switzerland</strong
              ><span>Fresh perspectives at every altitude.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span></button>`;

const kenyaCard = `<button
            class="destination-card extra-destination"
            data-destination="Kenya"
            hidden
          >
            <img
              src="assets/safari.webp"
              srcset="assets/safari-small.webp 500w, assets/safari.webp 1000w"
              sizes="(max-width:700px) 45vw, 30vw"
              alt="Sunrise over Amboseli National Park in Kenya"
              width="800"
              height="1000"
              loading="lazy"
            /><span class="destination-text"
              ><span class="destination-tag">INTO THE WILD</span
              ><strong>Kenya</strong
              ><span>Wide open spaces. Extraordinary encounters.</span></span
            ><span class="round-arrow"
              ><svg class="icon"><use href="#arrow-up" /></svg
            ></span>
          </button>`;

const rebuilt = `      <section
        class="destinations section container"
        id="destinations"
        aria-labelledby="destination-title"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">BEYOND INDIA</p>
            <h2 id="destination-title">
              Also explore further<br /><em>afield.</em>
            </h2>
          </div>
          <div class="section-intro">
            <p>
              International inspiration when you want it — kept secondary to our
              core India services from Jaipur.
            </p>
            <button class="text-link" id="all-destinations">
              Explore all destinations
              <svg class="icon"><use href="#arrow-up" /></svg>
            </button>
          </div>
        </div>
        <div class="destination-grid">
          ${indiaCard}
          ${italyCard}
          ${japanCard}
          ${baliCard}
          ${swissCard}
          ${kenyaCard}
        </div>
      </section>
      <section
        class="travel-notes section container"
        id="travel-notes"
        aria-labelledby="notes-title"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">USEFUL BEFORE YOU TRAVEL</p>
            <h2 id="notes-title">Notes for <em>India days.</em></h2>
          </div>
          <p class="section-intro">
            Practical inspiration for Jaipur, Delhi,<br />and the roads between.
          </p>
        </div>
        <div class="notes-grid">
          <button class="note-card note-featured" data-article="india">
            <div class="note-image">
              <img
                src="assets/india.webp"
                srcset="assets/india-small.webp 500w, assets/india.webp 1000w"
                sizes="(max-width:700px) 45vw, 30vw"
                alt="The intricate facade of Hawa Mahal in Jaipur"
                width="1000"
                height="600"
                loading="lazy"
              /><span class="round-arrow"
                ><svg class="icon"><use href="#arrow-up" /></svg
              ></span>
            </div>
            <span class="note-meta"
              >FIRST-TIME FAVOURITES <span>4 MIN READ</span></span
            >
            <h3>
              India's Golden Triangle:<br />where do you begin?
            </h3>
          </button>
          <div class="note-side">
            <button class="note-card note-horizontal" data-article="japan">
              <img
                src="assets/japan.webp"
                srcset="assets/japan-small.webp 500w, assets/japan.webp 1000w"
                sizes="(max-width:700px) 45vw, 30vw"
                alt="Torii gates along the Fushimi Inari walkway in Kyoto"
                width="500"
                height="450"
                loading="lazy"
              /><span
                ><span class="note-meta">BEYOND INDIA</span>
                <h3>Japan, at your own pace.<br />Space between the sights.</h3>
                <span class="text-link"
                  >Read the story
                  <svg class="icon"><use href="#arrow-up" /></svg></span
              ></span></button
            ><button class="note-card note-horizontal" data-article="walking">
              <img
                src="assets/amber.webp"
                alt="Amber Fort in Jaipur at golden hour"
                width="500"
                height="450"
                loading="lazy"
              /><span
                ><span class="note-meta">CITY DAY TIP</span>
                <h3>A sightseeing day<br />that still feels unhurried.</h3>
                <span class="text-link"
                  >Read the story
                  <svg class="icon"><use href="#arrow-up" /></svg></span
              ></span>
            </button>
          </div>
        </div>
      </section>
`;

html = html.slice(0, sectionStart) + rebuilt + html.slice(faqSectionStart);
await writeFile(path, html);
console.log("Fixed destinations + travel-notes structure.");
