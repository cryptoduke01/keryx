# Record buttery-smooth browser demos on slow/older Macs (Puppeteer + CDP trick)

This technique bypasses your operating system's screen recorder entirely. Instead of macOS/Windows compositing the whole desktop (which tanks FPS and heats up old hardware), we ask Chrome to record its own output directly via the Chrome DevTools Protocol.

Result: clean 30 fps video with almost zero extra CPU load on the recording machine.

Perfect for hackathon submissions, product demos, or anything where you need a crisp browser walkthrough without lag.

## Why this works

- Normal screen recording (Cmd+Shift+5, OBS, etc.) captures pixels after the OS has already rendered everything. On a 2017 MacBook this often drops to 10-15 fps with stuttering.
- `puppeteer-screen-recorder` uses Puppeteer's access to the browser's compositor. It records the video frames *before* they hit your display pipeline.
- Your machine only has to run the browser + ffmpeg. No heavy OS-level capture.

## The exact setup that worked for us (July 2026)

### 1. Install the tools

```bash
pnpm add -D puppeteer puppeteer-screen-recorder
```

(You can use npm or yarn too.)

### 2. Install a real Chrome (the error you will probably hit)

Puppeteer does **not** bundle a full Chrome by default in recent versions.

Run this once:

```bash
npx puppeteer browsers install chrome
```

This downloads a compatible Chrome into `~/.cache/puppeteer`.

### 3. Write a minimal recorder script

See `scripts/record-demo.mjs` in this repo for a complete example. Key parts:

```js
import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";

const browser = await puppeteer.launch({
  headless: false,                    // important for recording
  args: ["--window-size=1280,760", "--hide-scrollbars"],
  defaultViewport: { width: 1280, height: 720 },
});

const page = await browser.newPage();
const recorder = new PuppeteerScreenRecorder(page, {
  fps: 30,
  videoFrame: { width: 1280, height: 720 },
  // ... other ffmpeg options
});

await recorder.start("./demo.mp4");

// Navigate + do actions
await page.goto("https://keryxhq.xyz");
await new Promise(r => setTimeout(r, 20000));   // hold the shot

await recorder.stop();
await browser.close();
```

### 4. Record voice separately (critical)

Do **not** try to record audio + video at the same time in the same process on a slow machine.

Best workflow:
- Run the Puppeteer script (it prints timing notes to the terminal).
- Record your voice on your **phone** (Voice Memos) or QuickTime audio-only while watching the timings.
- In iMovie / CapCut / DaVinci: drop the `.mp4` + audio file, align, trim to desired length (we did 2:45), export.

## Full working example from our Lepton submission

We combined this with a companion script that populates real onchain activity first:

```bash
# 1. Make the ledger look alive (real calls, real external payouts)
bash scripts/traction-run.sh

# 2. Record the browser
node scripts/record-demo.mjs
```

Then voiceover + iMovie.

The resulting video shows:
- Real x402 402 responses
- MCP config + live agent calling tools
- Fresh rows appearing on `/live`
- USDC actually moving on Arc (clickable tx hashes)

## Troubleshooting the "Could not find Chrome" error

```bash
Error: Could not find Chrome (ver. 150.0.7871.24)
```

Fix:

```bash
npx puppeteer browsers install chrome
```

If you still have issues, try:

```bash
npx puppeteer browsers install chrome-headless-shell
```

or delete the cache and retry:

```bash
rm -rf ~/.cache/puppeteer
npx puppeteer browsers install chrome
```

## Fallback if Puppeteer is being difficult

Use the manual method (still very usable):

1. Open your site in Chrome at exactly 1280×720.
2. `Cmd + Shift + 5` → "Record Selected Portion".
3. Follow a timed shot list (we printed the exact one in `scripts/SUBMISSION.md`).
4. Speak the script while recording.
5. It will be a little lower fps, but perfectly acceptable.

## Tips for clean 2–3 minute videos

- Keep shots long enough (8–20 seconds) so voiceover has breathing room.
- Use `networkidle2` or explicit waits instead of hard sleeps when possible.
- Hide scrollbars and set a consistent viewport.
- Record voice at normal speed — you can always speed up 5–10% in post if needed.
- End with a clean static frame + URL + handle.

## Credits / why we're sharing this

This came from a conversation during the Lepton Agents Hackathon (Canteen × Circle × Arc) while trying to produce a crisp 2:45 submission video on older hardware.

The Puppeteer + CDP approach is not new, but it's under-documented for the "I just need a nice product demo" use case.

If this helped you ship a better demo, feel free to quote or link it.

---

**Files we actually used:**

- `scripts/traction-run.sh` – populates real data
- `scripts/record-demo.mjs` – the CDP recorder
- `scripts/SUBMISSION.md` – full shot list + voice script + form answers

Happy shipping. Your demos will look way more professional than the laggy screen recordings everyone else is posting.