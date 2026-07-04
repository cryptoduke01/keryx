#!/usr/bin/env node
/**
 * record-demo.mjs — records the 2:45 Kēryx submission demo without OS
 * screen recording. Uses Puppeteer + puppeteer-screen-recorder to capture
 * the browser directly from Chrome's compositor (via CDP), which sidesteps
 * OS-level screen recording lag on older hardware.
 *
 * Setup (one-time):
 *   pnpm add -D puppeteer puppeteer-screen-recorder
 *
 * Run:
 *   node scripts/record-demo.mjs
 *
 * Output: ./demo.mp4 (about 40MB at 30fps, 1280x720).
 *
 * How to use with voiceover:
 *   1. Record voice separately on your phone (Voice Memos) or QuickTime
 *      "audio only". Speak to the shot timings in the SHOTS array below.
 *   2. Drop demo.mp4 + your voice file into iMovie.
 *   3. Trim to 2:45, export. Done.
 *
 * Fallback if this script flakes: use the SHOTS array below as a manual
 * shot list — every SHOT.wait line is roughly a second to hold on that
 * screen. QuickTime Cmd+Shift+5 will work at 15fps on a laggy Mac.
 */

import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";

const BASE = process.env.KERYX_BASE_URL ?? "https://keryxhq.xyz";
const OUT = process.env.OUT ?? "./demo.mp4";

/** Timed shot list. Each shot: navigate, optional interaction, hold N ms. */
const SHOTS = [
  // -------- 0:00–0:20 · Landing (hook) --------
  { url: `${BASE}/`, wait: 20000, note: "Landing — voice-over hook" },

  // -------- 0:20–0:55 · Terminal x402 flow --------
  // We can't easily record a terminal from the browser, so we show the
  // /try page which contains the exact curl commands rendered nicely, then
  // cut to /live to show a fresh row landing. Voice-over reads the curl
  // as if it were a terminal.
  { url: `${BASE}/try`, wait: 12000, note: "Show the paid-endpoint curl example" },
  { url: `${BASE}/api/tools/crypto.trending`, wait: 4000, note: "Raw JSON of a real tool" },
  { url: `${BASE}/live`, wait: 15000, note: "Ledger fills as calls settle onchain" },

  // -------- 0:55–1:35 · MCP + registry --------
  { url: `${BASE}/docs#mcp`, wait: 8000, note: "Three-line MCP config" },
  { url: `${BASE}/ask`, wait: 4000, note: "Playground overview" },
  {
    url: `${BASE}/ask`,
    wait: 30000,
    note: "Type prompt + wait for streamed answer",
    action: async (page) => {
      await page.waitForSelector('input[type="text"]', { timeout: 5000 });
      await page.type('input[type="text"]', "What's trending in crypto today?", { delay: 30 });
      await page.keyboard.press("Enter");
      // Let the streamed answer + tool chip fill in
      await new Promise((r) => setTimeout(r, 25000));
    },
  },
  { url: `${BASE}/live`, wait: 8000, note: "Fresh row from the /ask call" },

  // -------- 1:35–2:10 · Publisher story --------
  { url: `${BASE}/registry`, wait: 10000, note: "Public registry" },
  { url: `${BASE}/publish`, wait: 10000, note: "Publisher form" },

  // -------- 2:10–2:45 · Close --------
  { url: `${BASE}/pitch`, wait: 15000, note: "Cover slide as visual close" },
];

const CONFIG = {
  followNewTab: false,
  fps: 30,
  ffmpeg_Path: null,
  videoFrame: { width: 1280, height: 720 },
  videoCrf: 20,
  videoCodec: "libx264",
  videoPreset: "medium",
  aspectRatio: "16:9",
};

const browser = await puppeteer.launch({
  headless: false,
  args: ["--window-size=1280,760", "--hide-scrollbars"],
  defaultViewport: { width: 1280, height: 720 },
});

const page = await browser.newPage();
const recorder = new PuppeteerScreenRecorder(page, CONFIG);
await recorder.start(OUT);

console.log(`▶ Recording to ${OUT}`);
console.log(`  ${SHOTS.length} shots · ${SHOTS.reduce((s, x) => s + x.wait, 0) / 1000}s total`);
console.log();

for (const [i, shot] of SHOTS.entries()) {
  const label = `[${String(i + 1).padStart(2, "0")}/${SHOTS.length}]`;
  console.log(`${label} ${shot.url}  ${shot.wait / 1000}s  · ${shot.note}`);
  try {
    await page.goto(shot.url, { waitUntil: "networkidle2", timeout: 30_000 });
  } catch {
    console.log(`   ⚠ networkidle timeout, continuing anyway`);
  }
  if (shot.action) {
    try {
      await shot.action(page);
    } catch (err) {
      console.log(`   ⚠ action failed: ${err instanceof Error ? err.message : err}`);
    }
  } else {
    await new Promise((r) => setTimeout(r, shot.wait));
  }
}

await recorder.stop();
await browser.close();

console.log();
console.log(`✔ Done. Video at ${OUT}`);
console.log("  Next: drop into iMovie, add voiceover, trim to 2:45, export.");
