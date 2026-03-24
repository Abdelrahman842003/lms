<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Models\Setting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class IntegrationSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static ?string $navigationLabel = 'التكاملات';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات Firebase و Cloudflare';

    protected static ?string $slug = 'system-settings/integrations';

    protected static ?int $navigationSort = 104;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        'firebase_service_account',
        'firebase_project_id',
        'firebase_api_key',
        'firebase_auth_domain',
        'firebase_storage_bucket',
        'firebase_messaging_sender_id',
        'firebase_app_id',
        'cloudflare_r2_access_key_id',
        'cloudflare_r2_secret_access_key',
        'cloudflare_r2_bucket',
        'cloudflare_r2_endpoint',
        'cloudflare_r2_public_url',
    ];

    protected const SECRET_FILES = [
        'firebase_project_id' => ['firebase_project_id.txt', 'firebase_project_id'],
        'cloudflare_r2_access_key_id' => ['cloudflare_r2_access_key_id.txt', 'cloudflare_r2_access_key_id'],
        'cloudflare_r2_secret_access_key' => ['cloudflare_r2_secret_access_key.txt', 'cloudflare_r2_secret_access_key'],
        'cloudflare_r2_bucket' => ['cloudflare_r2_bucket.txt', 'cloudflare_r2_bucket'],
        'cloudflare_r2_endpoint' => ['cloudflare_r2_endpoint.txt', 'cloudflare_r2_endpoint'],
        'cloudflare_r2_public_url' => ['cloudflare_r2_public_url.txt', 'cloudflare_r2_public_url'],
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $state = [];

        foreach (self::SETTING_KEYS as $key) {
            $state[$key] = (string) Setting::getValue($key, '');
        }

        if ($state['firebase_service_account'] === '') {
            $state['firebase_service_account'] = $this->readFirebaseServiceAccountSecret() ?? '';
        }

        foreach (self::SECRET_FILES as $key => $filenames) {
            if ($state[$key] !== '') {
                continue;
            }

            $state[$key] = $this->readSecretFile($filenames) ?? '';
        }

        $this->form->fill($state);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('Firebase')
                    ->schema([
                        Textarea::make('firebase_service_account')
                            ->label('Service Account (JSON أو مسار ملف)')
                            ->rows(9)
                            ->helperText('يمكن إدخال JSON مباشرة أو مسار ملف داخل السيرفر.'),

                        TextInput::make('firebase_project_id')
                            ->label('Project ID')
                            ->maxLength(255),

                        TextInput::make('firebase_api_key')
                            ->label('API Key')
                            ->maxLength(500),

                        TextInput::make('firebase_auth_domain')
                            ->label('Auth Domain')
                            ->maxLength(255),

                        TextInput::make('firebase_storage_bucket')
                            ->label('Storage Bucket')
                            ->maxLength(255),

                        TextInput::make('firebase_messaging_sender_id')
                            ->label('Messaging Sender ID')
                            ->maxLength(255),

                        TextInput::make('firebase_app_id')
                            ->label('App ID')
                            ->maxLength(255),
                    ])
                    ->columns(2),

                Section::make('Cloudflare R2')
                    ->schema([
                        TextInput::make('cloudflare_r2_access_key_id')
                            ->label('Access Key ID')
                            ->maxLength(255),

                        TextInput::make('cloudflare_r2_secret_access_key')
                            ->label('Secret Access Key')
                            ->password()
                            ->revealable()
                            ->maxLength(255),

                        TextInput::make('cloudflare_r2_bucket')
                            ->label('Bucket')
                            ->maxLength(255),

                        TextInput::make('cloudflare_r2_endpoint')
                            ->label('Endpoint')
                            ->maxLength(500),

                        TextInput::make('cloudflare_r2_public_url')
                            ->label('Public URL')
                            ->maxLength(500),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_integrations')
                            ->label('حفظ التكاملات')
                            ->icon('heroicon-m-puzzle-piece')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),
            ]);
    }

    public function save(): void
    {
        try {
            $state = $this->form->getState();

            $firebaseServiceAccount = trim((string) ($state['firebase_service_account'] ?? ''));
            $state['firebase_service_account'] = $this->normalizeFirebaseServiceAccount($firebaseServiceAccount);

            if ($state['firebase_service_account'] === null) {
                Notification::make()
                    ->danger()
                    ->title('صيغة Firebase Service Account غير صحيحة')
                    ->send();
                return;
            }

            foreach (self::SETTING_KEYS as $key) {
                if (! array_key_exists($key, $state)) {
                    continue;
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => trim((string) $state[$key]),
                        'group' => 'integration',
                    ]
                );
            }

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات Firebase و Cloudflare بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }

    public function importFromSecrets(): void
    {
        $imported = [];

        $firebaseServiceAccount = $this->readFirebaseServiceAccountSecret();
        if ($firebaseServiceAccount !== null) {
            $imported['firebase_service_account'] = $firebaseServiceAccount;
        }

        foreach (self::SECRET_FILES as $key => $filenames) {
            $value = $this->readSecretFile($filenames);
            if ($value === null) {
                continue;
            }

            $imported[$key] = $value;
        }

        if ($imported === []) {
            Notification::make()
                ->danger()
                ->title('لم يتم العثور على ملفات secrets المطلوبة')
                ->send();
            return;
        }

        $this->form->fill(array_merge($this->form->getState(), $imported));

        Notification::make()
            ->success()
            ->title('تم تحميل القيم من مجلد secrets. اضغط حفظ لتثبيتها.')
            ->send();
    }

    private function normalizeFirebaseServiceAccount(string $value): ?string
    {
        if ($value === '') {
            return '';
        }

        if (is_file($value)) {
            $content = trim((string) file_get_contents($value));
            if ($content === '') {
                return null;
            }

            $decoded = json_decode($content, true);

            return (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $content : null;
        }

        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $value;
        }

        if (str_starts_with($value, '{') || str_starts_with($value, '[')) {
            return null;
        }

        return $value;
    }

    /**
     * @param array<int, string> $filenames
     */
    private function readSecretFile(array $filenames): ?string
    {
        foreach ($this->secretsDirectories() as $directory) {
            foreach ($filenames as $filename) {
                $path = $directory . DIRECTORY_SEPARATOR . $filename;

                if (! is_file($path) || ! is_readable($path)) {
                    continue;
                }

                $content = trim((string) file_get_contents($path));

                if ($content !== '') {
                    return $content;
                }
            }
        }

        return null;
    }

    private function readFirebaseServiceAccountSecret(): ?string
    {
        foreach ($this->secretsDirectories() as $directory) {
            foreach (['firebase_credentials.json', 'firebase_credentials'] as $filename) {
                $path = $directory . DIRECTORY_SEPARATOR . $filename;
                if (! is_file($path) || ! is_readable($path)) {
                    continue;
                }

                $content = trim((string) file_get_contents($path));
                if ($content !== '') {
                    return $content;
                }
            }

            $matches = glob($directory . DIRECTORY_SEPARATOR . '*firebase*adminsdk*.json');
            if ($matches === false || $matches === []) {
                continue;
            }

            sort($matches);
            $content = trim((string) file_get_contents($matches[0]));
            if ($content !== '') {
                return $content;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function secretsDirectories(): array
    {
        $directories = [
            trim((string) env('SECRETS_DIR', '')),
            dirname(base_path()) . DIRECTORY_SEPARATOR . 'secrets',
            base_path('secrets'),
            '/run/secrets',
        ];

        $directories = array_values(array_unique(array_filter($directories, fn (string $dir): bool => $dir !== '')));

        return array_values(array_filter($directories, fn (string $dir): bool => is_dir($dir)));
    }
}
