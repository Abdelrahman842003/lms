<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Support\Models\Setting;
use App\Domains\Support\Services\SeasonalThemeService;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class SystemSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationLabel = 'العام';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'الإعدادات العامة';

    protected static ?string $slug = 'system-settings';

    protected static ?int $navigationSort = 100;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        // General
        'whatsappNumber',
        // SEO
        'seo_title',
        'seo_description',
        'seo_keywords',
        'seo_canonical_url',
        'seo_og_title',
        'seo_og_description',
        'seo_og_image',
        'seo_twitter_handle',
        'seo_twitter_card',
        'seo_google_verification',
        'seo_bing_verification',
        'seo_robots_txt',
        // GEO
        'geo_business_name',
        'geo_business_type',
        'geo_country_code',
        'geo_region',
        'geo_city',
        'geo_address',
        'geo_latitude',
        'geo_longitude',
        'geo_service_radius_km',
        'geo_place_id',
        'geo_knowledge_panel_url',
        'geo_service_areas',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $activeTheme = SeasonalThemeService::normalizeTheme(
            Setting::getValue('seasonal_theme', SeasonalThemeService::DEFAULT_THEME)
        );
        $resolvedPalette = SeasonalThemeService::resolvePalette(
            $activeTheme,
            Setting::getValue('seasonal_theme_palettes', null)
        );

        $this->form->fill(array_merge([
            // General
            'whatsappNumber' => Setting::getValue('whatsappNumber', ''),
            // SEO
            'seo_title' => Setting::getValue('seo_title', ''),
            'seo_description' => Setting::getValue('seo_description', ''),
            'seo_keywords' => Setting::getValue('seo_keywords', ''),
            'seo_canonical_url' => Setting::getValue('seo_canonical_url', ''),
            'seo_og_title' => Setting::getValue('seo_og_title', ''),
            'seo_og_description' => Setting::getValue('seo_og_description', ''),
            'seo_og_image' => Setting::getValue('seo_og_image', ''),
            'seo_twitter_handle' => Setting::getValue('seo_twitter_handle', ''),
            'seo_twitter_card' => Setting::getValue('seo_twitter_card', 'summary_large_image'),
            'seo_google_verification' => Setting::getValue('seo_google_verification', ''),
            'seo_bing_verification' => Setting::getValue('seo_bing_verification', ''),
            'seo_robots_txt' => Setting::getValue('seo_robots_txt', "User-agent: *\nAllow: /"),
            // GEO
            'geo_business_name' => Setting::getValue('geo_business_name', ''),
            'geo_business_type' => Setting::getValue('geo_business_type', 'EducationalOrganization'),
            'geo_country_code' => Setting::getValue('geo_country_code', 'EG'),
            'geo_region' => Setting::getValue('geo_region', ''),
            'geo_city' => Setting::getValue('geo_city', ''),
            'geo_address' => Setting::getValue('geo_address', ''),
            'geo_latitude' => Setting::getValue('geo_latitude', ''),
            'geo_longitude' => Setting::getValue('geo_longitude', ''),
            'geo_service_radius_km' => Setting::getValue('geo_service_radius_km', '50'),
            'geo_place_id' => Setting::getValue('geo_place_id', ''),
            'geo_knowledge_panel_url' => Setting::getValue('geo_knowledge_panel_url', ''),
            'geo_service_areas' => Setting::getValue('geo_service_areas', ''),
        ], [
            'seasonal_theme' => $activeTheme,
            'seasonal_theme_enabled' => $this->toBoolean(Setting::getValue('seasonal_theme_enabled', '1')),
            'seasonal_theme_primary' => $resolvedPalette['primary'],
            'seasonal_theme_apply_primary' => $this->toBoolean(Setting::getValue('seasonal_theme_apply_primary', '1')),
            'seasonal_theme_secondary' => $resolvedPalette['secondary'],
            'seasonal_theme_apply_secondary' => $this->toBoolean(Setting::getValue('seasonal_theme_apply_secondary', '1')),
            'seasonal_theme_bg_start' => $resolvedPalette['bg_start'],
            'seasonal_theme_apply_bg_start' => $this->toBoolean(Setting::getValue('seasonal_theme_apply_bg_start', '1')),
            'seasonal_theme_bg_end' => $resolvedPalette['bg_end'],
            'seasonal_theme_apply_bg_end' => $this->toBoolean(Setting::getValue('seasonal_theme_apply_bg_end', '1')),
        ]));
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('عام')
                    ->schema([
                        TextInput::make('whatsappNumber')
                            ->label('رقم التواصل مع الإدارة')
                            ->tel()
                            ->maxLength(30)
                            ->placeholder('مثال: 201001234567')
                            ->helperText('يُستخدم في زر "تواصل مع الإدارة" داخل صفحة تسجيل الدخول.'),
                    ])
                    ->columns(1),

                Section::make('تحسين محركات البحث')
                    ->schema([
                        TextInput::make('seo_title')
                            ->label('عنوان SEO')
                            ->maxLength(70),

                        Textarea::make('seo_description')
                            ->label('وصف SEO')
                            ->rows(2)
                            ->maxLength(320),

                        Textarea::make('seo_keywords')
                            ->label('كلمات SEO المفتاحية (مفصولة بفواصل)')
                            ->rows(2),

                        TextInput::make('seo_canonical_url')
                            ->label('الرابط الأساسي (Canonical URL)')
                            ->url()
                            ->maxLength(500),

                        TextInput::make('seo_og_title')
                            ->label('عنوان Open Graph')
                            ->maxLength(120),

                        Textarea::make('seo_og_description')
                            ->label('وصف Open Graph')
                            ->rows(2)
                            ->maxLength(320),

                        TextInput::make('seo_og_image')
                            ->label('رابط صورة Open Graph')
                            ->url()
                            ->maxLength(500),

                        TextInput::make('seo_twitter_handle')
                            ->label('معرّف تويتر')
                            ->maxLength(100),

                        Select::make('seo_twitter_card')
                            ->label('نوع بطاقة تويتر')
                            ->options([
                                'summary' => 'ملخص',
                                'summary_large_image' => 'ملخص مع صورة كبيرة',
                            ])
                            ->native(false),

                        TextInput::make('seo_google_verification')
                            ->label('رمز التحقق من Google')
                            ->maxLength(255),

                        TextInput::make('seo_bing_verification')
                            ->label('رمز التحقق من Bing')
                            ->maxLength(255),

                        Textarea::make('seo_robots_txt')
                            ->label('محتوى robots.txt')
                            ->rows(5),
                    ])
                    ->columns(2),

                Section::make('الاستهداف الجغرافي (GEO)')
                    ->schema([
                        TextInput::make('geo_business_name')
                            ->label('اسم النشاط')
                            ->maxLength(255),

                        Select::make('geo_business_type')
                            ->label('نوع النشاط (Schema.org)')
                            ->options([
                                'EducationalOrganization' => 'منظمة تعليمية',
                                'School' => 'مدرسة',
                                'CollegeOrUniversity' => 'كلية / جامعة',
                                'LocalBusiness' => 'نشاط محلي',
                            ])
                            ->native(false),

                        TextInput::make('geo_country_code')
                            ->label('رمز الدولة (ISO)')
                            ->maxLength(5),

                        TextInput::make('geo_region')
                            ->label('المنطقة / المحافظة')
                            ->maxLength(255),

                        TextInput::make('geo_city')
                            ->label('المدينة')
                            ->maxLength(255),

                        TextInput::make('geo_address')
                            ->label('العنوان')
                            ->maxLength(500),

                        TextInput::make('geo_latitude')
                            ->label('خط العرض (Latitude)')
                            ->numeric(),

                        TextInput::make('geo_longitude')
                            ->label('خط الطول (Longitude)')
                            ->numeric(),

                        TextInput::make('geo_service_radius_km')
                            ->label('نطاق الخدمة (كم)')
                            ->numeric(),

                        TextInput::make('geo_place_id')
                            ->label('معرّف المكان في Google')
                            ->maxLength(255),

                        TextInput::make('geo_knowledge_panel_url')
                            ->label('رابط لوحة المعرفة')
                            ->url()
                            ->maxLength(500),

                        Textarea::make('geo_service_areas')
                            ->label('مناطق الخدمة (مفصولة بفواصل)')
                            ->rows(2),
                    ])
                    ->columns(2),

                Section::make('الثيم الموسمي')
                    ->schema([
                        Select::make('seasonal_theme')
                            ->label('الموسم النشط')
                            ->options(SeasonalThemeService::options())
                            ->required()
                            ->native(false)
                            ->live()
                            ->afterStateUpdated(function ($state, Set $set): void {
                                $activeTheme = SeasonalThemeService::normalizeTheme(
                                    is_string($state) ? $state : null
                                );
                                $resolvedPalette = SeasonalThemeService::resolvePalette(
                                    $activeTheme,
                                    Setting::getValue('seasonal_theme_palettes', null)
                                );

                                $set('seasonal_theme_primary', $resolvedPalette['primary']);
                                $set('seasonal_theme_secondary', $resolvedPalette['secondary']);
                                $set('seasonal_theme_bg_start', $resolvedPalette['bg_start']);
                                $set('seasonal_theme_bg_end', $resolvedPalette['bg_end']);
                            }),

                        Toggle::make('seasonal_theme_enabled')
                            ->label('تنفيذ الثيم')
                            ->default(true),

                        ColorPicker::make('seasonal_theme_primary')
                            ->label('اللون الأساسي')
                            ->required(),

                        Toggle::make('seasonal_theme_apply_primary')
                            ->label('تنفيذ')
                            ->default(true),

                        ColorPicker::make('seasonal_theme_secondary')
                            ->label('اللون الثانوي')
                            ->required(),

                        Toggle::make('seasonal_theme_apply_secondary')
                            ->label('تنفيذ')
                            ->default(true),

                        ColorPicker::make('seasonal_theme_bg_start')
                            ->label('لون الخلفية (البداية)')
                            ->required(),

                        Toggle::make('seasonal_theme_apply_bg_start')
                            ->label('تنفيذ')
                            ->default(true),

                        ColorPicker::make('seasonal_theme_bg_end')
                            ->label('لون الخلفية (النهاية)')
                            ->required(),

                        Toggle::make('seasonal_theme_apply_bg_end')
                            ->label('تنفيذ')
                            ->default(true),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_general')
                            ->label('حفظ العام')
                            ->icon('heroicon-m-globe-alt')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),
            ]);
    }

    public function save(): void
    {
        try {
            $state = $this->form->getState();

            foreach (self::SETTING_KEYS as $key) {
                if (! array_key_exists($key, $state)) {
                    continue;
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => (string) $state[$key],
                        'group' => 'general',
                    ]
                );
            }

            $this->saveSeasonalThemeSettings($state);

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ الإعدادات العامة بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }

    protected function saveSeasonalThemeSettings(array $state): void
    {
        $activeTheme = SeasonalThemeService::normalizeTheme(
            isset($state['seasonal_theme']) && is_string($state['seasonal_theme'])
                ? $state['seasonal_theme']
                : null
        );
        $palette = SeasonalThemeService::sanitizePalette([
            'primary' => $state['seasonal_theme_primary'] ?? null,
            'secondary' => $state['seasonal_theme_secondary'] ?? null,
            'bg_start' => $state['seasonal_theme_bg_start'] ?? null,
            'bg_end' => $state['seasonal_theme_bg_end'] ?? null,
        ], $activeTheme);
        $palettesJson = SeasonalThemeService::updatePaletteJson(
            $activeTheme,
            $palette,
            Setting::getValue('seasonal_theme_palettes', null)
        );

        Setting::updateOrCreate(
            ['key' => 'seasonal_theme'],
            [
                'value' => $activeTheme,
                'group' => 'general',
            ]
        );

        Setting::updateOrCreate(
            ['key' => 'seasonal_theme_palettes'],
            [
                'value' => $palettesJson,
                'group' => 'general',
            ]
        );

        foreach ([
            'seasonal_theme_enabled',
            'seasonal_theme_apply_primary',
            'seasonal_theme_apply_secondary',
            'seasonal_theme_apply_bg_start',
            'seasonal_theme_apply_bg_end',
        ] as $toggleKey) {
            Setting::updateOrCreate(
                ['key' => $toggleKey],
                [
                    'value' => $this->toBoolean($state[$toggleKey] ?? true) ? '1' : '0',
                    'group' => 'general',
                ]
            );
        }
    }

    protected function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return $value !== 0;
        }

        if (! is_string($value)) {
            return false;
        }

        $normalized = strtolower(trim($value));

        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }
}
