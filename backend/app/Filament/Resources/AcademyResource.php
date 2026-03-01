<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Auth\Models\Academy;
use App\Domains\Support\Models\Setting;
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

class AcademyResource extends BaseResource
{
    protected static ?string $model = Academy::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-building-library';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'أكاديمية';

    protected static ?string $pluralModelLabel = 'الأكاديميات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المنصة';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('name')
                            ->label('اسم الأكاديمية')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم الأكاديمية'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->required()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),
                    ])
                    ->columns(2),

                Section::make('الشعار والصور')
                    ->schema([
                        FileUpload::make('logo_key')
                            ->label('شعار الأكاديمية')
                            ->image()
                            ->directory('academies/logos')
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
                    ->visible(fn (string $operation): bool => $operation === 'create'),

                Section::make('حالة الأكاديمية')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('نشط')
                            ->default(true)
                            ->helperText('تحديد ما إذا كانت الأكاديمية نشطة أم لا'),
                    ])
                    ->columns(2),


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
                                        $pricePerStudent = (float) Setting::where('key', 'academy_price_per_student')->value('value') ?: 40;
                                    } catch (\Exception $e) {
                                        $pricePerStudent = 40;
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
                                        $pricePerStudent = (float) Setting::where('key', 'academy_price_per_student')->value('value') ?: 40;
                                    } catch (\Exception $e) {
                                        $pricePerStudent = 40;
                                    }
                                    
                                    $set('subscription_fee', $students * $months * $pricePerStudent);
                                }
                            }),

                        DatePicker::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
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
                            ->default(100)
                            ->visible(fn ($get) => ! $get('is_unlimited_students'))
                            ->reactive()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state) {
                                    $months = match ($get('subscription_period')) {
                                        'monthly' => 1,
                                        'quarterly' => 3,
                                        'semi_annual' => 6,
                                        'annual' => 12,
                                        default => (int) $get('custom_period_months'),
                                    };
                                    
                                    if ($months > 0) {
                                        try {
                                            $pricePerStudent = (float) Setting::where('key', 'academy_price_per_student')->value('value') ?: 40;
                                        } catch (\Exception $e) {
                                            $pricePerStudent = 40;
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
                                $limit = $get('is_unlimited_students') ? 'غير محدود' : ($get('plan_max_students') ?? '100');
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
                                $limit = $get('is_unlimited_students') ? 'غير محدود' : ($get('plan_max_students') ?? '100');
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
                Tables\Columns\ImageColumn::make('logo_key')
                    ->label('الشعار')
                    ->circular()
                    ->defaultImageUrl(url('/images/default-academy.png'))
                    ->toggleable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('اسم الأكاديمية')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('phone')
                    ->label('الهاتف')
                    ->searchable()
                    ->copyable()
                    ->icon('heroicon-m-phone')
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('نشط')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('plan_type')
                    ->label('الخطة')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'trial' => 'gray',
                        'term' => 'info',
                        'custom' => 'warning',
                        'free' => 'gray', // Backward compatibility if any
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'trial' => 'تجريبي',
                        'term' => 'مدة محددة',
                        'custom' => 'مخصص',
                        'free' => 'مجاني',
                        default => is_string($state) ? $state : $state->value,
                    })
                    ->sortable(),

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
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('الحالة النشطة')
                    ->placeholder('الكل')
                    ->trueLabel('نشط فقط')
                    ->falseLabel('غير نشط فقط'),

                Tables\Filters\SelectFilter::make('plan_type')
                    ->label('نوع الخطة')
                    ->options([
                        'trial' => 'تجريبي',
                        'term' => 'مدة محددة',
                        'custom' => 'مخصص',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\Filter::make('expired')
                    ->label('اشتراك منتهي')
                    ->query(fn (Builder $query): Builder => $query->where('plan_expires_at', '<', now()))
                    ->toggle(),
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

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
            ->emptyStateHeading('لا يوجد أكاديميات')
            ->emptyStateDescription('قم بإنشاء أكاديمية جديدة للبدء')
            ->emptyStateIcon('heroicon-o-building-library');
    }

    public static function getRelations(): array
    {
        return [
            // Relations can be added here if needed
        ];
    }

    public static function getWidgets(): array
    {
        return [
            \App\Filament\Resources\AcademyResource\Widgets\AcademyStatsWidget::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\AcademyResource\Pages\ListAcademies::route('/'),
            'create' => \App\Filament\Resources\AcademyResource\Pages\CreateAcademy::route('/create'),
            'edit' => \App\Filament\Resources\AcademyResource\Pages\EditAcademy::route('/{record}/edit'),
            'view' => \App\Filament\Resources\AcademyResource\Pages\ViewAcademy::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
