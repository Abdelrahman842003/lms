'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  resolveSeasonalThemeFromSettings,
  type SeasonalTheme,
} from '@/lib/seasonalTheme';

interface DecorationItem {
  src: string;
  width: number;
  top: string;
  left?: string;
  right?: string;
  rope: number;
  delay?: string;
  duration?: string;
  motion?: 'sway' | 'wide' | 'gentle';
}

const DESKTOP_ITEMS: Record<SeasonalTheme, DecorationItem[]> = {
  default: [],
  ramadan: [
    { src: '/themes/ramadan/lantern.png', width: 170, top: '0.15rem', left: '2.2%', rope: 176, motion: 'wide' },
    { src: '/themes/ramadan/lantern.svg', width: 156, top: '0.2rem', right: '2.8%', rope: 166, delay: '0.6s' },
    { src: '/themes/ramadan/ramadan.png', width: 156, top: '0.2rem', right: '15.5%', rope: 140, motion: 'gentle', delay: '0.2s' },
    { src: '/themes/ramadan/muslim.png', width: 150, top: '0.2rem', left: '13.5%', rope: 136, motion: 'gentle', delay: '0.8s' },
    { src: '/themes/ramadan/muslim1.png', width: 134, top: '0.25rem', left: '27%', rope: 124, motion: 'gentle', delay: '0.35s' },
    { src: '/themes/hijri_new_year/crescent.svg', width: 138, top: '0.2rem', right: '7.8%', rope: 160, motion: 'gentle', delay: '0.5s' },
  ],
  eid: [
    { src: '/themes/eid/eid.png', width: 164, top: '0.2rem', left: '2.8%', rope: 154, motion: 'wide' },
    { src: '/themes/eid/eid-mubarak.png', width: 184, top: '0.2rem', right: '3.2%', rope: 158, motion: 'wide', delay: '0.5s' },
    { src: '/themes/eid/hajj.png', width: 148, top: '0.2rem', right: '16.5%', rope: 132, motion: 'gentle' },
    { src: '/themes/eid/butcher.png', width: 140, top: '0.2rem', left: '15.5%', rope: 126, motion: 'gentle', delay: '0.3s' },
  ],
  gregorian_new_year: [
    { src: '/themes/gregorian_new_year/happy-new-year.png', width: 168, top: '0.25rem', left: '3.2%', rope: 148, motion: 'wide' },
    { src: '/themes/gregorian_new_year/happy-new-year%20(1).png', width: 154, top: '0.25rem', right: '3.4%', rope: 146, motion: 'wide', delay: '0.4s' },
    { src: '/themes/gregorian_new_year/firework.svg', width: 140, top: '0.2rem', right: '17%', rope: 120, motion: 'gentle', delay: '0.8s' },
  ],
  hijri_new_year: [
    { src: '/themes/hijri_new_year/lantern.png', width: 148, top: '0.2rem', left: '3%', rope: 164, motion: 'wide' },
    { src: '/themes/hijri_new_year/crescent.svg', width: 154, top: '0.2rem', right: '3.4%', rope: 154, motion: 'wide', delay: '0.5s' },
  ],
};

const MOBILE_ITEMS: Record<SeasonalTheme, DecorationItem[]> = {
  default: [],
  ramadan: [
    { src: '/themes/ramadan/muslim1.png', width: 118, top: '0.2rem', right: '4%', rope: 98, motion: 'gentle' },
  ],
  hijri_new_year: [
    { src: '/themes/hijri_new_year/crescent.svg', width: 110, top: '0.2rem', right: '4%', rope: 98, motion: 'gentle' },
  ],
  gregorian_new_year: [
    { src: '/themes/gregorian_new_year/happy-new-year%20(1).png', width: 118, top: '0.2rem', right: '4%', rope: 98, motion: 'gentle' },
  ],
  eid: [
    { src: '/themes/eid/butcher.png', width: 106, top: '0.2rem', left: '4%', rope: 96, motion: 'gentle' },
    { src: '/themes/eid/confetti.svg', width: 110, top: '0.2rem', right: '4%', rope: 96, motion: 'gentle', delay: '0.35s' },
  ],
};

export default function SeasonalDecorations({ initialTheme }: { initialTheme: SeasonalTheme }) {
  const { settings, isLoading } = useSettings();

  const activeTheme = useMemo<SeasonalTheme>(() => {
    if (isLoading && Object.keys(settings).length === 0) {
      return initialTheme;
    }

    return resolveSeasonalThemeFromSettings(settings).theme;
  }, [initialTheme, isLoading, settings]);

  const desktopItems = DESKTOP_ITEMS[activeTheme] ?? [];
  const mobileItems = MOBILE_ITEMS[activeTheme] ?? [];

  if (desktopItems.length === 0 && mobileItems.length === 0) {
    return null;
  }

  return (
    <div className="seasonal-decoration-layer" data-season-decor={activeTheme} aria-hidden="true">
      {desktopItems.map((item, index) => {
        const style: CSSProperties = {
          width: `${item.width}px`,
          top: item.top,
          left: item.left,
          right: item.right,
          animationDelay: item.delay ?? `${index * 0.15}s`,
          animationDuration: item.duration ?? '12s',
        };

        return (
          <div
            key={`${activeTheme}-${item.src}-${index}`}
            className={`seasonal-hanger seasonal-hanger--desktop seasonal-hanger--${item.motion ?? 'sway'}`}
            style={style}
          >
            <span className="seasonal-rope" style={{ height: `${item.rope}px` }} />
            <img
              src={item.src}
              alt=""
              className="seasonal-hanger-image"
              loading="eager"
              decoding="async"
            />
          </div>
        );
      })}

      {mobileItems.map((item, index) => {
        const style: CSSProperties = {
          width: `${item.width}px`,
          top: item.top,
          left: item.left,
          right: item.right,
          animationDelay: item.delay ?? `${index * 0.2}s`,
          animationDuration: item.duration ?? '12s',
        };

        return (
          <div
            key={`${activeTheme}-mobile-${item.src}-${index}`}
            className={`seasonal-hanger seasonal-hanger--mobile seasonal-hanger--${item.motion ?? 'sway'}`}
            style={style}
          >
            <span className="seasonal-rope" style={{ height: `${item.rope}px` }} />
            <img
              src={item.src}
              alt=""
              className="seasonal-hanger-image"
              loading="eager"
              decoding="async"
            />
          </div>
        );
      })}
    </div>
  );
}
