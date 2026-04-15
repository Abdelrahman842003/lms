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

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'firebase_service_account' => config('services.firebase.credentials'),
            'firebase_project_id' => config('services.firebase.project_id'),
            'firebase_api_key' => config('services.firebase.api_key'),
            'firebase_auth_domain' => config('services.firebase.auth_domain'),
            'firebase_storage_bucket' => config('services.firebase.storage_bucket'),
            'firebase_messaging_sender_id' => config('services.firebase.messaging_sender_id'),
            'firebase_app_id' => config('services.firebase.app_id'),
            'cloudflare_r2_access_key_id' => config('services.cloudflare.r2.access_key_id'),
            'cloudflare_r2_secret_access_key' => config('services.cloudflare.r2.secret_access_key'),
            'cloudflare_r2_bucket' => config('services.cloudflare.r2.bucket'),
            'cloudflare_r2_endpoint' => config('services.cloudflare.r2.endpoint'),
            'cloudflare_r2_public_url' => config('services.cloudflare.r2.public_url'),
            'cloudflare_kv_account_id' => config('services.cloudflare.kv.account_id'),
            'cloudflare_kv_api_token' => config('services.cloudflare.kv.api_token'),
            'cloudflare_kv_namespace_id' => config('services.cloudflare.kv.namespace_id'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('Firebase')
                    ->description('يتم إدارة هذه الإعدادات عبر متغيرات البيئة (Environment Variables) في Coolify.')
                    ->schema([
                        Textarea::make('firebase_service_account')
                            ->label('Service Account (JSON)')
                            ->rows(9)
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_project_id')
                            ->label('Project ID')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_api_key')
                            ->label('API Key')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_auth_domain')
                            ->label('Auth Domain')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_storage_bucket')
                            ->label('Storage Bucket')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_messaging_sender_id')
                            ->label('Messaging Sender ID')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('firebase_app_id')
                            ->label('App ID')
                            ->disabled()
                            ->dehydrated(false),
                    ])
                    ->columns(2),

                Section::make('Cloudflare R2')
                    ->description('يتم إدارة هذه الإعدادات عبر متغيرات البيئة (Environment Variables) في Coolify.')
                    ->schema([
                        TextInput::make('cloudflare_r2_access_key_id')
                            ->label('Access Key ID')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_r2_secret_access_key')
                            ->label('Secret Access Key')
                            ->password()
                            ->revealable()
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_r2_bucket')
                            ->label('Bucket')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_r2_endpoint')
                            ->label('Endpoint')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_r2_public_url')
                            ->label('Public URL')
                            ->disabled()
                            ->dehydrated(false),
                    ])
                    ->columns(2),

                Section::make('Cloudflare KV')
                    ->description('يتم إدارة هذه الإعدادات عبر متغيرات البيئة (Environment Variables) في Coolify.')
                    ->schema([
                        TextInput::make('cloudflare_kv_account_id')
                            ->label('Account ID')
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_kv_api_token')
                            ->label('API Token')
                            ->password()
                            ->revealable()
                            ->disabled()
                            ->dehydrated(false),

                        TextInput::make('cloudflare_kv_namespace_id')
                            ->label('Namespace ID')
                            ->disabled()
                            ->dehydrated(false),
                    ])
                    ->columns(2),
            ]);
    }

    public function save(): void
    {
        // Save functionality is deprecated and moved to Environment Variables.
    }
}
