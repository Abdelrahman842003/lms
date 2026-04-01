---
title: Seasonal Theming
description: Dynamic theme system with seasonal decorations and color palettes
---

# Seasonal Theming

## Theme Types

| Theme | Description |
|-------|-------------|
| `default` | Standard platform theme |
| `ramadan` | Ramadan-themed colors and decorations |
| `eid` | Eid celebration theme |
| `gregorian_new_year` | New Year theme |
| `hijri_new_year` | Hijri New Year theme |

## Theme Resolution

**Source:** `frontend/src/lib/seasonalTheme.ts`

| Export | Description |
|--------|-------------|
| `resolveSeasonalThemeFromSettings(settings)` | Determines active theme from backend settings |
| `applySeasonalThemeToBody(theme)` | Injects CSS variables into document body |

### How It Works

1. `SettingsContext` fetches public settings from backend
2. `seasonalTheme.ts` resolves the theme from settings
3. CSS variables are injected into the document body
4. Components read CSS variables for themed colors
5. Admin can control theme via backend settings

### Color Palette

Each theme defines a color palette:
- Primary, secondary, accent colors
- Background and surface colors
- Text and border colors

Colors are normalized and injected as CSS custom properties (`--theme-*`).

## Seasonal Decorations

**Source:** `frontend/src/components/SeasonalDecorations.tsx`

Theme-aware decorative elements:

- **Desktop and mobile** responsive variations
- **Animated elements** with different motion types:
  - `sway` — Gentle side-to-side
  - `wide` — Wide amplitude movement
  - `gentle` — Subtle drift
- **Delay animations** — Staggered entrance for multiple elements
- **Absolute positioning** — Overlays that don't affect layout

## Settings Integration

**Source:** `frontend/src/contexts/SettingsContext.tsx`

The settings provider:
1. Fetches public settings on mount
2. Resolves seasonal theme from settings
3. Applies theme CSS variables
4. Provides theme info to child components

## Custom Theme Override

Themes can be customized via backend settings:
- Custom primary color
- Custom accent color
- Enable/disable decorations
- Theme scheduling (start/end dates)
