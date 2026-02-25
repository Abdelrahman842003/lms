<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Models\Setting;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Grid;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Forms\Components\Tabs;
use Illuminate\Support\Facades\Cache;

class SystemSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-wrench-screwdriver';

    protected static ?string $navigationLabel = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات النظام';

    protected static ?string $slug = 'system-settings';

    protected static ?int $navigationSort = 100;

    protected static string $view = 'filament.pages.system-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->loadSettings();
    }

    protected function loadSettings(): void
    {
        $settings = [];

        // General settings
        $settings['site_name'] = Setting::getValue('site_name', 'My Academy');
        $settings['site_description'] = Setting::getValue('site_description', '');
        $settings['contact_email'] = Setting::getValue('contact_email', '');
        $settings['contact_phone'] = Setting::getValue('contact_phone', '');

        // Payment settings
        $settings['payment_enabled'] = (bool) Setting::getValue('payment_enabled', true);
        $settings['vat_percentage'] = Setting::getValue('vat_percentage', '14');
        $settings['currency'] = Setting::getValue('currency', 'EGP');

        // Notification settings
        $settings['email_notifications'] = (bool) Setting::getValue('email_notifications', true);
        $settings['sms_notifications'] = (bool) Setting::getValue('sms_notifications', false);
        $settings['push_notifications'] = (bool) Setting::getValue('push_notifications', true);

        // Subscription settings
        $settings['default_student_quota'] = Setting::getValue('default_student_quota', '100');
        $settings['trial_days'] = Setting::getValue('trial_days', '14');

        $this->form->fill($settings);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Tabs::make('Settings')
                    ->tabs([
                        Tabs\Tab::make('general')
                            ->label('عام')
                            ->icon('heroicon-o-globe-alt')
                            ->schema([
                                Section::make('معلومات الموقع')
                                    ->schema([
                                        TextInput::make('site_name')
                                            ->label('اسم الموقع')
                                            ->required()
                                            ->maxLength(255),

                                        Textarea::make('site_description')
                                            ->label('وصف الموقع')
                                            ->rows(2),

                                        TextInput::make('contact_email')
                                            ->label('البريد الإلكتروني للتواصل')
                                            ->email()
                                            ->maxLength(255),

                                        TextInput::make('contact_phone')
                                            ->label('رقم الهاتف للتواصل')
                                            ->tel()
                                            ->maxLength(20),
                                    ])
                                    ->columns(2),
                            ]),

                        Tabs\Tab::make('payment')
                            ->label('الدفع')
                            ->icon('heroicon-o-credit-card')
                            ->schema([
                                Section::make('إعدادات الدفع')
                                    ->schema([
                                        Toggle::make('payment_enabled')
                                            ->label('تفعيل الدفع')
                                            ->default(true),

                                        TextInput::make('vat_percentage')
                                            ->label('نسبة الضريبة (%)')
                                            ->numeric()
                                            ->default('14'),

                                        TextInput::make('currency')
                                            ->label('العملة')
                                            ->default('EGP')
                                            ->maxLength(10),
                                    ])
                                    ->columns(2),
                            ]),

                        Tabs\Tab::make('notifications')
                            ->label('الإشعارات')
                            ->icon('heroicon-o-bell')
                            ->schema([
                                Section::make('إعدادات الإشعارات')
                                    ->schema([
                                        Toggle::make('email_notifications')
                                            ->label('إشعارات البريد الإلكتروني')
                                            ->default(true),

                                        Toggle::make('sms_notifications')
                                            ->label('إشعارات الرسائل القصيرة')
                                            ->default(false),

                                        Toggle::make('push_notifications')
                                            ->label('إشعارات الدفع')
                                            ->default(true),
                                    ])
                                    ->columns(1),
                            ]),

                        Tabs\Tab::make('subscription')
                            ->label('الاشتراكات')
                            ->icon('heroicon-o-ticket')
                            ->schema([
                                Section::make('إعدادات الاشتراكات')
                                    ->schema([
                                        TextInput::make('default_student_quota')
                                            ->label('الحد الأقصى الافتراضي للطلاب')
                                            ->numeric()
                                            ->default('100'),

                                        TextInput::make('trial_days')
                                            ->label('فترة التجربة (بالأيام)')
                                            ->numeric()
                                            ->default('14'),
                                    ])
                                    ->columns(2),
                            ]),
                    ])
                    ->contained(false),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        try {
            foreach ($data as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
                        'group' => $this->getSettingGroup($key),
                        'type' => is_bool($value) ? 'toggle' : 'text',
                    ]
                );
            }

            // Clear settings cache
            Cache::flush();

            $this->notify('success', 'تم حفظ الإعدادات بنجاح');
        } catch (\Exception $e) {
            $this->notify('danger', 'حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage());
        }
    }

    protected function getSettingGroup(string $key): string
    {
        return match (true) {
            str_starts_with($key, 'site_') || in_array($key, ['contact_email', 'contact_phone']) => 'general',
            str_contains($key, 'payment') || str_contains($key, 'vat') || $key === 'currency' => 'payment',
            str_contains($key, 'notification') => 'notification',
            str_contains($key, 'quota') || str_contains($key, 'trial') => 'subscription',
            default => 'general',
        };
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('save')
                ->label('حفظ الإعدادات')
                ->icon('heroicon-m-check')
                ->color('primary')
                ->action(fn () => $this->save()),
        ];
    }
}