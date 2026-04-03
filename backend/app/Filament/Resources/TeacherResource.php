<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Auth\Enums\TeacherStatus;
use App\Domains\Auth\Models\Teacher;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Placeholder;
use Filament\Schemas\Schema;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;
use Filament\Forms\Get;
use Filament\Forms\Set;
use App\Domains\Application\Models\Setting;

class TeacherResource extends BaseResource
{
    protected static ?string $model = Teacher::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?int $navigationSort = 3;

    protected static ?string $modelLabel = 'معلم';

    protected static ?string $pluralModelLabel = 'المعلمون';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المستخدمين';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('name')
                            ->label('الاسم')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم المعلم'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->required()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),
                    ])
                    ->columns(2),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        TextInput::make('subject')
                            ->label('التخصص / المادة')
                            ->maxLength(255)
                            ->placeholder('مثال: الرياضيات، الفيزياء'),
                    ])
                    ->columns(2),

                Section::make('الصورة الشخصية')
                    ->schema([
                        FileUpload::make('avatar_key')
                            ->label('الصورة الشخصية')
                            ->image()
                            ->directory('teachers/avatars')
                            ->maxSize(2048)
                            ->imageEditor()
                            ->columnSpanFull(),
                    ]),

                Section::make('كلمة المرور')
                    ->schema([
                        TextInput::make('password')
                            ->label('كلمة المرور')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->dehydrateStateUsing(fn ($state) => filled($state) ? $state : null)
                            ->dehydrated(fn ($state) => filled($state))
                            ->placeholder('أدخل كلمة المرور')
                            ->helperText(fn (string $operation): string => $operation === 'edit' ? 'اترك الحقل فارغاً إذا لم ترغب في تغيير كلمة المرور' : ''),

                        TextInput::make('password_confirmation')
                            ->label('تأكيد كلمة المرور')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->same('password')
                            ->dehydrated(false)
                            ->placeholder('أعد إدخال كلمة المرور'),
                    ])
                    ->columns(2)
                    ->visible(fn (string $operation): bool => $operation === 'create' || (auth()->user()?->hasRole('super-admin') || auth()->user()?->hasRole('admin') || auth()->user()?->hasRole('filament-admin'))),

                Section::make('حالة المعلم')
                    ->schema([
                        Select::make('status')
                            ->label('الحالة')
                            ->options([
                                'active' => 'نشط',
                                'suspended' => 'موقوف',
                                'pending' => 'قيد الانتظار',
                            ])
                            ->default('pending')
                            ->required(),

                        Toggle::make('is_independent_active')
                            ->label('نشط كمعلم مستقل')
                            ->default(false)
                            ->helperText('يمكن للمعلم العمل كمعلم مستقل خارج الأكاديميات'),

                        TextInput::make('trial_period_days')
                            ->label('مدة الفترة التجريبية (أيام)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(365)
                            ->nullable()
                            ->helperText(fn (): string => 'اتركه فارغًا لاستخدام الإعداد العام (' . \App\Domains\Application\Services\HelperService::getTrialPeriodDays() . ' يوم)'),
                    ])
                    ->columns(2),

                Section::make('الأكاديميات')
                    ->schema([
                        Select::make('academies')
                            ->label('الأكاديميات')
                            ->relationship('academies', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->placeholder('اختر الأكاديميات'),
                    ]),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        Toggle::make('update_subscription_duration')
                            ->label('تعديل مدة الاشتراك؟')
                            ->default(false)
                            ->dehydrated(false)
                            ->visible(fn ($record): bool => $record !== null)
                            ->helperText('إذا كان الاختيار "لا" سيتم تعديل الباقة/الحدود فقط على المدة المتبقية دون بدء دورة جديدة.')
                            ->reactive(),

                        Placeholder::make('subscription_pricing_mode_notice')
                            ->label('تنبيه طريقة الحساب')
                            ->content(fn ($get): string => ($get('update_subscription_duration') === false && ! empty($get('plan_expires_at')))
                                ? 'يتم الآن احتساب الرسوم على المدة المتبقية فقط.'
                                : 'يتم الآن احتساب الرسوم على مدة الاشتراك المختارة.')
                            ->visible(fn ($record): bool => $record !== null),

                        Select::make('plan_selection')
                            ->label('مدة الاشتراك')
                            ->options(fn () => [
                                'trial' => 'تجريبي (' . \App\Domains\Application\Services\HelperService::getTrialPeriodDays() . ' يوم)',
                                'monthly' => 'شهري (1 شهر)',
                                'quarterly' => 'ربع سنوي (3 شهور)',
                                'semi_annual' => 'نصف سنوي (6 شهور)',
                                'annual' => 'سنوي (1 سنة)',
                                'custom' => 'مخصص (Custom)',
                            ])
                            ->default('trial')
                            ->reactive()
                            ->disabled(fn ($get, string $operation): bool => $operation === 'edit' && ! (bool) ($get('update_subscription_duration') ?? false))
                            ->dehydrated(false)
                            ->afterStateHydrated(function ($component, $state, $record) {
                                if (!$record) return;

                                if (in_array((string) ($record->subscription_period ?? ''), ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
                                    $component->state((string) $record->subscription_period);
                                    return;
                                }

                                $inferredPlanSelection = self::inferPlanSelectionFromTeacher($record);
                                if ($inferredPlanSelection !== null) {
                                    $component->state($inferredPlanSelection);
                                    return;
                                }
                                
                                if ($record->plan_type === 'trial') {
                                    $component->state('trial');
                                } elseif ($record->plan_type === 'custom') {
                                    $component->state('custom');
                                } elseif ($record->plan_type === 'term') {
                                    $component->state($record->subscription_period);
                                }
                            })
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state === 'trial') {
                                    $trialDays = \App\Domains\Application\Services\HelperService::getTrialPeriodDays();
                                    $set('plan_type', 'trial');
                                    $set('subscription_period', null);
                                    $set('custom_period_months', null);
                                    $set('plan_expires_at', now()->addDays($trialDays)->format('Y-m-d'));
                                    $set('subscription_fee', 0);
                                    $set('paid_amount', 0);
                                    self::syncBillingNotes(
                                        fn (string $key) => $get($key),
                                        fn (string $key, mixed $value): mixed => $set($key, $value),
                                        [
                                            'subscription_fee' => 0,
                                            'paid_amount' => 0,
                                        ]
                                    );
                                } elseif (in_array($state, ['monthly', 'quarterly', 'semi_annual', 'annual'])) {
                                    $set('plan_type', 'term');
                                    $set('subscription_period', $state);
                                    $set('custom_period_months', null);
                                    
                                    $months = match ($state) {
                                        'monthly' => 1,
                                        'quarterly' => 3,
                                        'semi_annual' => 6,
                                        'annual' => 12,
                                        default => 0,
                                    };
                                    
                                    $set('plan_expires_at', now()->addMonths($months)->format('Y-m-d'));
                                    
                                    // Calculate fee
                                    $students = (int) $get('plan_max_students');
                                    try {
                                        $pricePerStudent  = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                        $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                    } catch (\Exception $e) {
                                        $pricePerStudent  = 60;
                                        $storagePricePerGb = 0;
                                    }
                                    $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                    $seatsAmount    = $students * $months * $pricePerStudent;
                                    $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                    $gross          = $seatsAmount + $storageAmount;

                                    $discountValue = (float) ($get('discount_percent') ?? 0);
                                    $discountType = (string) ($get('discount_type') ?? 'percent');
                                    $discountScope = (string) ($get('discount_scope') ?? 'general');
                                    $discountableAmount = match ($discountScope) {
                                        'students' => $seatsAmount,
                                        'storage' => $storageAmount,
                                        default => $gross,
                                    };
                                    $discountAmount = $discountType === 'fixed'
                                        ? min($discountableAmount, max(0, $discountValue))
                                        : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                    $calculatedFee = max(0, round($gross - $discountAmount, 2));
                                    $set('subscription_fee', $calculatedFee);
                                    self::syncBillingNotes(
                                        fn (string $key) => $get($key),
                                        fn (string $key, mixed $value): mixed => $set($key, $value),
                                        ['subscription_fee' => $calculatedFee]
                                    );
                                } elseif ($state === 'custom') {
                                    $set('plan_type', 'custom');
                                    $set('subscription_period', null);
                                }
                            }),

                        // Hidden fields to store actual model data
                        TextInput::make('plan_type')->default('trial')->hidden()->dehydrated(),
                        TextInput::make('subscription_period')->hidden()->dehydrated(),

                        TextInput::make('custom_period_months')
                            ->label('عدد الشهور (مخصص)')
                            ->numeric()
                            ->dehydrated(false)
                            ->disabled(fn ($get, string $operation): bool => $operation === 'edit' && ! (bool) ($get('update_subscription_duration') ?? false))
                            ->visible(fn ($get) => $get('plan_type') === 'custom')
                            ->reactive()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state) {
                                    $months = (int) $state;
                                    $set('plan_expires_at', now()->addMonths($months)->format('Y-m-d'));

                                    // Calculate fee
                                    $students = (int) $get('plan_max_students');
                                    try {
                                        $pricePerStudent   = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                        $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                    } catch (\Exception $e) {
                                        $pricePerStudent  = 60;
                                        $storagePricePerGb = 0;
                                    }
                                    $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                    $seatsAmount    = $students * $months * $pricePerStudent;
                                    $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                    $gross          = $seatsAmount + $storageAmount;

                                    $discountValue = (float) ($get('discount_percent') ?? 0);
                                    $discountType = (string) ($get('discount_type') ?? 'percent');
                                    $discountScope = (string) ($get('discount_scope') ?? 'general');
                                    $discountableAmount = match ($discountScope) {
                                        'students' => $seatsAmount,
                                        'storage' => $storageAmount,
                                        default => $gross,
                                    };
                                    $discountAmount = $discountType === 'fixed'
                                        ? min($discountableAmount, max(0, $discountValue))
                                        : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                    $calculatedFee = max(0, round($gross - $discountAmount, 2));
                                    $set('subscription_fee', $calculatedFee);
                                    self::syncBillingNotes(
                                        fn (string $key) => $get($key),
                                        fn (string $key, mixed $value): mixed => $set($key, $value),
                                        ['subscription_fee' => $calculatedFee]
                                    );
                                }
                            }),

                        DatePicker::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
                            ->default(now()->addDays(\App\Domains\Application\Services\HelperService::getTrialPeriodDays())->format('Y-m-d'))
                            ->required()
                            ->disabled(fn ($get, string $operation): bool => $operation === 'edit' && ! (bool) ($get('update_subscription_duration') ?? false))
                            ->native(false)
                            ->displayFormat('d/m/Y')
                            ->readOnly(fn ($get) => $get('plan_selection') !== 'custom' && $get('plan_selection') !== null)
                            ->closeOnDateSelection(),

                        Toggle::make('is_unlimited_students')
                            ->label('طلاب غير محدودين')
                            ->default(false)
                            ->reactive(),

                        TextInput::make('plan_max_students')
                            ->label('الحد الأقصى للطلاب')
                            ->numeric()
                            ->default(50)
                            ->visible(fn ($get) => ! $get('is_unlimited_students'))
                            ->reactive()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state) {
                                    $months = self::resolveBillingMonths(fn (string $key) => $get($key));
                                    
                                    if ($months > 0) {
                                        try {
                                            $pricePerStudent   = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                            $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                        } catch (\Exception $e) {
                                            $pricePerStudent   = 60;
                                            $storagePricePerGb = 0;
                                        }
                                        $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                        $seatsAmount    = (int) $state * $months * $pricePerStudent;
                                        $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                        $gross          = $seatsAmount + $storageAmount;

                                        $discountValue = (float) ($get('discount_percent') ?? 0);
                                        $discountType = (string) ($get('discount_type') ?? 'percent');
                                        $discountScope = (string) ($get('discount_scope') ?? 'general');
                                        $discountableAmount = match ($discountScope) {
                                            'students' => $seatsAmount,
                                            'storage' => $storageAmount,
                                            default => $gross,
                                        };
                                        $discountAmount = $discountType === 'fixed'
                                            ? min($discountableAmount, max(0, $discountValue))
                                            : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                        $calculatedFee = max(0, round($gross - $discountAmount, 2));
                                        $set('subscription_fee', $calculatedFee);
                                        self::syncBillingNotes(
                                            fn (string $key) => $get($key),
                                            fn (string $key, mixed $value): mixed => $set($key, $value),
                                            ['subscription_fee' => $calculatedFee]
                                        );
                                    }
                                }
                            }),

                        TextInput::make('subscription_fee')
                            ->label('رسوم الاشتراك')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->reactive()
                            ->helperText(fn ($get): string => ($get('update_subscription_duration') === false && ! empty($get('plan_expires_at')))
                                ? 'الحساب مبني على المدة المتبقية: ' . self::resolveRemainingMonthsFromExpiry($get('plan_expires_at')) . ' شهر.'
                                : 'الحساب مبني على مدة الاشتراك المحددة حالياً.')
                            ->afterStateUpdated(function ($state, $get, $set) {
                                self::syncBillingNotes(
                                    fn (string $key) => $get($key),
                                    fn (string $key, mixed $value): mixed => $set($key, $value),
                                    ['subscription_fee' => $state]
                                );
                            }),

                        TextInput::make('paid_amount')
                            ->label('المبلغ المدفوع')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                self::syncBillingNotes(
                                    fn (string $key) => $get($key),
                                    fn (string $key, mixed $value): mixed => $set($key, $value),
                                    ['paid_amount' => $state]
                                );
                            }),

                        TextInput::make('unpaid_amount')
                            ->label('لم يدفع')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->disabled()
                            ->dehydrated(false)
                            ->afterStateHydrated(function ($component, $state, $record) {
                                if (! $record) {
                                    return;
                                }

                                $feeAfter = max(0, (float) ($record->subscription_fee ?? 0));
                                $paid = max(0, (float) ($record->paid_amount ?? 0));
                                $component->state(round($feeAfter - $paid, 2));
                            }),

                        Textarea::make('billing_notes')
                            ->label('ملاحظات الفواتير')
                            ->columnSpanFull()
                            ->rows(4)
                            ->placeholder('سيتم إنشاء الملاحظات تلقائياً عند تحديث الاشتراك')
                            ->afterStateHydrated(function ($component, $state, $record) {
                                if (! $record) return;
                                $trialDays   = \App\Domains\Application\Services\HelperService::getTrialPeriodDays();
                                $limit       = $record->is_unlimited_students ? 'غير محدود' : ($record->plan_max_students ?? '50');
                                $period      = match ($record->subscription_period ?? $record->plan_type) {
                                    'monthly'     => 'شهري',
                                    'quarterly'   => 'ربع سنوي',
                                    'semi_annual' => 'نصف سنوي',
                                    'annual'      => 'سنوي',
                                    'trial'       => 'تجريبي (' . $trialDays . ' يوم)',
                                    'custom'      => 'مخصص',
                                    default       => 'تجريبي (' . $trialDays . ' يوم)',
                                };
                                $feeAfter    = max(0, (float) ($record->subscription_fee ?? 0));
                                $discountVal = (float) ($record->discount_percent ?? 0);
                                $discountType = (string) ($record->discount_type ?? 'percent');
                                $discountScope = (string) ($record->discount_scope ?? 'general');
                                $storageGb   = $record->storage_limit_gb;
                                $storage     = self::formatStorageLabel($storageGb);
                                $paid        = (float) ($record->paid_amount ?? 0);
                                $remaining   = round($feeAfter - $paid, 2);

                                $scopeLabel = match ($discountScope) {
                                    'students' => 'الطلاب',
                                    'storage' => 'التخزين',
                                    default => 'الإجمالي',
                                };
                                $discountLabel = $discountType === 'fixed'
                                    ? "{$discountVal} ج.م"
                                    : "{$discountVal}%";

                                $note = "نوع الاشتراك: {$period}\n" .
                                        "الحد الأقصى للطلاب: {$limit}\n" .
                                        "حد التخزين: {$storage}\n" .
                                        ($discountVal > 0 ? "الخصم ({$scopeLabel}): {$discountLabel}\n" : '') .
                                        "الرسوم بعد الخصم: {$feeAfter} ج.م\n" .
                                        "المدفوع: {$paid} ج.م\n" .
                    "لم يدفع: {$remaining} ج.م\n" .
                                        "المتبقي: {$remaining} ج.م";

                                $component->state($note);
                            }),

                        TextInput::make('storage_limit_gb')
                            ->label('حد التخزين (جيجابايت)')
                            ->numeric()
                            ->minValue(1)
                            ->nullable()
                            ->placeholder('اتركه فارغاً = غير محدود')
                            ->helperText('الحد الأقصى لمساحة التخزين على R2. اتركه فارغاً لتخزين غير محدود.')
                            ->suffix('GB')
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                $months = self::resolveBillingMonths(fn (string $key) => $get($key));
                                if ($months > 0) {
                                    try {
                                        $pricePerStudent  = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                        $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                    } catch (\Exception $e) {
                                        $pricePerStudent  = 60;
                                        $storagePricePerGb = 0;
                                    }
                                    $students       = (int) $get('plan_max_students');
                                    $storageLimitGb = (int) ($state ?? 0);
                                    $seatsAmount    = $students * $months * $pricePerStudent;
                                    $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                    $gross          = $seatsAmount + $storageAmount;

                                    $discountValue = (float) ($get('discount_percent') ?? 0);
                                    $discountType = (string) ($get('discount_type') ?? 'percent');
                                    $discountScope = (string) ($get('discount_scope') ?? 'general');
                                    $discountableAmount = match ($discountScope) {
                                        'students' => $seatsAmount,
                                        'storage' => $storageAmount,
                                        default => $gross,
                                    };
                                    $discountAmount = $discountType === 'fixed'
                                        ? min($discountableAmount, max(0, $discountValue))
                                        : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                    $total          = max(0, round($gross - $discountAmount, 2));
                                    $set('subscription_fee', $total);
                                    self::syncBillingNotes(
                                        fn (string $key) => $get($key),
                                        fn (string $key, mixed $value): mixed => $set($key, $value),
                                        [
                                            'storage_limit_gb' => $state,
                                            'subscription_fee' => $total,
                                        ]
                                    );
                                }
                            }),

                        Select::make('discount_type')
                            ->label('نوع الخصم')
                            ->options([
                                'percent' => 'نسبة مئوية (%)',
                                'fixed' => 'مبلغ ثابت (ج.م)',
                            ])
                            ->default('percent')
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                $months = self::resolveBillingMonths(fn (string $key) => $get($key));

                                if ($months <= 0) {
                                    return;
                                }

                                try {
                                    $pricePerStudent   = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                    $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                } catch (\Exception $e) {
                                    $pricePerStudent   = 60;
                                    $storagePricePerGb = 0;
                                }

                                $students       = (int) $get('plan_max_students');
                                $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                $seatsAmount    = $students * $months * $pricePerStudent;
                                $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                $gross          = $seatsAmount + $storageAmount;

                                $discountValue = (float) ($get('discount_percent') ?? 0);
                                $discountScope = (string) ($get('discount_scope') ?? 'general');
                                $discountableAmount = match ($discountScope) {
                                    'students' => $seatsAmount,
                                    'storage' => $storageAmount,
                                    default => $gross,
                                };
                                $discountAmount = $state === 'fixed'
                                    ? min($discountableAmount, max(0, $discountValue))
                                    : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                $total = max(0, round($gross - $discountAmount, 2));
                                $set('subscription_fee', $total);
                                self::syncBillingNotes(
                                    fn (string $key) => $get($key),
                                    fn (string $key, mixed $value): mixed => $set($key, $value),
                                    [
                                        'discount_type' => $state,
                                        'subscription_fee' => $total,
                                    ]
                                );
                            }),

                        Select::make('discount_scope')
                            ->label('الخصم يُطبَّق على')
                            ->options([
                                'general' => 'خصم عام (الإجمالي)',
                                'students' => 'عدد الطلاب فقط',
                                'storage' => 'حد التخزين فقط',
                            ])
                            ->default('general')
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                $months = self::resolveBillingMonths(fn (string $key) => $get($key));

                                if ($months <= 0) {
                                    return;
                                }

                                try {
                                    $pricePerStudent   = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                    $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                } catch (\Exception $e) {
                                    $pricePerStudent   = 60;
                                    $storagePricePerGb = 0;
                                }

                                $students       = (int) $get('plan_max_students');
                                $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                $seatsAmount    = $students * $months * $pricePerStudent;
                                $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                $gross          = $seatsAmount + $storageAmount;

                                $discountValue = (float) ($get('discount_percent') ?? 0);
                                $discountType = (string) ($get('discount_type') ?? 'percent');
                                $discountableAmount = match ($state) {
                                    'students' => $seatsAmount,
                                    'storage' => $storageAmount,
                                    default => $gross,
                                };
                                $discountAmount = $discountType === 'fixed'
                                    ? min($discountableAmount, max(0, $discountValue))
                                    : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                $total = max(0, round($gross - $discountAmount, 2));
                                $set('subscription_fee', $total);
                                self::syncBillingNotes(
                                    fn (string $key) => $get($key),
                                    fn (string $key, mixed $value): mixed => $set($key, $value),
                                    [
                                        'discount_scope' => $state,
                                        'subscription_fee' => $total,
                                    ]
                                );
                            }),

                        TextInput::make('discount_percent')
                            ->label('قيمة الخصم')
                            ->numeric()
                            ->minValue(0)
                            ->suffix(fn ($get): string => $get('discount_type') === 'fixed' ? 'ج.م' : '%')
                            ->default(0)
                            ->reactive()
                            ->helperText(fn ($get): string => $get('discount_type') === 'fixed'
                                ? 'أدخل مبلغ خصم ثابت.'
                                : 'أدخل نسبة خصم من 0 إلى 100.')
                            ->afterStateUpdated(function ($state, $get, $set) {
                                $months = self::resolveBillingMonths(fn (string $key) => $get($key));
                                if ($months > 0) {
                                    try {
                                        $pricePerStudent   = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                        $storagePricePerGb = (float) Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
                                    } catch (\Exception $e) {
                                        $pricePerStudent   = 60;
                                        $storagePricePerGb = 0;
                                    }
                                    $students       = (int) $get('plan_max_students');
                                    $storageLimitGb = (int) ($get('storage_limit_gb') ?? 0);
                                    $seatsAmount    = $students * $months * $pricePerStudent;
                                    $storageAmount  = $storageLimitGb * $storagePricePerGb * $months;
                                    $gross          = $seatsAmount + $storageAmount;

                                    $discountValue = (float) ($state ?? 0);
                                    $discountType = (string) ($get('discount_type') ?? 'percent');
                                    $discountScope = (string) ($get('discount_scope') ?? 'general');
                                    $discountableAmount = match ($discountScope) {
                                        'students' => $seatsAmount,
                                        'storage' => $storageAmount,
                                        default => $gross,
                                    };
                                    $discountAmount = $discountType === 'fixed'
                                        ? min($discountableAmount, max(0, $discountValue))
                                        : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

                                    $total          = max(0, round($gross - $discountAmount, 2));
                                    $set('subscription_fee', $total);
                                    self::syncBillingNotes(
                                        fn (string $key) => $get($key),
                                        fn (string $key, mixed $value): mixed => $set($key, $value),
                                        [
                                            'discount_percent' => $state,
                                            'subscription_fee' => $total,
                                        ]
                                    );
                                }
                            }),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar_key')
                    ->label('الصورة')
                    ->circular()
                    ->defaultImageUrl(url('/images/default-avatar.png'))
                    ->toggleable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('phone')
                    ->label('الهاتف')
                    ->searchable()
                    ->copyable()
                    ->icon('heroicon-m-phone')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('subject')
                    ->label('التخصص')
                    ->searchable()
                    ->sortable()
                    ->placeholder('غير محدد')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('academies.name')
                    ->label('الأكاديميات')
                    ->badge()
                    ->separator(',')
                    ->limitList(2)
                    ->expandableLimitedList()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('activeEnrollments_count')
                    ->label('عدد الطلاب')
                    ->counts('activeEnrollments')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'active' => 'success',
                        'suspended' => 'danger',
                        'pending' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'active' => 'نشط',
                        'suspended' => 'موقوف',
                        'pending' => 'قيد الانتظار',
                        default => is_string($state) ? $state : $state->value,
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('plan_type')
                    ->label('الخطة')
                    ->state(fn (Teacher $record): string => static::resolvePlanLabelForDisplay($record))
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'تجريبي' => 'gray',
                        'شهري (1 شهر)' => 'primary',
                        'ربع سنوي (3 شهور)' => 'info',
                        'نصف سنوي (6 شهور)' => 'warning',
                        'سنوي (1 سنة)' => 'success',
                        'مخصص (Custom)' => 'warning',
                        'مجاني' => 'gray',
                        default => 'gray',
                    })
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('plan_expires_at')
                    ->label('انتهاء الاشتراك')
                    ->date('Y-m-d')
                    ->sortable()
                    ->toggleable()
                    ->placeholder('غير محدد'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('plan_type')
                    ->label('نوع الخطة')
                    ->options([
                        'trial' => 'تجريبي',
                        'term' => 'مدة محددة',
                        'custom' => 'مخصص',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options([
                        'active' => 'نشط',
                        'suspended' => 'موقوف',
                        'pending' => 'قيد الانتظار',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\SelectFilter::make('academies')
                    ->label('الأكاديمية')
                    ->relationship('academies', 'name')
                    ->preload()
                    ->searchable(),

                Tables\Filters\TernaryFilter::make('is_independent_active')
                    ->label('معلم مستقل')
                    ->placeholder('الكل')
                    ->trueLabel('نشط كمستقل')
                    ->falseLabel('غير نشط كمستقل'),
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                Action::make('toggleActive')
                    ->label(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'إلغاء التنشيط' : 'تنشيط')
                    ->icon(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'heroicon-m-x-circle' : 'heroicon-m-check-circle')
                    ->color(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(function (Teacher $record): void {
                        $record->update([
                            'status' => $record->status === TeacherStatus::ACTIVE ? 'suspended' : 'active',
                        ]);
                    }),

                DeleteAction::make()
                    ->label('حذف')
                    ->icon('heroicon-m-trash')
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->label('حذف المحدد')
                        ->requiresConfirmation(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->emptyStateHeading('لا يوجد معلمون')
            ->emptyStateDescription('قم بإنشاء معلم جديد للبدء')
            ->emptyStateIcon('heroicon-o-academic-cap');
    }

    public static function getRelations(): array
    {
        return [
            // Relations can be added here if needed
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\TeacherResource\Pages\ListTeachers::route('/'),
            'create' => \App\Filament\Resources\TeacherResource\Pages\CreateTeacher::route('/create'),
            'edit' => \App\Filament\Resources\TeacherResource\Pages\EditTeacher::route('/{record}/edit'),
            'view' => \App\Filament\Resources\TeacherResource\Pages\ViewTeacher::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }

    public static function resolvePlanTypeForDisplay(Teacher $teacher): string
    {
        $subscriptionPeriod = trim((string) ($teacher->subscription_period ?? ''));
        if (in_array($subscriptionPeriod, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return 'term';
        }

        $inferredPlanSelection = self::inferPlanSelectionFromTeacher($teacher);
        if (in_array($inferredPlanSelection, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return 'term';
        }

        $planType = trim((string) ($teacher->plan_type ?? ''));
        if (in_array($planType, ['trial', 'term', 'custom', 'free'], true)) {
            return $planType;
        }

        $hasExpiryDate = ! is_null($teacher->plan_expires_at);
        $amountDue = (float) ($teacher->subscription_fee ?? 0);
        $amountPaid = (float) ($teacher->paid_amount ?? 0);

        if ($hasExpiryDate && $amountDue <= 0.0 && $amountPaid <= 0.0) {
            return 'trial';
        }

        return '';
    }

    public static function resolvePlanLabelForDisplay(Teacher $teacher): string
    {
        $subscriptionPeriod = trim((string) ($teacher->subscription_period ?? ''));
        if (in_array($subscriptionPeriod, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return match ($subscriptionPeriod) {
                'monthly' => 'شهري (1 شهر)',
                'quarterly' => 'ربع سنوي (3 شهور)',
                'semi_annual' => 'نصف سنوي (6 شهور)',
                'annual' => 'سنوي (1 سنة)',
            };
        }

        $inferredPlanSelection = self::inferPlanSelectionFromTeacher($teacher);
        if (in_array($inferredPlanSelection, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return match ($inferredPlanSelection) {
                'monthly' => 'شهري (1 شهر)',
                'quarterly' => 'ربع سنوي (3 شهور)',
                'semi_annual' => 'نصف سنوي (6 شهور)',
                'annual' => 'سنوي (1 سنة)',
            };
        }

        return match (self::resolvePlanTypeForDisplay($teacher)) {
            'trial' => 'تجريبي',
            'custom' => 'مخصص (Custom)',
            'free' => 'مجاني',
            default => 'غير محدد',
        };
    }

    private static function inferPlanSelectionFromTeacher(Teacher $teacher): ?string
    {
        $expiryRaw = $teacher->plan_expires_at;
        if (empty($expiryRaw)) {
            return null;
        }

        $daysRemaining = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($expiryRaw)->startOfDay(), false);
        if ($daysRemaining <= 0) {
            return null;
        }

        $trialDays = \App\Domains\Application\Services\HelperService::getTrialPeriodDays();
        $amountDue = (float) ($teacher->subscription_fee ?? 0);
        $amountPaid = (float) ($teacher->paid_amount ?? 0);

        if ($amountDue <= 0.0 && $amountPaid <= 0.0 && $daysRemaining <= ($trialDays + 1)) {
            return 'trial';
        }

        return match (true) {
            $daysRemaining <= 45 => 'monthly',
            $daysRemaining <= 135 => 'quarterly',
            $daysRemaining <= 225 => 'semi_annual',
            $daysRemaining <= 450 => 'annual',
            default => null,
        };
    }

    private static function syncBillingNotes(callable $get, callable $set, array $overrides = []): void
    {
        $current = static fn (string $key) => array_key_exists($key, $overrides) ? $overrides[$key] : $get($key);

        $limit = $current('is_unlimited_students')
            ? 'غير محدود'
            : ($current('plan_max_students') ?? '50');

        $trialDays = \App\Domains\Application\Services\HelperService::getTrialPeriodDays();
        if ($current('update_subscription_duration') === false && ! empty($current('plan_expires_at'))) {
            $period = 'المتبقي ' . self::resolveRemainingMonthsFromExpiry($current('plan_expires_at')) . ' شهر';
        } else {
            $period = match ($current('plan_selection')) {
                'trial'       => 'تجريبي (' . $trialDays . ' يوم)',
                'monthly'     => 'شهري',
                'quarterly'   => 'ربع سنوي',
                'semi_annual' => 'نصف سنوي',
                'annual'      => 'سنوي',
                'custom'      => 'مخصص',
                default       => 'تجريبي',
            };
        }

        $feeAfter = max(0, (float) ($current('subscription_fee') ?? 0));
        $discountValue = (float) ($current('discount_percent') ?? 0);
        $discountType = (string) ($current('discount_type') ?? 'percent');
        $discountScope = (string) ($current('discount_scope') ?? 'general');
        $storage = self::formatStorageLabel($current('storage_limit_gb'));
        $paid = max(0, (float) ($current('paid_amount') ?? 0));
        $remaining = round($feeAfter - $paid, 2);

        $set('unpaid_amount', $remaining);

        $scopeLabel = match ($discountScope) {
            'students' => 'الطلاب',
            'storage' => 'التخزين',
            default => 'الإجمالي',
        };
        $discountValueLabel = $discountType === 'fixed'
            ? "{$discountValue} ج.م"
            : "{$discountValue}%";

        $note = "نوع الاشتراك: {$period}\n" .
            "الحد الأقصى للطلاب: {$limit}\n" .
            "حد التخزين: {$storage}\n" .
            ($discountValue > 0 ? "الخصم ({$scopeLabel}): {$discountValueLabel}\n" : '') .
            "الرسوم بعد الخصم: {$feeAfter} ج.م\n" .
            "المدفوع: {$paid} ج.م\n" .
            "لم يدفع: {$remaining} ج.م\n" .
            "المتبقي: {$remaining} ج.م";

        $set('billing_notes', $note);
    }

    private static function resolveBillingMonths(callable $get): int
    {
        if ($get('update_subscription_duration') === false) {
            return self::resolveRemainingMonthsFromExpiry($get('plan_expires_at'));
        }

        $planSelection = (string) ($get('plan_selection') ?? '');
        $subscriptionPeriod = (string) ($get('subscription_period') ?? '');
        $periodKey = $planSelection !== '' ? $planSelection : $subscriptionPeriod;

        return match ($periodKey) {
            'monthly' => 1,
            'quarterly' => 3,
            'semi_annual' => 6,
            'annual' => 12,
            default => max(0, (int) ($get('custom_period_months') ?? 0)),
        };
    }

    private static function resolveRemainingMonthsFromExpiry(mixed $planExpiresAt): int
    {
        if (empty($planExpiresAt)) {
            return 1;
        }

        $daysRemaining = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($planExpiresAt)->startOfDay(), false);

        if ($daysRemaining <= 0) {
            return 1;
        }

        return max(1, (int) ceil($daysRemaining / 30));
    }

    private static function formatStorageLabel(mixed $storageLimitGb): string
    {
        if (! is_numeric($storageLimitGb)) {
            return 'غير محدود';
        }

        $storage = (float) $storageLimitGb;
        if ($storage <= 0) {
            return 'غير محدود';
        }

        $formatted = fmod($storage, 1.0) === 0.0
            ? (string) (int) $storage
            : rtrim(rtrim((string) $storage, '0'), '.');

        return $formatted . ' GB';
    }

}
