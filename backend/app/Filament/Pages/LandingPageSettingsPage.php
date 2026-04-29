<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Models\Setting;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class LandingPageSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home-modern';

    protected static ?string $navigationLabel = 'إعدادات صفحة الهبوط';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إدارة محتوى صفحة الهبوط';

    protected static ?string $slug = 'system-settings/landing-page';

    protected static ?int $navigationSort = 105;

    protected string $view = 'filament.pages.system-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $content = json_decode(Setting::getValue('landing_page_content', '{}'), true);

        $this->form->fill([
            'hero_badge' => $content['hero']['badge'] ?? '',
            'hero_title' => $content['hero']['title'] ?? '',
            'hero_subtitle' => $content['hero']['subtitle'] ?? '',
            'hero_description' => $content['hero']['description'] ?? '',
            'hero_cta_primary' => $content['hero']['cta_primary'] ?? '',
            'hero_cta_secondary' => $content['hero']['cta_secondary'] ?? '',
            'features' => $content['features'] ?? [],
            'stats' => $content['stats'] ?? [],
            'testimonials' => $content['testimonials'] ?? [],
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('قسم الـ Hero')
                    ->description('العنوان الرئيسي والوصف في أعلى الصفحة.')
                    ->schema([
                        TextInput::make('hero_badge')
                            ->label('النص العلوي (Badge)')
                            ->maxLength(50)
                            ->columnSpan(2),
                        TextInput::make('hero_title')
                            ->label('العنوان الرئيسي')
                            ->maxLength(100)
                            ->required(),
                        TextInput::make('hero_subtitle')
                            ->label('العنوان الفرعي')
                            ->maxLength(100)
                            ->required(),
                        Textarea::make('hero_description')
                            ->label('الوصف')
                            ->maxLength(500)
                            ->rows(3)
                            ->columnSpan(2),
                        TextInput::make('hero_cta_primary')
                            ->label('نص الزر الرئيسي')
                            ->maxLength(30),
                        TextInput::make('hero_cta_secondary')
                            ->label('نص الزر الثانوي')
                            ->maxLength(30),
                    ])
                    ->columns(2),

                Section::make('المميزات (Features)')
                    ->schema([
                        Repeater::make('features')
                            ->label('قائمة المميزات')
                            ->schema([
                                TextInput::make('icon')
                                    ->label('الأيقونة (Heroicon)')
                                    ->maxLength(50)
                                    ->placeholder('heroicon-o-rocket-launch'),
                                TextInput::make('title')
                                    ->label('العنوان')
                                    ->maxLength(100)
                                    ->required(),
                                Textarea::make('description')
                                    ->label('الوصف')
                                    ->maxLength(300)
                                    ->required(),
                            ])
                            ->columns(1)
                            ->itemLabel(fn (array $state): ?string => $state['title'] ?? null),
                    ]),

                Section::make('الإحصائيات (Stats)')
                    ->schema([
                        Repeater::make('stats')
                            ->label('قائمة الإحصائيات')
                            ->schema([
                                TextInput::make('label')
                                    ->label('العنوان')
                                    ->maxLength(50)
                                    ->required(),
                                TextInput::make('value')
                                    ->label('القيمة')
                                    ->maxLength(20)
                                    ->required(),
                            ])
                            ->columns(2),
                    ]),

                Section::make('آراء العملاء (Testimonials)')
                    ->schema([
                        Repeater::make('testimonials')
                            ->label('قائمة الآراء')
                            ->schema([
                                TextInput::make('name')
                                    ->label('اسم العميل')
                                    ->maxLength(100)
                                    ->required(),
                                TextInput::make('role')
                                    ->label('الوظيفة/اللقب')
                                    ->maxLength(100)
                                    ->required(),
                                Textarea::make('quote')
                                    ->label('الرأي')
                                    ->maxLength(500)
                                    ->required(),
                            ])
                            ->columns(1)
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? null),
                    ])
                    ->footerActions([
                        \Filament\Actions\Action::make('save_landing')
                            ->label('حفظ محتوى الصفحة')
                            ->icon('heroicon-m-check')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),
            ]);
    }

    public function save(): void
    {
        try {
            $state = $this->form->getState();

            $content = [
                'hero' => [
                    'badge' => $state['hero_badge'],
                    'title' => $state['hero_title'],
                    'subtitle' => $state['hero_subtitle'],
                    'description' => $state['hero_description'],
                    'cta_primary' => $state['hero_cta_primary'],
                    'cta_secondary' => $state['hero_cta_secondary'],
                ],
                'features' => $state['features'],
                'stats' => $state['stats'],
                'testimonials' => $state['testimonials'],
            ];

            Setting::updateOrCreate(
                ['key' => 'landing_page_content'],
                [
                    'value' => json_encode($content, JSON_UNESCAPED_UNICODE),
                    'group' => 'landing',
                ]
            );

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ محتوى صفحة الهبوط بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }
}
