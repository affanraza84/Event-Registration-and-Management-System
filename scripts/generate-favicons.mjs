import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="scoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="55%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#3730A3"/>
    </linearGradient>
  </defs>

  <!-- Background tile with smooth squircle corners -->
  <rect width="64" height="64" rx="16" fill="url(#scoutGrad)"/>
  <rect width="61" height="61" x="1.5" y="1.5" rx="14.5" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="1.5"/>

  <!-- Compass dial circle -->
  <circle cx="32" cy="32" r="20" stroke="#FFFFFF" stroke-width="4"/>

  <!-- Scout Compass Needle -->
  <!-- North-East Pointer (Active Scout): Crisp Pure White & Light Ice -->
  <polygon points="43.5,20.5 32,32 27.5,27.5" fill="#FFFFFF"/>
  <polygon points="43.5,20.5 36.5,36.5 32,32" fill="#E0E7FF"/>

  <!-- South-West Pointer: Soft Periwinkle & Light Indigo -->
  <polygon points="20.5,43.5 32,32 27.5,27.5" fill="#C7D2FE"/>
  <polygon points="20.5,43.5 36.5,36.5 32,32" fill="#A5B4FC"/>

  <!-- Center Pivot Pin -->
  <circle cx="32" cy="32" r="3.5" fill="#FFFFFF"/>
  <circle cx="32" cy="32" r="1.8" fill="#4338CA"/>
</svg>
`;

function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO type
  header.writeUInt16LE(count, 4); // image count

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buffer)]);
}

async function main() {
  console.log("Generating EventScout app icons...");

  // Write SVGs
  const appSvgPath = path.join(rootDir, "src", "app", "icon.svg");
  const publicSvgPath = path.join(rootDir, "public", "icon.svg");
  fs.writeFileSync(appSvgPath, svgContent, "utf8");
  fs.writeFileSync(publicSvgPath, svgContent, "utf8");
  console.log("Wrote icon.svg to src/app/icon.svg and public/icon.svg");

  // Launch Chromium to render pixel-perfect PNGs
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sizes = [16, 32, 48, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><div style="width:${size}px;height:${size}px;">${svgContent}</div></body></html>`);
    const buf = await page.screenshot({ type: "png", omitBackground: true });
    pngBuffers[size] = buf;
    await page.close();
  }
  await browser.close();

  // Save apple-icon.png (180x180)
  const appleIconPath = path.join(rootDir, "src", "app", "apple-icon.png");
  const publicAppleIconPath = path.join(rootDir, "public", "apple-icon.png");
  fs.writeFileSync(appleIconPath, pngBuffers[180]);
  fs.writeFileSync(publicAppleIconPath, pngBuffers[180]);
  console.log("Wrote apple-icon.png (180x180)");

  // Save favicon PNG variants in public/
  fs.writeFileSync(path.join(rootDir, "public", "favicon-16x16.png"), pngBuffers[16]);
  fs.writeFileSync(path.join(rootDir, "public", "favicon-32x32.png"), pngBuffers[32]);
  fs.writeFileSync(path.join(rootDir, "public", "favicon-48x48.png"), pngBuffers[48]);
  console.log("Wrote favicon-16x16.png, favicon-32x32.png, favicon-48x48.png");

  // Save 512 & 192 in public
  fs.writeFileSync(path.join(rootDir, "public", "icon.png"), pngBuffers[512]);
  fs.writeFileSync(path.join(rootDir, "public", "icon-192.png"), pngBuffers[192]);
  fs.writeFileSync(path.join(rootDir, "public", "icon-512.png"), pngBuffers[512]);

  // Create multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: pngBuffers[16] },
    { width: 32, height: 32, buffer: pngBuffers[32] },
    { width: 48, height: 48, buffer: pngBuffers[48] },
  ]);

  const appIcoPath = path.join(rootDir, "src", "app", "favicon.ico");
  const publicIcoPath = path.join(rootDir, "public", "favicon.ico");
  fs.writeFileSync(appIcoPath, icoBuffer);
  fs.writeFileSync(publicIcoPath, icoBuffer);
  console.log("Wrote multi-res favicon.ico to src/app/favicon.ico and public/favicon.ico");

  console.log("All EventScout favicon assets generated successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
