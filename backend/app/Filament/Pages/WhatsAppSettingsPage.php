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

class WhatsAppSettingsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'إعدادات الواتساب';

    protected static string | \UnitEnum | null $navigationGroup = 'إعدادات النظام';

    protected static ?string $title = 'إعدادات الواتساب';

    protected static ?string $slug = 'system-settings/whatsapp';

    protected static ?int $navigationSort = 110;

    protected string $view = 'filament.pages.system-settings';

    protected const SETTING_KEYS = [
        'whatsappNumber',
        'pricing_whatsapp_message',
        'free_trial_whatsapp_message',
        'general_whatsapp_message',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'whatsappNumber'           => Setting::getValue('whatsappNumber', ''),
            'pricing_whatsapp_message' => Setting::getValue('pricing_whatsapp_message', "السلام عليكم، أرغب في الاشتراك في المنصة:\n- الباقة: {package_name}\n- نوع الاشتراك: {billing_cycle}\n- السعر: {price}\n{discount_info}"),
            'free_trial_whatsapp_message' => Setting::getValue('free_trial_whatsapp_message', "السلام عليكم، أرغب في بدء تجربة مجانية للمنصة لمدة 14 يوم."),
            'general_whatsapp_message' => Setting::getValue('general_whatsapp_message', 'السلام عليكم، أرغب في الاستفسار عن المنصة.'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('معلومات التواصل')
                    ->schema([
                        TextInput::make('whatsappNumber')
                            ->label('رقم الواتساب الرئيسي')
                            ->tel()
                            ->maxLength(30)
                            ->placeholder('مثال: 201001234567')
                            ->helperText('الرقم الذي سيتم توجيه المستخدمين إليه عند الضغط على أزرار التواصل أو الاشتراك.'),
                    ]),

                Section::make('قوالب الرسائل')
                    ->description('تحكم في نص الرسائل التلقائية التي تظهر للمستخدم عند فتح الواتساب.')
                    ->schema([
                        Textarea::make('pricing_whatsapp_message')
                            ->label('رسالة اشتراك الباقات')
                            ->rows(5)
                            ->helperText('تظهر عند طلب الاشتراك من صفحة الأسعار. الأكواد المتاحة: {package_name}, {price}, {billing_cycle}, {discount_info}'),

                        Textarea::make('free_trial_whatsapp_message')
                            ->label('رسالة طلب التجربة المجانية')
                            ->rows(3)
                            ->helperText('تظهر عند الضغط على "ابدأ تجربة مجانية" في الصفحة الرئيسية.'),

                        Textarea::make('general_whatsapp_message')
                            ->label('رسالة الاستفسار العامة')
                            ->rows(3)
                            ->helperText('تظهر عند الضغط على "تواصل معنا" أو طلب دعم فني عام.'),
                    ])
                    ->columns(1)
                    ->footerActions([
                        \Filament\Actions\Action::make('save_whatsapp')
                            ->label('حفظ إعدادات الواتساب')
                            ->icon('heroicon-m-check-circle')
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
                        'group' => 'whatsapp',
                    ]
                );
            }

            Cache::flush();

            Notification::make()
                ->success()
                ->title('تم حفظ إعدادات الواتساب بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage())
                ->send();
        }
    }
}
