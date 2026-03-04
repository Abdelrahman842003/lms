import {
  applySeasonalThemeToBody,
  resolveSeasonalThemeFromSettings,
} from '../seasonalTheme';

describe('seasonalTheme helpers', () => {
  it('falls back to default theme and palette when settings are missing', () => {
    const result = resolveSeasonalThemeFromSettings({});

    expect(result.theme).toBe('default');
    expect(result.palette.primary).toBe('#4264ebab');
    expect(result.palette.secondary).toBe('#5b72e8');
    expect(result.palette.bg_start).toBe('#000000');
    expect(result.palette.bg_end).toBe('#000000');
  });

  it('uses provided seasonal settings when valid', () => {
    const result = resolveSeasonalThemeFromSettings({
      seasonal_theme: 'ramadan',
      seasonal_theme_primary: '#112233',
      seasonal_theme_secondary: '#445566',
      seasonal_theme_bg_start: '#010203',
      seasonal_theme_bg_end: '#040506',
    });

    expect(result.theme).toBe('ramadan');
    expect(result.palette).toEqual({
      primary: '#112233',
      secondary: '#445566',
      bg_start: '#010203',
      bg_end: '#040506',
    });
    expect(result.cssVariables['--seasonal-primary']).toBe('#112233');
    expect(result.cssVariables['--seasonal-bg-start']).toBe('#010203');
  });

  it('falls back to theme defaults when theme or colors are invalid', () => {
    const result = resolveSeasonalThemeFromSettings({
      seasonal_theme: 'not-real',
      seasonal_theme_primary: 'blue',
      seasonal_theme_secondary: '#ffff',
      seasonal_theme_bg_start: '',
      seasonal_theme_bg_end: '#zzz',
    });

    expect(result.theme).toBe('default');
    expect(result.palette.primary).toBe('#4264ebab');
    expect(result.palette.secondary).toBe('#5b72e8');
    expect(result.palette.bg_start).toBe('#000000');
    expect(result.palette.bg_end).toBe('#000000');
  });

  it('applies theme attributes and css variables to body', () => {
    const result = applySeasonalThemeToBody({
      seasonal_theme: 'eid',
      seasonal_theme_primary: '#1a2b3c',
      seasonal_theme_secondary: '#2b3c4d',
      seasonal_theme_bg_start: '#111111',
      seasonal_theme_bg_end: '#222222',
    });

    expect(result.theme).toBe('eid');
    expect(document.body.getAttribute('data-season-theme')).toBe('eid');
    expect(document.body.style.getPropertyValue('--seasonal-primary')).toBe('#1a2b3c');
    expect(document.body.style.getPropertyValue('--seasonal-secondary')).toBe('#2b3c4d');
    expect(document.body.style.getPropertyValue('--seasonal-bg-start')).toBe('#111111');
    expect(document.body.style.getPropertyValue('--seasonal-bg-end')).toBe('#222222');
  });

  it('can disable the full seasonal theme from settings', () => {
    const result = resolveSeasonalThemeFromSettings({
      seasonal_theme: 'eid',
      seasonal_theme_enabled: '0',
      seasonal_theme_primary: '#1a2b3c',
    });

    expect(result.theme).toBe('default');
    expect(result.cssVariables['--seasonal-primary']).toBe('#4264ebab');
    expect(result.cssVariables['--seasonal-secondary']).toBe('#5b72e8');
  });

  it('can disable applying specific seasonal colors only', () => {
    const result = resolveSeasonalThemeFromSettings({
      seasonal_theme: 'ramadan',
      seasonal_theme_apply_primary: 'false',
      seasonal_theme_apply_bg_start: '0',
      seasonal_theme_primary: '#112233',
      seasonal_theme_secondary: '#445566',
      seasonal_theme_bg_start: '#010203',
      seasonal_theme_bg_end: '#040506',
    });

    expect(result.theme).toBe('ramadan');
    expect(result.cssVariables['--seasonal-primary']).toBe('#4264ebab');
    expect(result.cssVariables['--seasonal-secondary']).toBe('#445566');
    expect(result.cssVariables['--seasonal-bg-start']).toBe('#000000');
    expect(result.cssVariables['--seasonal-bg-end']).toBe('#040506');
  });
});
