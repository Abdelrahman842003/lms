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
        // Playback & security
        'video_playback_token_ttl_seconds',
        'video_max_concurrent_devices_per_student',
        'video_watermark_enabled',
        'video_watermark_rotation_interval_seconds',
        // Tracking & reminders
        'video_reminder_interval_hours',
        'video_reminder_max_attempts',
        'video_completed_threshold_percent',
        'video_notifications_enabled',
        // Allowed types
        'video_allowed_video_mime_types',
        'video_allowed_attachment_mime_types',
        'video_allowed_video_extensions',
        // Upload limits
        'video_max_upload_size_mb',
        'video_attachment_max_size_mb',
        // Direct upload (new)
        'video_direct_upload_enabled',
        'video_chunk_size_mb',
        'video_max_concurrent_chunks',
        'video_presigned_url_ttl_seconds',
        'video_part_retry_attempts',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            // Playback
            'video_playback_token_ttl_seconds'          => (int) Setting::getValue('video_playback_token_ttl_seconds', '120'),
            'video_max_concurrent_devices_per_student' => (int) Setting::getValue('video_max_concurrent_devices_per_student', '2'),
            'video_watermark_enabled'                  => $this->toBool(Setting::getValue('video_watermark_enabled', '1')),
            'video_watermark_rotation_interval_seconds' => (int) Setting::getValue('video_watermark_rotation_interval_seconds', '8'),
            // Tracking
            'video_reminder_interval_hours'    => (int) Setting::getValue('video_reminder_interval_hours', '12'),
            'video_reminder_max_attempts'      => (int) Setting::getValue('video_reminder_max_attempts', '5'),
            'video_completed_threshold_percent' => (int) Setting::getValue('video_completed_threshold_percent', '80'),
            'video_notifications_enabled'      => $this->toBool(Setting::getValue('video_notifications_enabled', '1')),
            // Types
            'video_allowed_video_mime_types'       => $this->jsonPretty(Setting::getValue('video_allowed_video_mime_types', json_encode(['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm']))),
            'video_allowed_attachment_mime_types'  => $this->jsonPretty(Setting::getValue('video_allowed_attachment_mime_types', json_encode(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']))),
            'video_allowed_video_extensions'       => $this->jsonPretty(Setting::getValue('video_allowed_video_extensions', json_encode(['mp4', 'mov', 'mkv', 'webm']))),
            // Limits
            'video_max_upload_size_mb'       => (int) Setting::getValue('video_max_upload_size_mb', '4096'),
            'video_attachment_max_size_mb'   => (int) Setting::getValue('video_attachment_max_size_mb', '25'),
            // Direct upload
            'video_direct_upload_enabled'      => $this->toBool(Setting::getValue('video_direct_upload_enabled', '1')),
            'video_chunk_size_mb'              => (int) Setting::getValue('video_chunk_size_mb', '10'),
            'video_max_concurrent_chunks'      => (int) Setting::getValue('video_max_concurrent_chunks', '3'),
            'video_presigned_url_ttl_seconds'  => (int) Setting::getValue('video_presigned_url_ttl_seconds', '3600'),
            'video_part_retry_attempts'        => (int) Setting::getValue('video_part_retry_attempts', '3'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([

                Section::make('رفع الفيديو المباشر إلى R2 (Direct Upload)')
                    ->description('التحكم في آلية الرفع المباشر من المتصفح إلى Cloudflare R2 دون المرور بالسيرفر.')
                    ->schema([
                        Toggle::make('video_direct_upload_enabled')
                            ->label('تفعيل الرفع المباشر إلى R2')
                            ->helperText('عند التفعيل، الفيديو يُرفع مباشرةً من المتصفح إلى R2 دون المرور بالسيرفر.')
                            ->default(true),

                        TextInput::make('video_max_upload_size_mb')
                            ->label('الحد الأقصى لحجم الفيديو (MB)')
                            ->numeric()
                            ->minValue(100)
                            ->required()
                            ->helperText('الحد يُفرض على الـ backend عند الـ initiate. لا حاجة لتغيير nginx بعد Direct Upload.'),

                        TextInput::make('video_chunk_size_mb')
                            ->label('حجم الـ Chunk (MB)')
                            ->numeric()
                            ->minValue(5)
                            ->maxValue(100)
                            ->required()
                            ->helperText('الحجم الموصى به: 10–25 MB. الحد الأدنى لـ R2 هو 5 MB للأجزاء الوسطية.'),

                        TextInput::make('video_max_concurrent_chunks')
                            ->label('عدد الأجزاء المتوازية (Max Concurrent)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(10)
                            ->required(),

                        TextInput::make('video_presigned_url_ttl_seconds')
                            ->label('مدة صلاحية Presigned URL (ثانية)')
                            ->numeric()
                            ->minValue(300)
                            ->required()
                            ->helperText('يجب أن تكفي لإكمال الرفع. القيمة الافتراضية: 3600 ثانية (ساعة).'),

                        TextInput::make('video_part_retry_attempts')
                            ->label('عدد محاولات إعادة رفع الجزء الفاشل')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(10)
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('إعدادات التشغيل والأمان')
                    ->description('تحكم في صلاحيات مشاهدة الفيديو وحماية المحتوى.')
                    ->schema([
                        TextInput::make('video_playback_token_ttl_seconds')
                            ->label('مدة صلاحية رمز التشغيل (ثانية)')
                            ->numeric()
                            ->minValue(30)
                            ->required()
                            ->helperText('كم ثانية يظل رمز تشغيل الفيديو صالحًا بعد طلبه. القيمة الافتراضية: 120 ثانية.'),

                        TextInput::make('video_max_concurrent_devices_per_student')
                            ->label('أقصى عدد أجهزة متزامنة للطالب الواحد')
                            ->numeric()
                            ->minValue(1)
                            ->required()
                            ->helperText('كم جهازًا يستطيع الطالب مشاهدة الفيديو عليها في نفس الوقت.'),

                        Toggle::make('video_watermark_enabled')
                            ->label('تفعيل العلامة المائية داخل المشغل')
                            ->helperText('عند التفعيل، يظهر اسم الطالب متحركًا على الفيديو لمنع التسجيل.')
                            ->default(true),

                        TextInput::make('video_watermark_rotation_interval_seconds')
                            ->label('سرعة تغيير موضع العلامة المائية (ثانية)')
                            ->numeric()
                            ->minValue(3)
                            ->required()
                            ->helperText('كل كم ثانية تتحرك العلامة المائية إلى مكان مختلف.'),
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

                Section::make('أنواع الملفات والحدود')
                    ->schema([
                        Textarea::make('video_allowed_video_mime_types')
                            ->label('MIME Types للفيديو (JSON Array)')
                            ->rows(4)
                            ->required(),

                        Textarea::make('video_allowed_video_extensions')
                            ->label('امتدادات الفيديو المسموح بها (JSON Array)')
                            ->rows(4)
                            ->required(),

                        Textarea::make('video_allowed_attachment_mime_types')
                            ->label('MIME Types للمرفقات (JSON Array)')
                            ->rows(4)
                            ->required(),

                        TextInput::make('video_attachment_max_size_mb')
                            ->label('الحد الأقصى لحجم المرفق (MB)')
                            ->numeric()
                            ->minValue(1)
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

        $jsonKeys = [
            'video_allowed_video_mime_types',
            'video_allowed_attachment_mime_types',
            'video_allowed_video_extensions',
        ];

        foreach (self::SETTING_KEYS as $key) {
            if (! array_key_exists($key, $state)) {
                continue;
            }

            $value = $state[$key];

            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            if (in_array($key, $jsonKeys, true)) {
                $decoded = json_decode((string) $value, true);

                if (! is_array($decoded)) {
                    Notification::make()
                        ->danger()
                        ->title("صيغة JSON غير صحيحة في الحقل: {$key}")
                        ->send();
                    return;
                }

                $value = json_encode(array_values(array_map('strval', $decoded)), JSON_UNESCAPED_UNICODE);
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value, 'group' => 'video']
            );
        }

        Cache::flush();

        Notification::make()
            ->success()
            ->title('تم حفظ إعدادات الفيديو بنجاح')
            ->send();
    }

    private function jsonPretty(mixed $value): string
    {
        $decoded = json_decode((string) $value, true);

        if (! is_array($decoded)) {
            return (string) $value;
        }

        return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) ?: (string) $value;
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
