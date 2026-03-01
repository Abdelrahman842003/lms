<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Support\Models\Setting;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class NotificationSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-bell';

    protected static ?string $navigationLabel = 'الإشعارات';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات الإشعارات';

    protected static ?string $slug = 'system-settings/notifications';

    protected static ?int $navigationSort = 101;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        'email_notifications',
        'sms_notifications',
        'push_notifications',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'email_notifications' => (bool) Setting::getValue('email_notifications', true),
            'sms_notifications' => (bool) Setting::getValue('sms_notifications', false),
            'push_notifications' => (bool) Setting::getValue('push_notifications', true),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
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
                    ->columns(1)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_notifications')
                            ->label('حفظ الإشعارات')
                            ->icon('heroicon-m-bell')
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

                $value = (bool) $state[$key];

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $value ? '1' : '0',
                        'group' => 'notification',
                    ]
                );
            }

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات الإشعارات بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }
}
