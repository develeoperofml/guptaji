/**
 * Customer itinerary PDF — content aligned with
 * Manali_Weekend_Sightseeing_Itinerary_13-16_Nov_2026.pdf
 * Output: dist/assets/manali-weekend-itinerary.pdf  (5 pages)
 */
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const assets = path.join(root, "dist", "assets");
const outFile = path.join(assets, "manali-weekend-itinerary.pdf");

const GREEN = "#c46e16";
const ACCENT = "#e8872a";
const INK = "#1a2421";
const MUTED = "#5a635e";
const SAND = "#e9e6e0";
const MIST = "#f3eee8";
const WHITE = "#ffffff";
const WARN = "#f8e6cf";
const ALERT = "#f3e4e0";
const TOTAL = 5;

async function jpeg(name, w, h, pos = "centre") {
  return sharp(path.join(assets, name))
    .rotate()
    .resize({ width: w, height: h, fit: "cover", position: pos })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

function bar(doc) {
  doc.rect(0, 0, doc.page.width, 6).fill(GREEN);
  doc.rect(0, 6, doc.page.width, 2).fill(ACCENT);
}

function foot(doc, n) {
  // Stay above bottom margin or PDFKit auto-adds blank pages.
  const y = doc.page.height - doc.page.margins.bottom - 12;
  doc.fillColor(MUTED).font("Helvetica").fontSize(7);
  doc.text(
    "Gupta Ji Tour & Travels  |  +91 96029 70369  |  guptajitourtravel.cognivx.com/stranger-trips",
    36,
    y,
    { width: 480, lineBreak: false },
  );
  doc.text(`${n} / ${TOTAL}`, 530, y, { width: 40, align: "right", lineBreak: false });
}

function label(doc, t, x, y) {
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text(t.toUpperCase(), x, y);
}

function title(doc, t, x, y) {
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(16).text(t, x, y);
}

function noteBox(doc, x, y, w, h, heading, text, bg) {
  doc.roundedRect(x, y, w, h, 5).fill(bg);
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(7.5).text(heading.toUpperCase(), x + 10, y + 8);
  doc.fillColor(INK).font("Helvetica").fontSize(8).text(text, x + 10, y + 20, {
    width: w - 20,
    lineGap: 1,
  });
}

function times(doc, rows, x, y, w) {
  const tw = 78;
  for (const [time, plan] of rows) {
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(7.5).text(time, x, y, { width: tw });
    doc.fillColor(INK).font("Helvetica").fontSize(8).text(plan, x + tw, y, { width: w - tw });
    y += 11.5;
  }
  return y;
}

async function build() {
  await mkdir(assets, { recursive: true });
  const [cover, road, tents, pathStay, room, solang, hadimba, bonfire, campfire] =
    await Promise.all([
      jpeg("manali-tents-main.webp", 1400, 520),
      jpeg("manali-road.webp", 560, 320),
      jpeg("manali-stay-tents.webp", 560, 320),
      jpeg("manali-stay-path.webp", 560, 320),
      jpeg("manali-stay-room-a.webp", 560, 320),
      jpeg("manali-solang.webp", 560, 300),
      jpeg("manali-hadimba.webp", 560, 300),
      jpeg("manali-night-bonfire-card.webp", 640, 400),
      jpeg("manali-stay-campfire.webp", 560, 320),
    ]);

  const doc = new PDFDocument({
    size: "A4",
    autoFirstPage: true,
    bufferPages: true,
    margins: { top: 28, left: 36, right: 36, bottom: 40 },
    info: {
      Title: "Manali Weekend Escape - Customer Sightseeing Itinerary",
      Author: "Gupta Ji Tour & Travels",
      Subject: "Aligned with Manali Weekend Sightseeing Itinerary organizer guide",
    },
  });
  const stream = createWriteStream(outFile);
  doc.pipe(stream);

  // ── PAGE 1 cover ──
  bar(doc);
  doc.image(cover, 0, 14, { width: 595, height: 210 });
  doc.save();
  doc.rect(0, 14, 595, 210).fillOpacity(0.3).fill(GREEN).fillOpacity(1);
  doc.restore();
  const logoBuf = await sharp(path.join(assets, "logo.png"))
    .resize(220, 220)
    .png()
    .toBuffer();
  doc.image(logoBuf, 470, 28, { width: 88, height: 88 });
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9).text("GUPTA JI TOUR & TRAVELS", 36, 30);
  doc.font("Helvetica").fontSize(8).text("CUSTOMER ITINERARY  |  EVERY WEEKEND", 36, 44);
  doc.font("Helvetica-Bold").fontSize(24).text("MANALI WEEKEND ESCAPE", 36, 72);
  doc.font("Helvetica").fontSize(10).text("Sightseeing itinerary  |  Delhi NCR  >  Manali  >  Delhi NCR", 36, 108);
  doc.fontSize(8.5).text("Real tent stay + bonfire photos  |  Solang & Hadimba circuit", 36, 126);

  const chips = [
    ["4 DAYS", "Fri night to Mon"],
    ["3 NIGHTS", "2 travel + 1 stay"],
    ["10:00 PM", "Friday departure"],
    ["9:00 PM", "Sunday return"],
  ];
  let x = 36;
  for (const [a, b] of chips) {
    doc.roundedRect(x, 240, 120, 40, 5).fill(SAND);
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(9).text(a, x + 10, 248);
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(b, x + 10, 262);
    x += 128;
  }

  label(doc, "Important trip format", 36, 298);
  doc.fillColor(INK).font("Helvetica").fontSize(9).text(
    "Two overnight road journeys, one tent / hotel night in Manali (Saturday), sightseeing Saturday afternoon and Sunday. Sunday stay access via late checkout or day-use until about 7:00-8:00 PM.",
    36,
    312,
    { width: 523, lineGap: 1.5 },
  );

  label(doc, "Package prices per person", 36, 360);
  doc.roundedRect(36, 374, 523, 52, 6).fill(MIST);
  [
    ["Quad", "Rs 5,500"],
    ["Double", "Rs 6,000"],
    ["Single", "Rs 6,500"],
    ["Meals", "Breakfast + dinner"],
  ].forEach(([k, v], i) => {
    const cx = 50 + i * 128;
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(k, cx, 382);
    doc.fillColor(i === 0 ? ACCENT : GREEN)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(v, cx, 396);
  });

  doc.fillColor(INK).font("Helvetica").fontSize(9).text(
    "Sightseeing-first mountain getaway: temples, valleys, village lanes, riverside and Himalayan views. Paid adventure activities are excluded. Same Fri-Mon rhythm every weekend - host confirms your dates on WhatsApp.",
    36,
    444,
    { width: 523, lineGap: 1.5 },
  );

  doc.image(tents, 36, 500, { width: 255, height: 145 });
  doc.image(bonfire, 304, 500, { width: 255, height: 145 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5);
  doc.text("Your Manali tent stay", 36, 650);
  doc.text("Bonfire / night with the group", 304, 650);

  noteBox(
    doc,
    36,
    670,
    523,
    42,
    "Based on our sightseeing plan",
    "Day times and places follow the Manali Weekend Sightseeing Itinerary guide. Live weekend seat, pickup and quote confirmed by host before travel.",
    WARN,
  );
  foot(doc, 1);

  // ── PAGE 2 overview ──
  doc.addPage();
  bar(doc);
  label(doc, "01  Trip overview", 36, 28);
  title(doc, "Trip at a glance", 36, 42);
  const overview = [
    ["Rhythm", "Every weekend | Fri 10:00 PM leave > Sun 9:00 PM return start"],
    ["Delhi arrival", "Monday about 10:00 AM-1:00 PM - not guaranteed"],
    ["Stay pattern", "Two overnight journeys in vehicle + one Manali tent / hotel night"],
    ["Core route", "Delhi NCR > Manali > Solang / town sightseeing > Delhi NCR"],
    ["Style", "Sightseeing only - viewpoints, temples, villages, markets, riverside"],
    ["Pickup", "Delhi, Gurugram, Noida, Ghaziabad, Faridabad or Chandigarh"],
  ];
  let y = 72;
  for (const [k, v] of overview) {
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8).text(k, 36, y, { width: 95 });
    doc.fillColor(INK).font("Helvetica").fontSize(8.5).text(v, 140, y, { width: 420 });
    y += 15;
  }
  noteBox(
    doc,
    36,
    y + 4,
    523,
    40,
    "The sightseeing approach",
    "Prioritize Manali town + Solang. Keep Atal Tunnel-Sissu and Naggar as alternatives - do not force into the same day.",
    MIST,
  );
  y += 56;
  label(doc, "Primary places to prioritize", 36, y);
  y += 14;
  const places = [
    ["Must", "Solang Valley", "~13 km - open Himalayan valley & photos"],
    ["Must", "Hadimba Devi Temple", "Cedar forest pagoda temple; Ghatotkacha nearby"],
    ["Must", "Old Manali", "Village lanes, cafes, Manu Temple"],
    ["Core", "Mall Road / Gompa", "Markets + Himalayan Nyingmapa Monastery"],
    ["If time", "Vashisht", "Drop first if the day runs late"],
    ["Scenic", "Nehru Kund / Kothi", "Short stops toward Solang"],
    ["Optional", "Atal Tunnel / Sissu", "Full-day only if weather & roads allow"],
    ["Alt", "Naggar heritage", "Castle circuit as a heritage swap"],
  ];
  for (const [tag, name, why] of places) {
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(7.5).text(tag, 36, y, { width: 45 });
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8.5).text(name, 86, y, { width: 130 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(why, 230, y, { width: 330 });
    y += 14;
  }
  y += 8;
  doc.image(solang, 36, y, { width: 255, height: 150 });
  doc.image(hadimba, 304, y, { width: 255, height: 150 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5);
  doc.text("Solang Valley - must visit", 36, y + 156);
  doc.text("Hadimba Devi Temple - must visit", 304, y + 156);

  y += 178;
  noteBox(
    doc,
    36,
    y,
    523,
    48,
    "Do not overload the short trip",
    "Naggar, Jogini Waterfall, Rahala or Gulaba are alternatives. Do not squeeze them into the Sunday Solang + town circuit.",
    WARN,
  );
  foot(doc, 2);

  // ── PAGE 3 Day 0-1 ──
  doc.addPage();
  bar(doc);
  label(doc, "02  Day-by-day plan", 36, 28);
  title(doc, "Friday departure & Saturday arrival", 36, 42);

  y = 70;
  doc.image(road, 36, y, { width: 200, height: 118 });
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("DAY 1  FRIDAY", 252, y);
  doc.fillColor(GREEN).fontSize(11).text("Delhi NCR departure", 252, y + 12);
  times(
    doc,
    [
      ["8:30 PM", "Passenger reporting and attendance"],
      ["9:00 PM", "Luggage loading and seat allocation"],
      ["9:30 PM", "Trip briefing and introductions"],
      ["10:00 PM", "Depart Delhi NCR"],
      ["12:00-12:30", "Short refreshment break"],
      ["Overnight", "Continue to Manali with meal & driver rests"],
    ],
    252,
    y + 32,
    308,
  );

  y = 200;
  doc.fillColor(INK).font("Helvetica").fontSize(8).text(
    "Coordinator phone, vehicle details and emergency contact shared before departure. Keep music/conversation from distracting the driver. Safe designated stops only.",
    36,
    y,
    { width: 523 },
  );
  noteBox(
    doc,
    36,
    y + 28,
    523,
    38,
    "Driver safety",
    "Experienced mountain-route driver with a documented rest plan for overnight journeys.",
    ALERT,
  );

  y = 290;
  doc.image(pathStay, 36, y, { width: 200, height: 118 });
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("DAY 2  SATURDAY", 252, y);
  doc.fillColor(GREEN).fontSize(11).text("Arrival & Manali town", 252, y + 12);
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(
    "Expected arrival 12:00-3:00 PM (traffic, road, weather).",
    252,
    y + 28,
    { width: 308 },
  );
  times(
    doc,
    [
      ["12:00-3:00 PM", "Arrive Manali (estimated)"],
      ["3:00-4:00 PM", "Tent/hotel check-in, lunch, rest"],
      ["4:00-4:30 PM", "Himalayan Nyingmapa Monastery / Gompa"],
      ["4:30-5:30 PM", "Mall Road and Tibetan Market"],
      ["5:30-6:15 PM", "Beas Riverside if daylight allows"],
      ["7:30-8:30 PM", "Dinner + evening bonfire + overnight stay"],
    ],
    252,
    y + 42,
    308,
  );

  y = 430;
  noteBox(
    doc,
    36,
    y,
    523,
    44,
    "Stay access matters",
    "Arrange Saturday early check-in if needed. Sunday late checkout / day-use until ~7:00-8:00 PM because return leaves at 9:00 PM. One standard night does not automatically include Sunday evening rooms.",
    WARN,
  );

  y = 490;
  doc.image(tents, 36, y, { width: 255, height: 145 });
  doc.image(room, 304, y, { width: 255, height: 145 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5);
  doc.text("Tent cottages - your Manali stay", 36, y + 150);
  doc.text("Room interiors (sharing confirmed on booking)", 304, y + 150);

  y = 660;
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(
    "Possible extra if early: Van Vihar near town centre - only with daylight and local opening hours.",
    36,
    y,
    { width: 523 },
  );
  foot(doc, 3);

  // ── PAGE 4 Sunday + Monday (compact 2-col schedule) ──
  doc.addPage();
  bar(doc);
  label(doc, "03  Main sightseeing day", 36, 28);
  title(doc, "Sunday circuit & Monday return", 36, 42);

  y = 68;
  doc.image(solang, 36, y, { width: 255, height: 130 });
  doc.image(hadimba, 304, y, { width: 255, height: 130 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7);
  doc.text("Solang Valley", 36, y + 134);
  doc.text("Hadimba + Dhungri Forest", 304, y + 134);

  y = 220;
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("DAY 3  SUNDAY", 36, y);
  doc.fillColor(GREEN).fontSize(11).text("Main sightseeing day", 140, y);
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(
    "Ambitious plan - flex for traffic, parking, weather. 9:00 PM return is fixed.",
    36,
    y + 16,
    { width: 523 },
  );

  const leftSun = [
    ["6:45 AM", "Wake up"],
    ["7:00-7:30", "Breakfast"],
    ["7:45 AM", "Depart stay"],
    ["8:00-8:20", "Nehru Kund"],
    ["8:30-9:00", "Kothi viewpoint"],
    ["9:15-11:15", "Solang Valley viewpoints"],
    ["11:15-12:15", "Return toward Manali"],
    ["12:15-1:00", "Lunch"],
    ["1:15-2:00", "Hadimba + Dhungri Forest"],
  ];
  const rightSun = [
    ["2:00-2:20", "Ghatotkacha Temple"],
    ["2:30-3:30", "Old Manali / Manu Temple"],
    ["3:45-4:30", "Vashisht (if time)"],
    ["4:30-5:30", "Town / shopping / free time"],
    ["6:00-7:00", "Dinner"],
    ["7:00-8:15", "Luggage & freshen up"],
    ["8:15-9:00", "Attendance + loading"],
    ["9:00 PM", "Depart Manali for Delhi NCR"],
  ];
  times(doc, leftSun, 36, y + 34, 250);
  times(doc, rightSun, 310, y + 34, 250);

  y = 400;
  noteBox(
    doc,
    36,
    y,
    523,
    40,
    "Realistic flexibility",
    "If Solang delays you, drop Vashisht first. Do not rush temples. Keep Sunday 9:00 PM departure.",
    WARN,
  );

  y = 456;
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(
    "Route outline: Stay > Nehru Kund > Kothi > Solang > Hadimba + Dhungri > Old Manali / Manu > Vashisht > Mall Road / stay. Confirm parking locally.",
    36,
    y,
    { width: 523 },
  );

  y = 490;
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("DAY 4  MONDAY", 36, y);
  doc.fillColor(GREEN).fontSize(11).text("Return arrival", 140, y);
  times(
    doc,
    [
      ["Sun 9:00 PM", "Depart Manali"],
      ["Overnight", "Return with planned driver-rest and meal breaks"],
      ["Mon 10AM-1PM", "Expected Delhi NCR arrival - not guaranteed"],
    ],
    36,
    y + 18,
    523,
  );

  y = 560;
  doc.image(campfire, 36, y, { width: 255, height: 145 });
  doc.image(bonfire, 304, y, { width: 255, height: 145 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5);
  doc.text("Bonfire seating circle", 36, y + 150);
  doc.text("Night bonfire with lit tents", 304, y + 150);

  y = 730;
  doc.fillColor(INK).font("Helvetica").fontSize(8).text(
    "Optional instead of core circuit (not both): Atal Tunnel-Sissu (full day, weather dependent) or Naggar heritage half-day. Rohtang is not in the standard core plan.",
    36,
    y,
    { width: 523 },
  );
  foot(doc, 4);

  // ── PAGE 5 stay + book ──
  doc.addPage();
  bar(doc);
  label(doc, "04  Stay, inclusions & booking", 36, 28);
  title(doc, "What is included  |  how to book", 36, 42);

  y = 70;
  doc.image(tents, 36, y, { width: 255, height: 140 });
  doc.image(room, 304, y, { width: 255, height: 140 });
  y = 220;
  doc.image(bonfire, 36, y, { width: 523, height: 175 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(
    "Real photos from the Manali stay - tents, rooms and bonfire night.",
    36,
    y + 180,
  );

  y = 420;
  label(doc, "Included", 36, y);
  label(doc, "Not promised", 300, y);
  y += 14;
  const inc = [
    "Breakfast and dinner",
    "Shared coach / Traveller-class vehicle",
    "Delhi NCR pickup coordination",
    "One Manali tent / hotel night",
    "Sightseeing circuit + mountain driver plan",
  ];
  const exc = [
    "Guaranteed snowfall",
    "Rohtang / Sissu every week",
    "Paid adventure activities",
    "Fixed Monday arrival to the minute",
  ];
  for (let i = 0; i < 5; i++) {
    if (inc[i]) doc.fillColor(INK).font("Helvetica").fontSize(8.5).text("•  " + inc[i], 36, y);
    if (exc[i]) doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text("•  " + exc[i], 300, y);
    y += 13;
  }

  y += 10;
  noteBox(
    doc,
    36,
    y,
    523,
    40,
    "Pack warm",
    "Layers, waterproof outerwear and shoes with grip. Hills change quickly. Recheck weather and road status before higher routes.",
    MIST,
  );

  y += 56;
  doc.roundedRect(36, y, 523, 78, 8).fill(GREEN);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(12).text("Book your seat", 50, y + 12);
  doc.font("Helvetica").fontSize(9).text(
    "WhatsApp / Call   +91 96029 70369\nInstagram   @guptaji_travels01\nWeb   guptajitourtravel.cognivx.com/stranger-trips",
    50,
    y + 30,
    { lineGap: 2 },
  );

  y += 92;
  doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(
    "Customer PDF for Gupta Ji Tour & Travels. Day plan aligned with the Manali Weekend Sightseeing Itinerary organizer guide. Final seat type, pickup point and quote confirmed by host on WhatsApp.",
    36,
    y,
    { width: 523 },
  );
  foot(doc, 5);

  doc.end();
  await new Promise((res, rej) => {
    stream.on("finish", res);
    stream.on("error", rej);
  });
  console.log(`Wrote ${path.relative(root, outFile)} (${Math.round((await stat(outFile)).size / 1024)} KiB)`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
