import React from 'react';

interface BannerHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Tall diagonal hero below `lg` (the reference-screenshot pattern, works
 * on a narrow tall phone screen); a compact strip at `lg`+ — the same
 * tall-hero-then-content layout looks wrong on a short, wide desktop
 * viewport (Decision 23). Pure CSS responsive switch, no JS/hydration
 * mismatch risk.
 */
export default function BannerHeader({ title, subtitle }: BannerHeaderProps) {
  return (
    <div
      className="w-full px-6 pt-10 pb-16 text-white [clip-path:polygon(0_0,100%_0,100%_85%,0_100%)] lg:pt-8 lg:pb-8 lg:[clip-path:none]"
      style={{ background: `linear-gradient(135deg, var(--banner-gradient-start), var(--banner-gradient-end))` }}
    >
      <div className="max-w-4xl mx-auto lg:max-w-none">
        <h1 className="text-3xl md:text-4xl lg:text-2xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg md:text-xl lg:text-sm font-medium opacity-90">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
