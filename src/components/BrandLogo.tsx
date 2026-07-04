'use client';

type Brand = 'cursor' | 'claude' | 'copilot';

const FALLBACKS: Record<Brand, string> = {
  cursor: 'https://cursor.com/favicon.png',
  claude: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Claude_AI_logo.svg',
  copilot: 'https://github.githubassets.com/favicons/favicon.svg',
};

export function BrandLogo({ name, size = 20 }: { name: Brand; size?: number }) {
  const src = `/logos/${name}.png`;
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'inline-block' }}
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (!img.dataset.fb) {
          img.dataset.fb = '1';
          img.src = FALLBACKS[name];
        }
      }}
    />
  );
}
