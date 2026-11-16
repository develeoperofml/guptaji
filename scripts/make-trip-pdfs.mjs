/** Lightweight itinerary PDFs for top-5 stranger trips. */
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");
const { allTrips } = await import(
  pathToFileURL(path.join(dist, "trips", "catalog.js")).href
);

function writeTripPdf(trip) {
  const outPath = path.join(assets, path.basename(trip.pdfPath));
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc
    .fontSize(18)
    .fillColor("#0c1c26")
    .text("Gupta Ji Tour & Travels", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(22).text(`${trip.name} Stranger Trip`);
  doc
    .fontSize(11)
    .fillColor("#334")
    .text(
      `${trip.durationLabel} · From ₹${trip.fromPrice.toLocaleString("en-IN")} · ${trip.departureLabel}`,
    );
  doc.moveDown();
  doc.fontSize(12).fillColor("#0c1c26").text(trip.heroLead, { width: 500 });
  doc.moveDown();

  doc.fontSize(14).text("Sharing prices");
  doc.moveDown(0.4);
  for (const s of trip.sharing) {
    doc
      .fontSize(11)
      .text(`${s.label}: ₹${s.price.toLocaleString("en-IN")} / person — ${s.hint}`);
  }
  doc.moveDown();

  doc.fontSize(14).text("Itinerary outline");
  doc.moveDown(0.4);
  for (const day of trip.itinerary) {
    doc.fontSize(12).fillColor("#0c1c26").text(day.title);
    for (const line of day.body) {
      doc.fontSize(10).fillColor("#334").text(`• ${line}`, { width: 500 });
    }
    doc.moveDown(0.5);
  }

  doc.fontSize(14).fillColor("#0c1c26").text("Included");
  doc.moveDown(0.3);
  for (const item of trip.included) {
    doc.fontSize(10).fillColor("#334").text(`• ${item}`);
  }
  doc.moveDown();
  doc.fontSize(14).fillColor("#0c1c26").text("Not promised");
  doc.moveDown(0.3);
  for (const item of trip.notPromised) {
    doc.fontSize(10).fillColor("#334").text(`• ${item}`);
  }
  doc.moveDown();
  doc
    .fontSize(9)
    .fillColor("#666")
    .text(
      "Host confirms seats on WhatsApp. Order may flex for weather and roads. No payment on the website.",
    );

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outPath));
    stream.on("error", reject);
  });
}

for (const trip of allTrips()) {
  const out = await writeTripPdf(trip);
  console.log("wrote", path.basename(out));
}
console.log("done");
