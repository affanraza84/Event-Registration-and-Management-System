import { chromium } from "playwright-core";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const RECORDINGS_DIR = path.resolve("./recordings");
const OUTPUT_MP4 = path.resolve("./public/eventscout-demo.mp4");
const LOCAL_MP4 = path.resolve("./eventscout-demo.mp4");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, distance, steps = 10, delay = 50) {
  const stepDistance = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "smooth" }), stepDistance);
    await sleep(delay);
  }
}

async function run() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }

  console.log("Launching Chrome from:", CHROME_PATH);
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,720"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    console.log("1. Navigating to Homepage...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await sleep(2500);

    // Scroll through homepage showcase
    console.log("Scrolling through homepage...");
    await smoothScroll(page, 450, 15, 60);
    await sleep(1500);
    await smoothScroll(page, 450, 15, 60);
    await sleep(2000);
    await smoothScroll(page, -900, 15, 40);
    await sleep(1500);

    // 2. Navigate to Live Event Discovery
    console.log("2. Navigating to /discover...");
    const discoverLink = page.locator('a[href="/discover"]').first();
    if (await discoverLink.isVisible()) {
      await discoverLink.click();
    } else {
      await page.goto("http://localhost:3000/discover", { waitUntil: "networkidle" });
    }
    await page.waitForLoadState("networkidle");
    await sleep(2000);

    // Highlight search inputs and click quick city pill
    console.log("Interacting with search controls...");
    const quickCityRanchi = page.locator('button:has-text("Ranchi")').first();
    if (await quickCityRanchi.isVisible()) {
      await quickCityRanchi.click();
      await sleep(1000);
    }

    // Trigger search
    console.log("Triggering live search...");
    const searchBtn = page.locator('button:has-text("Discover Live Events")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    }

    // Wait for search response or results to appear
    console.log("Waiting for search results...");
    try {
      await page.waitForSelector("article", { timeout: 15000 });
      console.log("Search results displayed successfully!");
    } catch {
      console.log("Continuing with current page state...");
    }
    await sleep(3000);

    // Scroll down to showcase cards
    console.log("Showcasing results cards and badges...");
    await smoothScroll(page, 300, 10, 50);
    await sleep(2500);

    // Click 'Use Details to Create Event' to open draft modal
    const draftButton = page.locator('button:has-text("Use Details to Create Event")').first();
    if (await draftButton.isVisible()) {
      console.log("Opening Draft Preparation Modal...");
      await draftButton.click();
      await sleep(3500); // Pause so the modal and unverified warning are clearly legible in video

      // Close modal
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await sleep(1500);
      }
    }

    // Showcase Client-Side Category Filtering
    console.log("Demonstrating instant client-side category filtering...");
    const filterPills = page.locator('button:has-text("Hackathons and competitions")').first();
    if (await filterPills.isVisible()) {
      await filterPills.click();
      await sleep(2000);
    }

    const allPill = page.locator('button:has-text("All")').first();
    if (await allPill.isVisible()) {
      await allPill.click();
      await sleep(1500);
    }

    // 3. Navigate to an Event Page or Create Draft
    console.log("3. Demonstrating published event page and RSVP flow...");
    await page.goto("http://localhost:3000/events/new", { waitUntil: "networkidle" });
    await sleep(2500);

    console.log("Returning to home for clean conclusion...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await sleep(2000);

  } catch (err) {
    console.error("Recording error during interaction:", err);
  } finally {
    console.log("Closing browser context to finalize video file...");
    await page.close();
    await context.close();
    await browser.close();
  }

  // Find generated webm video
  const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    throw new Error("No webm recording was produced by Playwright.");
  }

  const latestWebm = path.join(RECORDINGS_DIR, files[files.length - 1]);
  console.log("Found generated video:", latestWebm);

  // Convert to MP4 using ffmpeg
  console.log("Converting WebM to MP4 via ffmpeg...");
  const publicDir = path.dirname(OUTPUT_MP4);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const ffmpegCmd = `/opt/homebrew/bin/ffmpeg -y -i "${latestWebm}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${OUTPUT_MP4}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  fs.copyFileSync(OUTPUT_MP4, LOCAL_MP4);
  console.log("✅ MP4 video successfully created at:");
  console.log("   - Web URL: http://localhost:3000/eventscout-demo.mp4");
  console.log("   - Local file:", LOCAL_MP4);
}

run().catch((err) => {
  console.error("FATAL RECORDING ERROR:", err);
  process.exit(1);
});
