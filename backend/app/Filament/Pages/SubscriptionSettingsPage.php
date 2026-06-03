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
        'default_teacher_storage_minutes',
        'default_academy_storage_minutes',
        'teacher_storage_price_per_minute',
        'academy_storage_price_per_minute',
        'teacher_delivery_price_per_minute',
        'academy_delivery_price_per_minute',
        'instapay_receiver_number',
        'instapay_receiver_name',
        'vodafone_cash_receiver_number',
        'payment_instructions_ar',
        'payment_expiry_hours',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'trial_period_days'                 => Setting::getValue('trial_period_days', '14'),
            'teacher_price_per_student'         => Setting::getValue('teacher_price_per_student', '60'),
            'academy_price_per_student'         => Setting::getValue('academy_price_per_student', '40'),
            'default_teacher_storage_minutes'   => Setting::getValue('default_teacher_storage_minutes', '500'),
            'default_academy_storage_minutes'   => Setting::getValue('default_academy_storage_minutes', '1500'),
            'teacher_storage_price_per_minute'  => Setting::getValue('teacher_storage_price_per_minute', '0.5'),
            'academy_storage_price_per_minute'  => Setting::getValue('academy_storage_price_per_minute', '0.5'),
            'teacher_delivery_price_per_minute' => Setting::getValue('teacher_delivery_price_per_minute', '0.1'),
            'academy_delivery_price_per_minute' => Setting::getValue('academy_delivery_price_per_minute', '0.1'),
            'instapay_receiver_number'          => Setting::getValue('instapay_receiver_number', 'netaq@instapay'),
            'instapay_receiver_name'            => Setting::getValue('instapay_receiver_name', 'منصة نطاق التعليمية'),
            'vodafone_cash_receiver_number'     => Setting::getValue('vodafone_cash_receiver_number', '01012345678'),
            'payment_instructions_ar'           => Setting::getValue('payment_instructions_ar', "يرجى تحويل مبلغ الاشتراك الموضح أدناه إلى أحد الحسابات التالية:\n1. إنستاباي: netaq@instapay (الاسم: منصة نطاق التعليمية)\n2. فودافون كاش: 01012345678\n\nبعد إتمام التحويل، يرجى كتابة اسم المرسل ورقم الهاتف المحول منه ورفع صورة واضحة لإيصال التحويل لتأكيد الاشتراك خلال 48 ساعة."),
            'payment_expiry_hours'              => Setting::getValue('payment_expiry_hours', '48'),
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

                Section::make('إعدادات فيديو Cloudflare Stream')
                    ->description('تحديد الحد الافتراضي وأسعار التخزين والمشاهدة لدقائق الفيديو. (3x Markup مطبق تلقائياً)')
                    ->icon('heroicon-o-video-camera')
                    ->schema([
                        TextInput::make('default_teacher_storage_minutes')
                            ->label('الحد الافتراضي للتخزين للمدرس (دقيقة)')
                            ->numeric()
                            ->minValue(1)
                            ->default(500),

                        TextInput::make('default_academy_storage_minutes')
                            ->label('الحد الافتراضي للتخزين للأكاديمية (دقيقة)')
                            ->numeric()
                            ->minValue(1)
                            ->default(1500),

                        TextInput::make('teacher_storage_price_per_minute')
                            ->label('سعر دقيقة التخزين للمدرس (شهرياً)')
                            ->numeric()
                            ->step(0.01)
                            ->prefix('ج.م'),

                        TextInput::make('academy_storage_price_per_minute')
                            ->label('سعر دقيقة التخزين للأكاديمية (شهرياً)')
                            ->numeric()
                            ->step(0.01)
                            ->prefix('ج.م'),

                        TextInput::make('teacher_delivery_price_per_minute')
                            ->label('سعر دقيقة المشاهدة للمدرس (شهرياً)')
                            ->numeric()
                            ->step(0.01)
                            ->prefix('ج.م'),

                        TextInput::make('academy_delivery_price_per_minute')
                            ->label('سعر دقيقة المشاهدة للأكاديمية (شهرياً)')
                            ->numeric()
                            ->step(0.01)
                            ->prefix('ج.م'),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_stream')
                            ->label('حفظ إعدادات الفيديو')
                            ->icon('heroicon-m-video-camera')
                            ->color('primary')
                            ->action(fn () => $this->save()),
                    ]),

                Section::make('إعدادات الدفع الذاتي (InstaPay / فودافون كاش)')
                    ->icon('heroicon-o-credit-card')
                    ->schema([
                        TextInput::make('instapay_receiver_number')
                            ->label('عنوان إنستاباي (InstaPay Address)')
                            ->placeholder('netaq@instapay'),
                        
                        TextInput::make('instapay_receiver_name')
                            ->label('اسم المستقبل في إنستاباي')
                            ->placeholder('منصة نطاق التعليمية'),

                        TextInput::make('vodafone_cash_receiver_number')
                            ->label('رقم محفظة فودافون كاش')
                            ->placeholder('01012345678'),

                        TextInput::make('payment_expiry_hours')
                            ->label('صلاحية طلب الدفع (بالساعات)')
                            ->numeric()
                            ->default(48),

                        Textarea::make('payment_instructions_ar')
                            ->label('تعليمات الدفع (بالعربية)')
                            ->rows(4)
                            ->columnSpanFull(),
                    ])
                    ->columns(2)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_payments')
                            ->label('حفظ إعدادات الدفع')
                            ->icon('heroicon-m-banknotes')
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
                        'group' => in_array($key, ['instapay_receiver_number', 'instapay_receiver_name', 'vodafone_cash_receiver_number', 'payment_instructions_ar', 'payment_expiry_hours']) ? 'payment' : 'subscription',
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
