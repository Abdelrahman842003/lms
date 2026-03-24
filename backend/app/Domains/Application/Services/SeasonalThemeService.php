<?php

declare(strict_types=1);

namespace App\Domains\Application\Services;

final class SeasonalThemeService
{
    public const DEFAULT_THEME = 'default';

    /**
     * @var array<int, string>
     */
    public const THEMES = [
        'default',
        'ramadan',
        'eid',
        'gregorian_new_year',
        'hijri_new_year',
    ];

    /**
     * @var array<string, string>
     */
    private const THEME_OPTIONS = [
        'default' => 'افتراضي',
        'ramadan' => 'رمضان',
        'eid' => 'العيد',
        'gregorian_new_year' => 'رأس السنة الميلادية',
        'hijri_new_year' => 'رأس السنة الهجرية',
    ];

    /**
     * @var array<string, array<string, string>>
     */
    private const DEFAULT_PALETTES = [
        'default' => [
            'primary' => '#4264ebab',
            'secondary' => '#5b72e8',
            'bg_start' => '#000000',
            'bg_end' => '#000000',
        ],
        'ramadan' => [
            'primary' => '#14b8a6',
            'secondary' => '#f59e0b',
            'bg_start' => '#041a1f',
            'bg_end' => '#0f172a',
        ],
        'eid' => [
            'primary' => '#22c55e',
            'secondary' => '#06b6d4',
            'bg_start' => '#052e16',
            'bg_end' => '#0f172a',
        ],
        'gregorian_new_year' => [
            'primary' => '#ef4444',
            'secondary' => '#facc15',
            'bg_start' => '#1f0b24',
            'bg_end' => '#09090b',
        ],
        'hijri_new_year' => [
            'primary' => '#22d3ee',
            'secondary' => '#818cf8',
            'bg_start' => '#082f49',
            'bg_end' => '#172554',
        ],
    ];

    public static function options(): array
    {
        return self::THEME_OPTIONS;
    }

    public static function normalizeTheme(?string $theme): string
    {
        if (! is_string($theme)) {
            return self::DEFAULT_THEME;
        }

        $theme = trim(strtolower($theme));

        return in_array($theme, self::THEMES, true) ? $theme : self::DEFAULT_THEME;
    }

    public static function defaultPalette(string $theme): array
    {
        $normalizedTheme = self::normalizeTheme($theme);

        return self::DEFAULT_PALETTES[$normalizedTheme];
    }

    public static function resolvePalette(string $theme, ?string $palettesJson): array
    {
        $normalizedTheme = self::normalizeTheme($theme);
        $defaults = self::defaultPalette($normalizedTheme);
        $allPalettes = self::decodePalettes($palettesJson);

        if (! array_key_exists($normalizedTheme, $allPalettes) || ! is_array($allPalettes[$normalizedTheme])) {
            return $defaults;
        }

        return self::sanitizePalette((array) $allPalettes[$normalizedTheme], $normalizedTheme);
    }

    public static function sanitizePalette(array $palette, string $theme): array
    {
        $normalizedTheme = self::normalizeTheme($theme);
        $defaults = self::defaultPalette($normalizedTheme);

        return [
            'primary' => self::normalizeColor($palette['primary'] ?? null, $defaults['primary']),
            'secondary' => self::normalizeColor($palette['secondary'] ?? null, $defaults['secondary']),
            'bg_start' => self::normalizeColor($palette['bg_start'] ?? null, $defaults['bg_start']),
            'bg_end' => self::normalizeColor($palette['bg_end'] ?? null, $defaults['bg_end']),
        ];
    }

    public static function updatePaletteJson(string $theme, array $palette, ?string $palettesJson): string
    {
        $normalizedTheme = self::normalizeTheme($theme);
        $allPalettes = self::decodePalettes($palettesJson);
        $allPalettes[$normalizedTheme] = self::sanitizePalette($palette, $normalizedTheme);

        $encoded = json_encode($allPalettes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($encoded) ? $encoded : '{}';
    }

    private static function decodePalettes(?string $palettesJson): array
    {
        if (! is_string($palettesJson) || trim($palettesJson) === '') {
            return [];
        }

        $decoded = json_decode($palettesJson, true);

        return is_array($decoded) ? $decoded : [];
    }

    private static function normalizeColor(mixed $value, string $fallback): string
    {
        if (! is_string($value)) {
            return $fallback;
        }

        $trimmed = trim($value);

        return self::isValidHexColor($trimmed) ? $trimmed : $fallback;
    }

    private static function isValidHexColor(string $value): bool
    {
        return (bool) preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/', $value);
    }
}
