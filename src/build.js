// Rebuilds the self-contained invitation.html from src/invitation_src.html by
// inlining the video, poster image, and QR SVGs as they're referenced by the
// PLACEHOLDER tokens in the source file. Run with: node src/build.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcPath = path.join(root, "src", "invitation_src.html");
const outPath = path.join(root, "invitation.html");

let html = fs.readFileSync(srcPath, "utf8");

const videoB64 = fs.readFileSync(path.join(root, "assets", "couple.mp4")).toString("base64");
const posterB64 = fs.readFileSync(path.join(root, "assets", "poster.jpg")).toString("base64");
const qrShareSvg = fs.readFileSync(path.join(root, "assets", "qr-share.svg"), "utf8");
const qrMuhurthamSvg = fs.readFileSync(path.join(root, "assets", "qr-venue-muhurtham.svg"), "utf8");
const qrReceptionSvg = fs.readFileSync(path.join(root, "assets", "qr-venue-reception.svg"), "utf8");

html = html.replace("VIDEO_SRC_PLACEHOLDER", "data:video/mp4;base64," + videoB64);
html = html.replace("POSTER_SRC_PLACEHOLDER", "data:image/jpeg;base64," + posterB64);
html = html.replace("QR_SVG_PLACEHOLDER", qrShareSvg);
html = html.replace("QR_VENUE_MUHURTHAM_PLACEHOLDER", qrMuhurthamSvg);
html = html.replace("QR_VENUE_RECEPTION_PLACEHOLDER", qrReceptionSvg);

const leftovers = html.match(/[A-Z_]+_PLACEHOLDER/g);
if (leftovers) {
  console.error("Build failed — unresolved placeholders:", leftovers);
  process.exit(1);
}

fs.writeFileSync(outPath, html);
console.log("Built", outPath, "(" + (fs.statSync(outPath).size / 1024 / 1024).toFixed(2) + " MB)");
