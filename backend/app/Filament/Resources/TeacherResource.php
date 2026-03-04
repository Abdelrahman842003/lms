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
use App\Domains\Support\Models\Setting;

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
                            ->dehydrateStateUsing(fn ($state) => filled($state) ? Hash::make($state) : null)
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
                                'pending' => 'معلق',
                            ])
                            ->default('pending')
                            ->required(),

                        Toggle::make('is_independent_active')
                            ->label('نشط كمعلم مستقل')
                            ->default(false)
                            ->helperText('يمكن للمعلم العمل كمعلم مستقل خارج الأكاديميات'),
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
                        Select::make('plan_selection')
                            ->label('مدة الاشتراك')
                            ->options(fn () => [
                                'trial' => 'تجريبي (' . \App\Domains\Support\Services\HelperService::getTrialPeriodDays() . ' يوم)',
                                'monthly' => 'شهري (1 شهر)',
                                'quarterly' => 'ربع سنوي (3 شهور)',
                                'semi_annual' => 'نصف سنوي (6 شهور)',
                                'annual' => 'سنوي (1 سنة)',
                                'custom' => 'مخصص (Custom)',
                            ])
                            ->default('trial')
                            ->reactive()
                            ->dehydrated(false)
                            ->afterStateHydrated(function ($component, $state, $record) {
                                if (!$record) return;
                                
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
                                    $trialDays = \App\Domains\Support\Services\HelperService::getTrialPeriodDays();
                                    $set('plan_type', 'trial');
                                    $set('subscription_period', null);
                                    $set('custom_period_months', null);
                                    $set('plan_expires_at', now()->addDays($trialDays)->format('Y-m-d'));
                                    $set('subscription_fee', 0);
                                    $set('paid_amount', 0);
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
                                        $pricePerStudent = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                    } catch (\Exception $e) {
                                        $pricePerStudent = 60;
                                    }
                                    
                                    $set('subscription_fee', $students * $months * $pricePerStudent);
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
                            ->visible(fn ($get) => $get('plan_type') === 'custom')
                            ->reactive()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state) {
                                    $months = (int) $state;
                                    $set('plan_expires_at', now()->addMonths($months)->format('Y-m-d'));

                                    // Calculate fee
                                    $students = (int) $get('plan_max_students');
                                    try {
                                        $pricePerStudent = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                    } catch (\Exception $e) {
                                        $pricePerStudent = 60;
                                    }
                                    
                                    $set('subscription_fee', $students * $months * $pricePerStudent);
                                }
                            }),

                        DatePicker::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
                            ->default(now()->addDays(\App\Domains\Support\Services\HelperService::getTrialPeriodDays())->format('Y-m-d'))
                            ->required()
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
                                    $months = match ($get('plan_selection')) {
                                        'monthly' => 1,
                                        'quarterly' => 3,
                                        'semi_annual' => 6,
                                        'annual' => 12,
                                        default => (int) $get('custom_period_months'),
                                    };
                                    
                                    if ($months > 0) {
                                        try {
                                            $pricePerStudent = (float) Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
                                        } catch (\Exception $e) {
                                            $pricePerStudent = 60;
                                        }
                                        
                                        $set('subscription_fee', $state * $months * $pricePerStudent);
                                    }
                                }
                            }),

                        TextInput::make('subscription_fee')
                            ->label('رسوم الاشتراك')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                // Auto-update billing notes
                                $limit = $get('is_unlimited_students') ? 'غير محدود' : ($get('plan_max_students') ?? '50');
                                $trialDays = \App\Domains\Support\Services\HelperService::getTrialPeriodDays();
                                $period = match($get('plan_selection')) {
                                    'trial' => 'تجريبي (' . $trialDays . ' يوم)',
                                    'monthly' => 'شهري',
                                    'quarterly' => 'ربع سنوي',
                                    'semi_annual' => 'نصف سنوي',
                                    'annual' => 'سنوي',
                                    'custom' => 'مخصص', 
                                    default => 'تجريبي'
                                };
                                $fee = $state ?? 0;
                                $paid = $get('paid_amount') ?? 0;
                                $remaining = $fee - $paid;

                                $note = "نوع الاشتراك: {$period}\n" .
                                        "الحد الأقصى للطلاب: {$limit}\n" .
                                        "الرسوم: {$fee} ج.م\n" .
                                        "المدفوع: {$paid} ج.م\n" .
                                        "المتبقي: {$remaining} ج.م";
                                
                                $set('billing_notes', $note);
                            }),

                        TextInput::make('paid_amount')
                            ->label('المبلغ المدفوع')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->reactive()
                            ->afterStateUpdated(function ($state, $get, $set) {
                                // Auto-update billing notes
                                $limit = $get('is_unlimited_students') ? 'غير محدود' : ($get('plan_max_students') ?? '50');
                                $trialDays = \App\Domains\Support\Services\HelperService::getTrialPeriodDays();
                                $period = match($get('plan_selection')) {
                                    'trial' => 'تجريبي (' . $trialDays . ' يوم)',
                                    'monthly' => 'شهري',
                                    'quarterly' => 'ربع سنوي',
                                    'semi_annual' => 'نصف سنوي',
                                    'annual' => 'سنوي',
                                    'custom' => 'مخصص', 
                                    default => 'تجريبي'
                                };
                                $fee = $get('subscription_fee') ?? 0;
                                $paid = $state ?? 0;
                                $remaining = $fee - $paid;

                                $note = "نوع الاشتراك: {$period}\n" .
                                        "الحد الأقصى للطلاب: {$limit}\n" .
                                        "الرسوم: {$fee} ج.م\n" .
                                        "المدفوع: {$paid} ج.م\n" .
                                        "المتبقي: {$remaining} ج.م";
                                
                                $set('billing_notes', $note);
                            }),

                        Textarea::make('billing_notes')
                            ->label('ملاحظات الفواتير')
                            ->columnSpanFull()
                            ->rows(4)
                            ->placeholder('سيتم إنشاء الملاحظات تلقائياً عند تحديث الاشتراك'),
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
                        'pending' => 'معلق',
                        default => is_string($state) ? $state : $state->value,
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('plan_type')
                    ->label('الخطة')
                    ->state(fn (Teacher $record): string => static::resolvePlanTypeForDisplay($record))
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'trial' => 'gray',
                        'term' => 'info',
                        'custom' => 'warning',
                        'free' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'trial' => 'تجريبي',
                        'term' => 'مدة محددة',
                        'custom' => 'مخصص',
                        'free' => 'مجاني',
                        default => 'غير محدد',
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
                        'pending' => 'معلق',
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
        $planType = trim((string) ($teacher->plan_type ?? ''));
        if (in_array($planType, ['trial', 'term', 'custom', 'free'], true)) {
            return $planType;
        }

        $subscriptionPeriod = trim((string) ($teacher->subscription_period ?? ''));
        if (in_array($subscriptionPeriod, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return 'term';
        }

        $hasExpiryDate = ! is_null($teacher->plan_expires_at);
        $amountDue = (float) ($teacher->subscription_fee ?? 0);
        $amountPaid = (float) ($teacher->paid_amount ?? 0);

        if ($hasExpiryDate && $amountDue <= 0.0 && $amountPaid <= 0.0) {
            return 'trial';
        }

        return '';
    }
}
