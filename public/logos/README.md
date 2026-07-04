# Logos

Place the official brand assets here for consistent use across docs, pitch, and marketing.

## Sources (download and rename)

- **Cursor**: https://cursor.com/brand  
  Recommended: horizontal lockup or cube.  
  Drop as `cursor.png` (or .svg).

- **Claude (Anthropic)**:  
  Official press kit from the Anthropic folder / https://www.anthropic.com/news (Media assets).  
  Drop as `claude.png` (or .svg).

- **GitHub Copilot**:  
  https://brand.github.com/ (or the Copilot section in the toolkit).  
  Drop as `copilot.png` (or .svg).

- **OpenAI / Codex** (optional): Use official OpenAI marks if showing a Codex badge.

## Usage

We use a small `BrandLogo` component (`src/components/BrandLogo.tsx`) that prefers `/logos/{name}.png`.

- If the local file is present, it loads it (self-hosted, crisp).
- If missing (404), it silently falls back to the public favicon/SVG mirrors so the UI never shows broken images.

Drop your downloaded files as:
- `public/logos/cursor.png`
- `public/logos/claude.png`
- `public/logos/copilot.png`

Keep them small, respect brand clear space, no distortion.
