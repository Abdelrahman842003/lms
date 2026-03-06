<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Support\Models\Setting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class VideoSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-film';

    protected static ?string $navigationLabel = 'إعدادات الفيديو';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات الفيديو التعليمية';

    protected static ?string $slug = 'system-settings/videos';

    protected static ?int $navigationSort = 103;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        'video_playback_token_ttl_seconds',
        'video_max_concurrent_devices_per_student',
        'video_watermark_enabled',
        'video_watermark_rotation_interval_seconds',
        'video_reminder_interval_hours',
        'video_reminder_max_attempts',
        'video_completed_threshold_percent',
        'video_allowed_video_mime_types',
        'video_allowed_attachment_mime_types',
        'video_notifications_enabled',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'video_target_resolution' => '720p',
            'video_playback_token_ttl_seconds' => (int) Setting::getValue('video_playback_token_ttl_seconds', '120'),
            'video_max_concurrent_devices_per_student' => (int) Setting::getValue('video_max_concurrent_devices_per_student', '2'),
            'video_watermark_enabled' => $this->toBool(Setting::getValue('video_watermark_enabled', '1')),
            'video_watermark_rotation_interval_seconds' => (int) Setting::getValue('video_watermark_rotation_interval_seconds', '8'),
            'video_reminder_interval_hours' => (int) Setting::getValue('video_reminder_interval_hours', '12'),
            'video_reminder_max_attempts' => (int) Setting::getValue('video_reminder_max_attempts', '5'),
            'video_completed_threshold_percent' => (int) Setting::getValue('video_completed_threshold_percent', '80'),
            'video_allowed_video_mime_types' => $this->jsonPretty(Setting::getValue('video_allowed_video_mime_types', json_encode(['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm']))),
            'video_allowed_attachment_mime_types' => $this->jsonPretty(Setting::getValue('video_allowed_attachment_mime_types', json_encode(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']))),
            'video_notifications_enabled' => $this->toBool(Setting::getValue('video_notifications_enabled', '1')),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('إعدادات التشغيل والأمان')
                    ->schema([
                        TextInput::make('video_target_resolution')
                            ->label('الدقة المستهدفة')
                            ->disabled(),

                        TextInput::make('video_playback_token_ttl_seconds')
                            ->label('مدة صلاحية playback token (ثانية)')
                            ->numeric()
                            ->minValue(30)
                            ->required(),

                        TextInput::make('video_max_concurrent_devices_per_student')
                            ->label('الحد الأقصى للأجهزة المتزامنة لكل طالب')
                            ->numeric()
                            ->minValue(1)
                            ->required(),

                        Toggle::make('video_watermark_enabled')
                            ->label('تفعيل Watermark داخل المشغل')
                            ->default(true),

                        TextInput::make('video_watermark_rotation_interval_seconds')
                            ->label('زمن تغيير مكان Watermark (ثانية)')
                            ->numeric()
                            ->minValue(3)
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('إعدادات التتبع والتذكيرات')
                    ->schema([
                        TextInput::make('video_reminder_interval_hours')
                            ->label('فاصل التذكير (ساعة)')
                            ->numeric()
                            ->minValue(1)
                            ->required(),

                        TextInput::make('video_reminder_max_attempts')
                            ->label('أقصى عدد للتذكيرات')
                            ->numeric()
                            ->minValue(1)
                            ->required(),

                        TextInput::make('video_completed_threshold_percent')
                            ->label('نسبة الاكتمال (%)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(100)
                            ->required(),

                        Toggle::make('video_notifications_enabled')
                            ->label('تفعيل إشعارات الفيديو الداخلية')
                            ->default(true),
                    ])
                    ->columns(2),

                Section::make('أنواع الملفات المسموح بها')
                    ->schema([
                        Textarea::make('video_allowed_video_mime_types')
                            ->label('MIME Types للفيديو (JSON Array)')
                            ->rows(5)
                            ->required(),

                        Textarea::make('video_allowed_attachment_mime_types')
                            ->label('MIME Types للمرفقات (JSON Array)')
                            ->rows(5)
                            ->required(),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_videos_settings')
                            ->label('حفظ إعدادات الفيديو')
                            ->icon('heroicon-m-film')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),
            ]);
    }

    public function save(): void
    {
        $state = $this->form->getState();

        foreach (self::SETTING_KEYS as $key) {
            if (! array_key_exists($key, $state)) {
                continue;
            }

            $value = $state[$key];

            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            if (in_array($key, ['video_allowed_video_mime_types', 'video_allowed_attachment_mime_types'], true)) {
                $decoded = json_decode((string) $value, true);

                if (! is_array($decoded)) {
                    Notification::make()
                        ->danger()
                        ->title('صيغة JSON غير صحيحة في أنواع الملفات المسموح بها')
                        ->send();
                    return;
                }

                $value = json_encode(array_values(array_map('strval', $decoded)), JSON_UNESCAPED_UNICODE);
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => (string) $value,
                    'group' => 'video',
                ]
            );
        }

        Cache::flush();

        Notification::make()
            ->success()
            ->title('تم حفظ إعدادات الفيديو بنجاح')
            ->send();
    }

    private function jsonPretty(string $value): string
    {
        $decoded = json_decode($value, true);

        if (! is_array($decoded)) {
            return $value;
        }

        return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) ?: $value;
    }

    private function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }
}
