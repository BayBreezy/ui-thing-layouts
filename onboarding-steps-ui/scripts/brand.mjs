// Renders the raster brand assets from public/waypoint.svg:
//   public/apple-touch-icon.png (180x180, opaque) and public/favicon.ico (16 and 32 px PNG entries).
// Run it with `node scripts/brand.mjs`. It needs Playwright's Chromium (bunx playwright install chromium).
import { readFile, writeFile } from "node:fs/promises";

import { chromium } from "playwright";

const svg = await readFile("public/waypoint.svg", "utf8");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  async function render(size, { opaque = false } = {}) {
    await page.setViewportSize({ width: size, height: size });
    // The apple-touch-icon is full bleed on a solid color, because iOS rounds the corners itself.
    const inner = opaque
      ? `<div style="width:${size}px;height:${size}px;background:#1d4ed8;display:grid;place-items:center"><div style="width:${Math.round(size * 0.7)}px;height:${Math.round(size * 0.7)}px">${svg.replace('rx="10"', 'rx="0" fill-opacity="0"')}</div></div>`
      : `<div style="width:${size}px;height:${size}px">${svg}</div>`;
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{width:100%;height:100%;display:block}</style>${inner}`
    );
    return page.screenshot({
      omitBackground: !opaque,
      clip: { x: 0, y: 0, width: size, height: size },
    });
  }
  await writeFile("public/apple-touch-icon.png", await render(180, { opaque: true }));
  const entries = [await render(16), await render(32)];
  // An .ico is a small header followed by the images; modern browsers accept PNG payloads.
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach((png, index) => {
    const size = index === 0 ? 16 : 32;
    const at = 6 + index * 16;
    header.writeUInt8(size, at);
    header.writeUInt8(size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  await writeFile("public/favicon.ico", Buffer.concat([header, ...entries]));
} finally {
  await browser.close();
}
