<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Teacher;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
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
        'notifications_internal_enabled',
        'notifications_external_enabled',
        'notifications_disabled_categories',
        'notifications_disabled_recipients',
        'notifications_max_batch_size',
    ];

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'notifications_internal_enabled' => $this->toBoolean(Setting::getValue('notifications_internal_enabled', '1')),
            'notifications_external_enabled' => $this->toBoolean(Setting::getValue('notifications_external_enabled', '1')),
            'notifications_disabled_categories' => $this->decodeArray(Setting::getValue('notifications_disabled_categories', '[]')),
            'notifications_disabled_recipients' => $this->decodeArray(Setting::getValue('notifications_disabled_recipients', '[]')),
            'notifications_max_batch_size' => (int) Setting::getValue('notifications_max_batch_size', '500'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('إعدادات الإشعارات')
                    ->schema([
                        Toggle::make('notifications_internal_enabled')
                            ->label('تفعيل الإشعارات الداخلية')
                            ->default(true),

                        Toggle::make('notifications_external_enabled')
                            ->label('تفعيل الإشعارات الخارجية (FCM)')
                            ->default(true),

                        Select::make('notifications_disabled_categories')
                            ->label('إيقاف الإشعارات لفئات محددة')
                            ->multiple()
                            ->searchable()
                            ->options([
                                'teacher' => 'المعلمون',
                                'student' => 'الطلاب',
                                'guardian' => 'أولياء الأمور',
                                'secretary' => 'السكرتيرون',
                                'admin' => 'المديرون',
                                'academy' => 'الأكاديميات',
                            ])
                            ->helperText('أي فئة تحددها هنا لن تستقبل إشعارات نهائيًا.'),

                        Select::make('notifications_disabled_recipients')
                            ->label('إيقاف الإشعارات لأشخاص محددين')
                            ->multiple()
                            ->searchable()
                            ->getSearchResultsUsing(fn (string $search): array => $this->searchRecipients($search))
                            ->getOptionLabelsUsing(fn (array $values): array => $this->resolveRecipientLabels($values))
                            ->helperText('ابحث بالاسم أو رقم الهاتف واختر الأشخاص الممنوع إرسال الإشعارات لهم.'),

                        TextInput::make('notifications_max_batch_size')
                            ->label('الحد الأقصى للإرسال في الدفعة الواحدة')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(5000)
                            ->default(500)
                            ->required()
                            ->helperText('مثال: 500 يعني سيتم الإرسال على دفعات كل دفعة 500 مستلم.'),
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

                $value = match ($key) {
                    'notifications_internal_enabled',
                    'notifications_external_enabled' => $this->toBoolean($state[$key]) ? '1' : '0',
                    'notifications_disabled_categories',
                    'notifications_disabled_recipients' => json_encode(array_values((array) $state[$key]), JSON_UNESCAPED_UNICODE),
                    'notifications_max_batch_size' => (string) max(1, (int) $state[$key]),
                    default => (string) $state[$key],
                };

                Setting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => (string) $value,
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

    /**
     * @return array<string, string>
     */
    protected function searchRecipients(string $search): array
    {
        $search = trim($search);

        if ($search === '') {
            return [];
        }

        $results = [];

        $teachers = Teacher::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        foreach ($teachers as $teacher) {
            $key = "teacher:{$teacher->id}";
            $results[$key] = "معلم: {$teacher->name} ({$teacher->phone})";
        }

        $students = Student::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        foreach ($students as $student) {
            $key = "student:{$student->id}";
            $results[$key] = "طالب: {$student->name} ({$student->phone})";
        }

        $guardians = Guardian::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        foreach ($guardians as $guardian) {
            $guardianName = $guardian->name ?: 'ولي أمر';
            $key = "guardian:{$guardian->id}";
            $results[$key] = "ولي أمر: {$guardianName} ({$guardian->phone})";
        }

        $secretaries = Secretary::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        foreach ($secretaries as $secretary) {
            $key = "secretary:{$secretary->id}";
            $results[$key] = "سكرتير: {$secretary->name} ({$secretary->phone})";
        }

        $admins = Admin::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('username', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'username']);

        foreach ($admins as $admin) {
            $key = "admin:{$admin->id}";
            $results[$key] = "مدير: {$admin->name} ({$admin->username})";
        }

        $academies = Academy::query()
            ->where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        foreach ($academies as $academy) {
            $key = "academy:{$academy->id}";
            $results[$key] = "أكاديمية: {$academy->name} ({$academy->phone})";
        }

        return $results;
    }

    /**
     * @param array<int, string> $values
     * @return array<string, string>
     */
    protected function resolveRecipientLabels(array $values): array
    {
        $labels = [];

        foreach ($values as $value) {
            if (! is_string($value) || ! str_contains($value, ':')) {
                continue;
            }

            [$type, $id] = explode(':', $value, 2);
            $type = strtolower(trim($type));

            if ($id === '') {
                continue;
            }

            $labels[$value] = match ($type) {
                'teacher' => $this->buildLabelFromModel(Teacher::find($id), 'معلم'),
                'student' => $this->buildLabelFromModel(Student::find($id), 'طالب'),
                'guardian' => $this->buildLabelFromModel(Guardian::find($id), 'ولي أمر'),
                'secretary' => $this->buildLabelFromModel(Secretary::find($id), 'سكرتير'),
                'admin' => $this->buildLabelFromAdmin(Admin::find($id)),
                'academy' => $this->buildLabelFromModel(Academy::find($id), 'أكاديمية'),
                default => $value,
            };
        }

        return $labels;
    }

    protected function buildLabelFromModel(?object $model, string $prefix): string
    {
        if (! $model) {
            return "{$prefix}: غير موجود";
        }

        $name = (string) ($model->name ?? '-');
        $phone = (string) ($model->phone ?? '');

        return $phone !== '' ? "{$prefix}: {$name} ({$phone})" : "{$prefix}: {$name}";
    }

    protected function buildLabelFromAdmin(?Admin $admin): string
    {
        if (! $admin) {
            return 'مدير: غير موجود';
        }

        return "مدير: {$admin->name} ({$admin->username})";
    }

    /**
     * @return array<int, string>
     */
    protected function decodeArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    protected function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'on', 'yes'], true);
    }
}
