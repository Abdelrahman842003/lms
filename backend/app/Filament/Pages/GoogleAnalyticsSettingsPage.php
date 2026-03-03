<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Support\Models\Setting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;
use BezhanSalleh\GoogleAnalytics\Widgets;

class GoogleAnalyticsSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'تحليلات جوجل';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'تحليلات جوجل';

    protected static ?string $slug = 'google-analytics-dashboard';

    protected static ?int $navigationSort = 103;

    protected string $view = 'filament.pages.google-analytics-settings';

    protected const SETTING_KEYS = [
        'analytics_property_id',
        'analytics_service_account_json',
    ];

    public ?array $data = [];

    public bool $analyticsConfigured = false;

    public function mount(): void
    {
        $propertyId = Setting::getValue('analytics_property_id', '');
        $serviceAccountJson = Setting::getValue('analytics_service_account_json', '');

        $this->form->fill([
            'analytics_property_id' => $propertyId,
            'analytics_service_account_json' => $serviceAccountJson,
        ]);

        $this->analyticsConfigured = $this->isAnalyticsConfigured($propertyId, $serviceAccountJson);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('إعدادات Google Analytics')
                    ->schema([
                        TextInput::make('analytics_property_id')
                            ->label('معرّف الخاصية (Property ID)')
                            ->maxLength(100)
                            ->helperText('مثال: 123456789'),

                        Textarea::make('analytics_service_account_json')
                            ->label('بيانات حساب الخدمة (JSON)')
                            ->rows(8)
                            ->helperText('الصق محتوى ملف JSON الخاص بحساب الخدمة.'),
                    ])
                    ->columns(1)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_google_analytics')
                            ->label('حفظ إعدادات تحليلات جوجل')
                            ->icon('heroicon-m-chart-bar')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),
            ]);
    }

    public function save(): void
    {
        try {
            $state = $this->form->getState();

            $propertyId = trim((string) ($state['analytics_property_id'] ?? ''));
            $serviceAccountJson = trim((string) ($state['analytics_service_account_json'] ?? ''));

            if ($serviceAccountJson !== '') {
                $decoded = json_decode($serviceAccountJson, true);
                if (json_last_error() !== JSON_ERROR_NONE || ! is_array($decoded)) {
                    Notification::make()
                        ->danger()
                        ->title('صيغة JSON غير صحيحة في بيانات حساب الخدمة')
                        ->send();
                    return;
                }
            }

            foreach (self::SETTING_KEYS as $key) {
                if (! array_key_exists($key, $state)) {
                    continue;
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => (string) $state[$key],
                        'group' => 'analytics',
                    ]
                );
            }

            Cache::flush();

            $this->analyticsConfigured = $this->isAnalyticsConfigured($propertyId, $serviceAccountJson);

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات تحليلات جوجل بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }

    /**
     * @return array<class-string<\Filament\Widgets\Widget>>
     */
    protected function getHeaderWidgets(): array
    {
        if (! $this->analyticsConfigured) {
            return [];
        }

        return [
            Widgets\PageViewsWidget::class,
            Widgets\VisitorsWidget::class,
            Widgets\ActiveUsersOneDayWidget::class,
            Widgets\ActiveUsersSevenDayWidget::class,
            Widgets\ActiveUsersTwentyEightDayWidget::class,
            Widgets\SessionsWidget::class,
            Widgets\SessionsByCountryWidget::class,
            Widgets\SessionsDurationWidget::class,
            Widgets\SessionsByDeviceWidget::class,
            Widgets\MostVisitedPagesWidget::class,
            Widgets\TopReferrersListWidget::class,
        ];
    }

    protected function isAnalyticsConfigured(string $propertyId, string $serviceAccountJson): bool
    {
        if ($propertyId === '' || $serviceAccountJson === '') {
            return false;
        }

        $decoded = json_decode($serviceAccountJson, true);

        return json_last_error() === JSON_ERROR_NONE && is_array($decoded);
    }
}
