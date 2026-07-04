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

We use `<BrandLogo name="cursor" />` (and claude / copilot) from `src/components/BrandLogo.tsx`.

Behavior:
1. Tries `/logos/cursor.png` (etc.) first — drop your official downloads here for crisp self-hosted logos.
2. If the file is missing or fails to load, it tries a couple of public mirrors.
3. If everything fails, it shows a clean monogram badge ("Cu", "Cl", "Co") so the page never looks broken.

Drop the files you downloaded (from Cursor brand kit, Anthropic press kit, GitHub brand) as exactly:
- public/logos/cursor.png
- public/logos/claude.png
- public/logos/copilot.png

(You can also use .svg if you update the component or just rename to .png for simplicity.)

Keep files small (under ~10kB), respect each brand's clear space and usage rules. No heavy effects.
