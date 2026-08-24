// Generates assets/qr-venue-muhurtham.svg and assets/qr-venue-reception.svg —
// decorative, decode-verified QR codes linking to each venue's Google Maps
// location. Run with: node src/gen_qr_venues.js
const QRCode = require("qrcode");
const sharp = require("sharp");
const jsQR = require("jsqr");
const fs = require("fs");
const path = require("path");

const COLOR_BG = "#FFFDF9";
const COLOR_DATA = "#9C6B1F";
const COLOR_FINDER = "#4A0E14";
const COLOR_BORDER_A = "#B8863A";
const COLOR_BORDER_B = "#4A0E14";

function buildQrSvg(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const isDark = (r, c) => !!data[r * size + c];
  function inFinder(r, c) {
    const zones = [[0, 0], [0, size - 7], [size - 7, 0]];
    return zones.some(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7);
  }

  const QUIET = 4, BORDER = 3, OUTER = 1.2;
  const inner = size + QUIET * 2;
  const contentSize = inner + BORDER * 2;
  const total = contentSize + OUTER * 2;

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">`);
  parts.push(`<rect x="0" y="0" width="${total}" height="${total}" fill="${COLOR_BG}"/>`);

  function triangleBand(x, y, w, h, horizontal, flip, colorOffset) {
    const len = horizontal ? w : h;
    const count = Math.max(3, Math.round(len / 2.6));
    const step = len / count;
    let out = "";
    for (let i = 0; i < count; i++) {
      const color = (i + colorOffset) % 2 === 0 ? COLOR_BORDER_A : COLOR_BORDER_B;
      if (horizontal) {
        const xA = x + i * step, xB = x + (i + 1) * step, xM = (xA + xB) / 2;
        const yBase = flip ? y + h : y, yTip = flip ? y : y + h;
        out += `<polygon points="${xA},${yBase} ${xB},${yBase} ${xM},${yTip}" fill="${color}"/>`;
      } else {
        const yA = y + i * step, yB = y + (i + 1) * step, yM = (yA + yB) / 2;
        const xBase = flip ? x + w : x, xTip = flip ? x : x + w;
        out += `<polygon points="${xBase},${yA} ${xBase},${yB} ${xTip},${yM}" fill="${color}"/>`;
      }
    }
    return out;
  }

  const bx = OUTER, by = OUTER, bw = contentSize, bh = contentSize;
  parts.push(triangleBand(bx, by, bw, BORDER, true, false, 0));
  parts.push(triangleBand(bx, by + bh - BORDER, bw, BORDER, true, true, 1));
  parts.push(triangleBand(bx, by + BORDER, BORDER, bh - BORDER * 2, false, false, 2));
  parts.push(triangleBand(bx + bw - BORDER, by + BORDER, BORDER, bh - BORDER * 2, false, true, 2));

  const contentOrigin = OUTER + BORDER;
  parts.push(`<rect x="${contentOrigin}" y="${contentOrigin}" width="${inner}" height="${inner}" fill="${COLOR_BG}"/>`);

  const moduleOrigin = contentOrigin + QUIET;
  const PAD = 0.05, MOD_W = 1 - PAD * 2, RAD = 0.15;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isDark(r, c) || inFinder(r, c)) continue;
      const x = moduleOrigin + c, y = moduleOrigin + r;
      parts.push(`<rect x="${x + PAD}" y="${y + PAD}" width="${MOD_W}" height="${MOD_W}" rx="${RAD}" fill="${COLOR_DATA}"/>`);
    }
  }

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
  return parts.join("\n");
}

async function verifyDecode(svgStr, expected) {
  const pngBuf = await sharp(Buffer.from(svgStr), { density: 300 }).resize(900, 900).png().toBuffer();
  const { data: raw, info } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.byteLength), info.width, info.height);
  return { ok: !!result && result.data === expected, decoded: result ? result.data : null, pngBuf };
}

async function main() {
  const assets = path.join(__dirname, "..", "assets");
  const jobs = [
    { text: "https://maps.app.goo.gl/9yQ2WYDtduLzmWHZ6?g_st=aw", out: "qr-venue-muhurtham" },
    { text: "https://maps.app.goo.gl/6kH35fFGR4u6ZAB16", out: "qr-venue-reception" }
  ];
  for (const job of jobs) {
    const svg = buildQrSvg(job.text);
    fs.writeFileSync(path.join(assets, `${job.out}.svg`), svg);
    const { ok, decoded, pngBuf } = await verifyDecode(svg, job.text);
    fs.writeFileSync(path.join(assets, `${job.out}-preview.png`), pngBuf);
    console.log(job.out, "->", ok ? "DECODE OK" : `DECODE MISMATCH (got: ${decoded})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
