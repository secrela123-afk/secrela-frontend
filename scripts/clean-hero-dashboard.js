const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(
  __dirname,
  "../../docs/design-reference/hero-dashboard-cutout.png",
);
const OUT = path.join(
  __dirname,
  "../public/images/landing/hero-dashboard-preview.png",
);

function isCheckerOrFringe(r, g, b, a) {
  if (a < 12) return true;
  const lum = (r + g + b) / 3;
  const chroma = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (chroma < 18 && lum >= 155) return true;
  if (chroma < 25 && lum >= 190 && a < 230) return true;
  if (lum >= 210 && a < 180) return true;
  return false;
}

function isDarkUi(r, g, b, a) {
  if (a < 40) return false;
  const lum = (r + g + b) / 3;
  if (lum < 95) return true;
  if (g > r + 20 && g > b + 10 && g > 80) return true;
  if (r > 140 && g < 100 && b < 100 && a > 180) return true;
  if (b > r + 15 && b > 100 && a > 180) return true;
  return false;
}

async function main() {
  const scale = 3;
  const meta = await sharp(SRC).metadata();
  const width = Math.round(meta.width * scale);
  const height = Math.round(meta.height * scale);

  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .resize(width, height, { kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { channels } = info;
  const w = info.width;
  const h = info.height;
  const px = Buffer.from(data);

  for (let i = 0; i < px.length; i += channels) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const a = px[i + 3];
    if (isCheckerOrFringe(r, g, b, a) && !isDarkUi(r, g, b, a)) {
      px[i] = 0;
      px[i + 1] = 0;
      px[i + 2] = 0;
      px[i + 3] = 0;
    }
  }

  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const i = idx * channels;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const a = px[i + 3];
    if (a < 8) {
      stack.push(x, y);
      return;
    }
    if (!isDarkUi(r, g, b, a) && isCheckerOrFringe(r, g, b, a)) {
      px[i] = 0;
      px[i + 1] = 0;
      px[i + 2] = 0;
      px[i + 3] = 0;
      stack.push(x, y);
    }
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = px[(y * w + x) * channels + 3];
      if (a > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 16;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  await sharp(px, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .png({ compressionLevel: 9, palette: false })
    .toFile(OUT);

  const outMeta = await sharp(OUT).metadata();
  console.log(
    JSON.stringify({
      out: OUT,
      width: outMeta.width,
      height: outMeta.height,
      hasAlpha: outMeta.hasAlpha,
      bytes: fs.statSync(OUT).size,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
