'use client';

import { useState } from 'react';

type Brand = 'cursor' | 'claude' | 'copilot';

const FALLBACK_URLS: Record<Brand, string> = {
  cursor: 'https://cursor.com/favicon.png',
  claude: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Claude_AI_logo.svg',
  copilot: 'https://github.githubassets.com/favicons/favicon.svg',
};

const LETTERS: Record<Brand, string> = {
  cursor: 'Cu',
  claude: 'Cl',
  copilot: 'Co',
};

export function BrandLogo({ name, size = 20 }: { name: Brand; size?: number }) {
  const [src, setSrc] = useState(`/logos/${name}.png`);
  const [attempt, setAttempt] = useState<0 | 1 | 2 | 3>(0); // 0=png, 1=svg, 2=external, 3=badge

  const handleError = () => {
    if (attempt === 0) {
      // Try SVG next (Cursor ships as .svg)
      setAttempt(1);
      setSrc(`/logos/${name}.svg`);
    } else if (attempt === 1) {
      // Then public mirrors
      setAttempt(2);
      setSrc(FALLBACK_URLS[name]);
    } else if (attempt === 2) {
      setAttempt(3);
    }
  };

  if (attempt === 2) {
    // Reliable last-resort badge — always visible, never broken.
    // Looks intentional until you drop the real brand assets into public/logos/
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 5,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(10, Math.floor(size * 0.58)),
          fontWeight: 700,
          letterSpacing: '-0.2px',
          color: 'var(--text-primary)',
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label={name}
        title={name}
      >
        {LETTERS[name]}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'inline-block', flexShrink: 0 }}
      onError={handleError}
    />
  );
}
