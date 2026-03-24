<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Models\Setting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

class SubscriptionSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-ticket';

    protected static ?string $navigationLabel = 'الاشتراكات';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات الاشتراكات';

    protected static ?string $slug = 'system-settings/subscriptions';

    protected static ?int $navigationSort = 102;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        'trial_period_days',
        'teacher_price_per_student',
        'academy_price_per_student',
        'default_teacher_storage_gb',
        'default_academy_storage_gb',
        'teacher_storage_price_per_gb',
        'academy_storage_price_per_gb',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'trial_period_days'             => Setting::getValue('trial_period_days', '14'),
            'teacher_price_per_student'     => Setting::getValue('teacher_price_per_student', '60'),
            'academy_price_per_student'     => Setting::getValue('academy_price_per_student', '40'),
            'default_teacher_storage_gb'    => Setting::getValue('default_teacher_storage_gb', ''),
            'default_academy_storage_gb'    => Setting::getValue('default_academy_storage_gb', ''),
            'teacher_storage_price_per_gb'  => Setting::getValue('teacher_storage_price_per_gb', '0'),
            'academy_storage_price_per_gb'  => Setting::getValue('academy_storage_price_per_gb', '0'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('إعدادات الاشتراكات')
                    ->schema([
                        TextInput::make('trial_period_days')
                            ->label('فترة التجربة (بالأيام)')
                            ->numeric()
                            ->default('14'),

                        TextInput::make('teacher_price_per_student')
                            ->label('سعر الطالب للمدرس (شهرياً)')
                            ->numeric()
                            ->step(0.1)
                            ->default('60'),

                        TextInput::make('academy_price_per_student')
                            ->label('سعر الطالب للأكاديمية (شهرياً)')
                            ->numeric()
                            ->step(0.1)
                            ->default('40'),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_subscriptions')
                            ->label('حفظ الاشتراكات')
                            ->icon('heroicon-m-ticket')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),

                Section::make('إعدادات التخزين (R2)')
                    ->description('تحديد الحد الافتراضي وسعر التخزين على Cloudflare R2. يمكن تجاوز الحد لكل مدرس/أكاديمية بشكل منفرد من صفحة التعديل.')
                    ->icon('heroicon-o-server')
                    ->schema([
                        TextInput::make('default_teacher_storage_gb')
                            ->label('الحد الافتراضي للمدرس (GB)')
                            ->numeric()
                            ->minValue(1)
                            ->nullable()
                            ->placeholder('اتركه فارغاً = غير محدود')
                            ->helperText('الحد الافتراضي لمساحة تخزين الفيديوهات والمرفقات للمدرسين المستقلين.')
                            ->suffix('GB'),

                        TextInput::make('default_academy_storage_gb')
                            ->label('الحد الافتراضي للأكاديمية (GB)')
                            ->numeric()
                            ->minValue(1)
                            ->nullable()
                            ->placeholder('اتركه فارغاً = غير محدود')
                            ->helperText('الحد الافتراضي لمساحة تخزين الفيديوهات والمرفقات للأكاديميات.')
                            ->suffix('GB'),

                        TextInput::make('teacher_storage_price_per_gb')
                            ->label('سعر الجيجا للمدرس (شهرياً)')
                            ->numeric()
                            ->minValue(0)
                            ->step(0.1)
                            ->default('0')
                            ->prefix('ج.م')
                            ->helperText('يُضاف إلى فاتورة الاشتراك: storage_limit_gb × السعر × عدد الشهور.'),

                        TextInput::make('academy_storage_price_per_gb')
                            ->label('سعر الجيجا للأكاديمية (شهرياً)')
                            ->numeric()
                            ->minValue(0)
                            ->step(0.1)
                            ->default('0')
                            ->prefix('ج.م')
                            ->helperText('يُضاف إلى فاتورة الاشتراك: storage_limit_gb × السعر × عدد الشهور.'),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_storage')
                            ->label('حفظ إعدادات التخزين')
                            ->icon('heroicon-m-server')
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
                        'group' => 'subscription',
                    ]
                );
            }

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات الاشتراكات بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }
}
