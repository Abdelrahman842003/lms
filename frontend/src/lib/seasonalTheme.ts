export type SeasonalTheme =
  | 'default'
  | 'ramadan'
  | 'eid'
  | 'gregorian_new_year'
  | 'hijri_new_year';

export interface SeasonalPalette {
  primary: string;
  secondary: string;
  bg_start: string;
  bg_end: string;
}

export interface SeasonalThemeResolution {
  theme: SeasonalTheme;
  palette: SeasonalPalette;
  cssVariables: Record<string, string>;
}

const DEFAULT_THEME: SeasonalTheme = 'default';
const THEMES: SeasonalTheme[] = [
  'default',
  'ramadan',
  'eid',
  'gregorian_new_year',
  'hijri_new_year',
];

const DEFAULT_PALETTES: Record<SeasonalTheme, SeasonalPalette> = {
  default: {
    primary: '#4264ebab',
    secondary: '#5b72e8',
    bg_start: '#000000',
    bg_end: '#000000',
  },
  ramadan: {
    primary: '#14b8a6',
    secondary: '#f59e0b',
    bg_start: '#041a1f',
    bg_end: '#0f172a',
  },
  eid: {
    primary: '#22c55e',
    secondary: '#06b6d4',
    bg_start: '#052e16',
    bg_end: '#0f172a',
  },
  gregorian_new_year: {
    primary: '#ef4444',
    secondary: '#facc15',
    bg_start: '#1f0b24',
    bg_end: '#09090b',
  },
  hijri_new_year: {
    primary: '#22d3ee',
    secondary: '#818cf8',
    bg_start: '#082f49',
    bg_end: '#172554',
  },
};

const BASE_COLORS = DEFAULT_PALETTES.default;

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type SettingsMap = Record<string, string | null | undefined>;

function normalizeTheme(theme: string | null | undefined): SeasonalTheme {
  if (!theme) return DEFAULT_THEME;
  const lowered = theme.trim().toLowerCase();
  return THEMES.includes(lowered as SeasonalTheme) ? (lowered as SeasonalTheme) : DEFAULT_THEME;
}

function pickSetting(
  settings: SettingsMap | undefined,
  snakeCaseKey: string,
  camelCaseKey: string
): string | undefined {
  if (!settings) return undefined;
  const snakeValue = settings[snakeCaseKey];
  if (typeof snakeValue === 'string' && snakeValue.trim() !== '') return snakeValue;
  const camelValue = settings[camelCaseKey];
  if (typeof camelValue === 'string' && camelValue.trim() !== '') return camelValue;
  return undefined;
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : fallback;
}

function toBooleanFlag(value: string | undefined, fallback = true): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();

  if (normalized === '') return fallback;

  return !['0', 'false', 'off', 'no'].includes(normalized);
}

export function resolveSeasonalThemeFromSettings(
  settings?: SettingsMap
): SeasonalThemeResolution {
  const selectedTheme = normalizeTheme(
    pickSetting(settings, 'seasonal_theme', 'seasonalTheme')
  );
  const themeEnabled = toBooleanFlag(
    pickSetting(settings, 'seasonal_theme_enabled', 'seasonalThemeEnabled'),
    true
  );
  const theme = themeEnabled ? selectedTheme : DEFAULT_THEME;

  const defaults = DEFAULT_PALETTES[selectedTheme];
  const palette: SeasonalPalette = {
    primary: normalizeColor(
      pickSetting(settings, 'seasonal_theme_primary', 'seasonalThemePrimary'),
      defaults.primary
    ),
    secondary: normalizeColor(
      pickSetting(settings, 'seasonal_theme_secondary', 'seasonalThemeSecondary'),
      defaults.secondary
    ),
    bg_start: normalizeColor(
      pickSetting(settings, 'seasonal_theme_bg_start', 'seasonalThemeBgStart'),
      defaults.bg_start
    ),
    bg_end: normalizeColor(
      pickSetting(settings, 'seasonal_theme_bg_end', 'seasonalThemeBgEnd'),
      defaults.bg_end
    ),
  };

  const applyPrimary = themeEnabled
    && toBooleanFlag(
      pickSetting(settings, 'seasonal_theme_apply_primary', 'seasonalThemeApplyPrimary'),
      true
    );
  const applySecondary = themeEnabled
    && toBooleanFlag(
      pickSetting(settings, 'seasonal_theme_apply_secondary', 'seasonalThemeApplySecondary'),
      true
    );
  const applyBgStart = themeEnabled
    && toBooleanFlag(
      pickSetting(settings, 'seasonal_theme_apply_bg_start', 'seasonalThemeApplyBgStart'),
      true
    );
  const applyBgEnd = themeEnabled
    && toBooleanFlag(
      pickSetting(settings, 'seasonal_theme_apply_bg_end', 'seasonalThemeApplyBgEnd'),
      true
    );

  return {
    theme,
    palette,
    cssVariables: {
      '--seasonal-primary': applyPrimary ? palette.primary : BASE_COLORS.primary,
      '--seasonal-secondary': applySecondary ? palette.secondary : BASE_COLORS.secondary,
      '--seasonal-bg-start': applyBgStart ? palette.bg_start : BASE_COLORS.bg_start,
      '--seasonal-bg-end': applyBgEnd ? palette.bg_end : BASE_COLORS.bg_end,
    },
  };
}

export function applySeasonalThemeToBody(
  settings?: SettingsMap
): SeasonalThemeResolution {
  const resolved = resolveSeasonalThemeFromSettings(settings);

  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-season-theme', resolved.theme);

    Object.entries(resolved.cssVariables).forEach(([key, value]) => {
      document.body.style.setProperty(key, value);
    });
  }

  return resolved;
}
