// Generates assets/qr-share.svg — a decorative, decode-verified QR code linking
// to the published invitation page. Run with: node src/gen_qr_share.js
const QRCode = require("qrcode");
const sharp = require("sharp");
const jsQR = require("jsqr");
const fs = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "..", "assets");
const URL_TO_ENCODE = "https://claude.ai/code/artifact/9fb71e4a-0010-462b-aaaa-09ad089f504e";

const COLOR_BG = "#FFFDF9";
const COLOR_DATA = "#9C6B1F";    // deep gold — data modules
const COLOR_FINDER = "#4A0E14"; // maroon-deep — finder eyes (max contrast)
const COLOR_BORDER_A = "#B8863A"; // gold
const COLOR_BORDER_B = "#4A0E14"; // maroon-deep

const qr = QRCode.create(URL_TO_ENCODE, { errorCorrectionLevel: "H" });
const size = qr.modules.size;
const data = qr.modules.data;
const isDark = (r, c) => !!data[r * size + c];

function inFinder(r, c) {
  const zones = [[0, 0], [0, size - 7], [size - 7, 0]];
  return zones.some(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7);
}

const QUIET = 4;   // plain quiet zone around the QR, required for reliable scanning
const BORDER = 3;  // decorative triangle band thickness
const OUTER = 1.2; // plain cream margin outside the border

const inner = size + QUIET * 2;
const contentSize = inner + BORDER * 2; // quiet zone + border band
const total = contentSize + OUTER * 2;

const parts = [];
parts.push(`<svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">`);
parts.push(`<rect x="0" y="0" width="${total}" height="${total}" fill="${COLOR_BG}"/>`);

// --- decorative triangle border ring, drawn as one band per side, triangles point inward ---
function triangleBand(x, y, w, h, horizontal, flip, colorOffset) {
  const len = horizontal ? w : h;
  const count = Math.max(3, Math.round(len / 2.6));
  const step = len / count;
  let out = "";
  for (let i = 0; i < count; i++) {
    const color = (i + colorOffset) % 2 === 0 ? COLOR_BORDER_A : COLOR_BORDER_B;
    if (horizontal) {
      const xA = x + i * step, xB = x + (i + 1) * step, xM = (xA + xB) / 2;
      const yBase = flip ? y + h : y;
      const yTip = flip ? y : y + h;
      out += `<polygon points="${xA},${yBase} ${xB},${yBase} ${xM},${yTip}" fill="${color}"/>`;
    } else {
      const yA = y + i * step, yB = y + (i + 1) * step, yM = (yA + yB) / 2;
      const xBase = flip ? x + w : x;
      const xTip = flip ? x : x + w;
      out += `<polygon points="${xBase},${yA} ${xBase},${yB} ${xTip},${yM}" fill="${color}"/>`;
    }
  }
  return out;
}

const bx = OUTER, by = OUTER, bw = contentSize, bh = contentSize;
parts.push(triangleBand(bx, by, bw, BORDER, true, false, 0));                       // top, tips pointing down
parts.push(triangleBand(bx, by + bh - BORDER, bw, BORDER, true, true, 1));          // bottom, tips pointing up
parts.push(triangleBand(bx, by + BORDER, BORDER, bh - BORDER * 2, false, false, 2)); // left, tips pointing right
parts.push(triangleBand(bx + bw - BORDER, by + BORDER, BORDER, bh - BORDER * 2, false, true, 2)); // right, tips pointing left

// plain cream field for quiet zone + QR content, drawn over the border's inner edge
const contentOrigin = OUTER + BORDER;
parts.push(`<rect x="${contentOrigin}" y="${contentOrigin}" width="${inner}" height="${inner}" fill="${COLOR_BG}"/>`);

// --- QR data modules (subtly rounded — verified against a decode test to stay scannable) ---
const moduleOrigin = contentOrigin + QUIET;
const PAD = 0.05;
const MOD_W = 1 - PAD * 2;
const RAD = 0.15;
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!isDark(r, c) || inFinder(r, c)) continue;
    const x = moduleOrigin + c, y = moduleOrigin + r;
    parts.push(`<rect x="${x + PAD}" y="${y + PAD}" width="${MOD_W}" height="${MOD_W}" rx="${RAD}" fill="${COLOR_DATA}"/>`);
  }
}

// --- finder eyes: exact concentric solid squares (only outer corners cosmetically rounded) ---
function finderEye(originR, originC) {
  const x = moduleOrigin + originC, y = moduleOrigin + originR;
  let out = "";
  out += `<rect x="${x}" y="${y}" width="7" height="7" rx="1.2" fill="${COLOR_FINDER}"/>`;
  out += `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="${COLOR_BG}"/>`;
  out += `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.5" fill="${COLOR_FINDER}"/>`;
  return out;
}
parts.push(finderEye(0, 0));
parts.push(finderEye(0, size - 7));
parts.push(finderEye(size - 7, 0));

parts.push(`</svg>`);
const svgStr = parts.join("\n");

fs.writeFileSync(path.join(ASSETS, "qr-share.svg"), svgStr);
console.log("SVG written. total viewBox:", total, "| module grid:", size, "x", size);

sharp(Buffer.from(svgStr), { density: 300 })
  .resize(900, 900)
  .png()
  .toBuffer()
  .then(async (pngBuf) => {
    fs.writeFileSync(path.join(ASSETS, "qr-share-preview.png"), pngBuf);
    const { data: raw, info } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const result = jsQR(new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.byteLength), info.width, info.height);
    if (result) {
      console.log("DECODE OK:", result.data);
      console.log("MATCH:", result.data === URL_TO_ENCODE);
    } else {
      console.log("DECODE FAILED");
    }
  })
  .catch(e => { console.error("Rasterize error:", e); process.exit(1); });
