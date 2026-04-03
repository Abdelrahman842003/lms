<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Application\Models\Setting;
use App\Domains\Application\Services\HelperService;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SubscriptionResource extends BaseResource
{
    protected static ?string $model = Subscription::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-credit-card';

    protected static ?int $navigationSort = 7;

    protected static ?string $modelLabel = 'اشتراك';

    protected static ?string $pluralModelLabel = 'الاشتراكات';

    protected static ?string $recordTitleAttribute = 'id';

    protected static array $globalSearchAttributes = ['subscriber.name'];

    public static function getGloballySearchableAttributes(): array
    {
        return static::$globalSearchAttributes;
    }

    public static function getRecordTitle(?Model $record): string | Htmlable | null
    {
        if (! $record) {
            return static::getModelLabel();
        }

        $subscriberName = (string) ($record->subscriber?->name ?? 'مشترك');
        $type = $record->type;
        $typeLabel = match (is_string($type) ? $type : $type?->value) {
            'teacher' => 'مدرس',
            'academy' => 'أكاديمية',
            default => 'اشتراك',
        };
        $month = $record->month?->format('Y-m');

        return $month
            ? "{$subscriberName} - {$typeLabel} ({$month})"
            : "{$subscriberName} - {$typeLabel}";
    }

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المستخدمين';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Section::make('نوع المشترك')
                    ->schema([
                        Select::make('subscriber_type')
                            ->label('نوع المشترك')
                            ->options([
                                'App\Domains\Auth\Models\Academy' => 'أكاديمية',
                                'App\Domains\Auth\Models\Teacher' => 'مدرس',
                            ])
                            ->required()
                            ->afterStateUpdated(function ($state, \Filament\Schemas\Components\Utilities\Set $set): void {
                                $set('type', match ($state) {
                                    Academy::class => 'academy',
                                    Teacher::class => 'teacher',
                                    default => null,
                                });
                            })
                            ->live(),

                        Select::make('subscriber_id')
                            ->label('المشترك')
                            ->options(function (\Filament\Schemas\Components\Utilities\Get $get) {
                                $type = $get('subscriber_type');
                                if ($type === 'App\Domains\Auth\Models\Academy') {
                                    return Academy::pluck('name', 'id');
                                } elseif ($type === 'App\Domains\Auth\Models\Teacher') {
                                    return Teacher::pluck('name', 'id');
                                }
                                return [];
                            })
                            ->searchable()
                            ->required()
                            ->preload(),
                    ])
                    ->columns(2),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        Toggle::make('update_subscription_duration')
                            ->label('تعديل مدة الاشتراك؟')
                            ->default(false)
                            ->visible(fn ($record): bool => $record !== null)
                            ->helperText('إذا كان الاختيار "لا" سيتم تعديل الباقة/الحدود فقط على المدة المتبقية دون بدء دورة جديدة.')
                            ->reactive(),

                        Placeholder::make('subscription_pricing_mode_notice')
                            ->label('تنبيه طريقة الحساب')
                            ->content(fn ($get): string => ($get('update_subscription_duration') === false)
                                ? 'يتم الآن احتساب الرسوم على المدة المتبقية فقط.'
                                : 'يتم الآن احتساب الرسوم على مدة الاشتراك المختارة.')
                            ->visible(fn ($record): bool => $record !== null),

                        Select::make('plan_selection')
                            ->label('نوع الاشتراك')
                            ->options(fn (): array => static::planOptions())
                            ->placeholder('اختر نوع الاشتراك')
                            ->selectablePlaceholder(false)
                            ->native(false)
                            ->reactive()
                            ->disabled(fn ($get, string $operation): bool => $operation === 'edit' && ! (bool) ($get('update_subscription_duration') ?? false))
                            ->afterStateHydrated(function ($component, $state, ?Subscription $record): void {
                                if (! $record) {
                                    return;
                                }

                                $component->state(static::resolvePlanSelectionKey($record));
                            })
                            ->afterStateUpdated(function ($state, \Filament\Schemas\Components\Utilities\Set $set, \Filament\Schemas\Components\Utilities\Get $get): void {
                                if (! $state) {
                                    return;
                                }

                                $planLabel = static::planOptions()[$state] ?? null;
                                if ($planLabel === null) {
                                    return;
                                }

                                $notes = (string) ($get('notes') ?? '');
                                $set('notes', static::upsertPlanLabelInNotes($notes, $planLabel));
                            }),

                        TextInput::make('custom_period_months')
                            ->label('عدد الشهور (مخصص)')
                            ->numeric()
                            ->minValue(1)
                            ->default(1)
                            ->visible(fn ($get): bool => (string) ($get('plan_selection') ?? '') === 'custom'),

                        Hidden::make('type')
                            ->required(),

                        DatePicker::make('month')
                            ->label('الشهر')
                            ->required()
                            ->default(now()),

                        TextInput::make('seats_count')
                            ->label('المقاعد المستخدمة حالياً')
                            ->helperText('عدد المقاعد/الطلاب المشغولة فعلياً الآن')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->live()
                            ->afterStateUpdated(function ($state, \Filament\Schemas\Components\Utilities\Get $get, \Filament\Schemas\Components\Utilities\Set $set): void {
                                $limit = $get('quota_limit');

                                if (! is_numeric($limit) || ! is_numeric($state)) {
                                    return;
                                }

                                $seats = (int) $state;
                                $quota = (int) $limit;

                                if ($seats > $quota) {
                                    $set('seats_count', $quota);
                                }
                            })
                            ->rule(function (\Filament\Schemas\Components\Utilities\Get $get) {
                                return function (string $attribute, mixed $value, \Closure $fail) use ($get): void {
                                    $limit = $get('quota_limit');

                                    if (! is_numeric($limit) || ! is_numeric($value)) {
                                        return;
                                    }

                                    if ((int) $value > (int) $limit) {
                                        $fail('المقاعد المستخدمة حالياً لا يمكن أن تتجاوز الحد الأقصى للمقاعد.');
                                    }
                                };
                            })
                            ->required(),

                        TextInput::make('quota_limit')
                            ->label('الحد الأقصى للمقاعد')
                            ->helperText('السقف المسموح به من المقاعد في هذه الباقة')
                            ->numeric()
                            ->minValue(0)
                            ->placeholder('اتركه فارغاً للغير محدود')
                            ->live()
                            ->afterStateUpdated(function ($state, \Filament\Schemas\Components\Utilities\Get $get, \Filament\Schemas\Components\Utilities\Set $set): void {
                                if (! is_numeric($state)) {
                                    return;
                                }

                                $quota = (int) $state;
                                $seats = (int) ($get('seats_count') ?? 0);

                                if ($seats > $quota) {
                                    $set('seats_count', $quota);
                                }
                            })
                            ->nullable(),

                        TextInput::make('storage_limit_gb')
                            ->label('الحد الأقصى للتخزين (GB)')
                            ->helperText('سعة التخزين المتاحة ضمن الباقة')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->afterStateHydrated(function ($component, $state, ?Subscription $record): void {
                                if (! $record) {
                                    return;
                                }

                                $storage = data_get($record->subscriber, 'storage_limit_gb');
                                if (is_numeric($storage)) {
                                    $component->state((int) $storage);
                                }
                            }),

                        TextInput::make('cost_per_seat')
                            ->label('التكلفة لكل مقعد')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0),

                        TextInput::make('amount_due')
                            ->label('المبلغ المستحق')
                            ->helperText(fn ($get, string $operation): ?string => $operation === 'edit' && ! (bool) ($get('update_subscription_duration') ?? false)
                                ? 'سيتم ضبط المبلغ تلقائياً حسب الفرق على المدة المتبقية.'
                                : null)
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->required(),

                        TextInput::make('amount_paid')
                            ->label('المبلغ المدفوع')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0)
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('حالة الاشتراك')
                    ->schema([
                        Select::make('status')
                            ->label('الحالة')
                            ->options([
                                'pending' => 'غير مدفوع',
                                'partial' => 'مدفوع جزئياً',
                                'paid' => 'مدفوع',
                                'cancelled' => 'ملغي',
                            ])
                            ->default('pending')
                            ->required(),

                        DatePicker::make('paid_at')
                            ->label('تاريخ الدفع')
                            ->placeholder('اختر تاريخ الدفع'),
                    ])
                    ->columns(2),

                Section::make('ملاحظات')
                    ->schema([
                        Textarea::make('notes')
                            ->label('ملاحظات')
                            ->rows(3)
                            ->placeholder('أدخل أي ملاحظات إضافية')
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('subscriber.name')
                    ->label('المشترك')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('subscriber_type')
                    ->label('النوع')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'App\Domains\Auth\Models\Academy' => 'success',
                        'App\Domains\Auth\Models\Teacher' => 'primary',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'App\Domains\Auth\Models\Academy' => 'أكاديمية',
                        'App\Domains\Auth\Models\Teacher' => 'مدرس',
                        default => is_string($state) ? $state : $state->value,
                    }),

                Tables\Columns\TextColumn::make('type')
                    ->label('خطة الاشتراك')
                    ->state(fn (Subscription $record): string => static::resolvePlanLabel($record))
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'تجريبي' => 'gray',
                        'شهري (1 شهر)' => 'primary',
                        'ربع سنوي (3 شهور)' => 'info',
                        'نصف سنوي (6 شهور)' => 'warning',
                        'سنوي (1 سنة)' => 'success',
                        'مخصص (Custom)' => 'purple',
                        'دوري' => 'primary',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('amount_due')
                    ->label('المبلغ المستحق')
                    ->money('EGP')
                    ->sortable(),

                Tables\Columns\TextColumn::make('amount_paid')
                    ->label('المبلغ المدفوع')
                    ->money('EGP')
                    ->sortable(),

                Tables\Columns\TextColumn::make('month')
                    ->label('الشهر')
                    ->date('Y-m')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('حالة الدفع')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'pending' => 'warning',
                        'partial' => 'info',
                        'paid' => 'success',
                        'cancelled' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'pending' => 'غير مدفوع',
                        'partial' => 'مدفوع جزئياً',
                        'paid' => 'مدفوع',
                        'cancelled' => 'ملغي',
                        default => is_string($state) ? $state : $state->value,
                    }),

                Tables\Columns\TextColumn::make('request_type')
                    ->label('نوع الطلب')
                    ->state(fn (Subscription $record): string => static::resolveRequestTypeState($record))
                    ->badge()
                    ->color(fn (string $state): string => $state === SubscriptionRenewalService::REQUEST_TYPE_UPGRADE ? 'warning' : 'info')
                    ->formatStateUsing(fn (string $state): string => $state === SubscriptionRenewalService::REQUEST_TYPE_UPGRADE ? 'طلب ترقية' : 'تجديد'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('نوع الاشتراك')
                    ->options([
                        'teacher' => 'مدرس',
                        'academy' => 'أكاديمية',
                    ]),

                Tables\Filters\SelectFilter::make('subscriber_type')
                    ->label('نوع المشترك')
                    ->options([
                        'App\Domains\Auth\Models\Academy' => 'أكاديمية',
                        'App\Domains\Auth\Models\Teacher' => 'مدرس',
                    ]),

                Tables\Filters\SelectFilter::make('status')
                    ->label('حالة الدفع')
                    ->options([
                        'pending' => 'غير مدفوع',
                        'partial' => 'مدفوع جزئياً',
                        'paid' => 'مدفوع',
                        'cancelled' => 'ملغي',
                    ])
                    ->multiple()
                    ->preload(),
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                Action::make('reviewRenewal')
                    ->label('طلب التجديد')
                    ->icon('heroicon-m-document-magnifying-glass')
                    ->color('info')
                    ->visible(fn (Subscription $record): bool => $record->status === SubscriptionStatus::PENDING && ! static::isUpgradeRequest($record))
                    ->url(fn (Subscription $record): string => static::getUrl('review-renewal', ['record' => $record])),

                Action::make('reviewUpgrade')
                    ->label('طلب ترقية')
                    ->icon('heroicon-m-arrow-trending-up')
                    ->color('warning')
                    ->visible(fn (Subscription $record): bool => $record->status === SubscriptionStatus::PENDING && static::isUpgradeRequest($record))
                    ->url(fn (Subscription $record): string => static::getUrl('review-upgrade', ['record' => $record])),

                Action::make('cancel')
                    ->label(fn (Subscription $record): string => $record->status === SubscriptionStatus::PENDING && $record->request_type !== null
                        ? 'إلغاء الطلب'
                        : 'إلغاء الاشتراك')
                    ->icon('heroicon-m-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Subscription $record): bool => $record->status !== \App\Domains\Subscriptions\Enums\SubscriptionStatus::CANCELLED)
                    ->action(function (Subscription $record): void {
                        if ($record->status === SubscriptionStatus::PENDING && $record->request_type !== null) {
                            $record->delete();

                            Notification::make()
                                ->title('تم إلغاء الطلب والرجوع للوضع الأصلي')
                                ->success()
                                ->send();

                            return;
                        }

                        $record->update(['status' => SubscriptionStatus::CANCELLED->value]);

                        Notification::make()
                            ->title('تم إلغاء الاشتراك بنجاح')
                            ->success()
                            ->send();
                    }),

                Action::make('restoreOriginalRequestState')
                    ->label('الرجوع للأصل')
                    ->icon('heroicon-m-arrow-uturn-left')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->visible(function (Subscription $record): bool {
                        return $record->status === SubscriptionStatus::CANCELLED
                            && $record->request_type !== null
                            && (float) $record->amount_paid === 0.0
                            && $record->paid_at === null;
                    })
                    ->action(function (Subscription $record): void {
                        $record->delete();

                        Notification::make()
                            ->title('تمت إعادة الطلب للوضع الأصلي')
                            ->success()
                            ->send();
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
            ->defaultSort('month', 'desc')
            ->emptyStateHeading('لا يوجد اشتراكات')
            ->emptyStateDescription('قم بإنشاء اشتراك جديد للبدء')
            ->emptyStateIcon('heroicon-o-credit-card');
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
            'index' => \App\Filament\Resources\SubscriptionResource\Pages\ListSubscriptions::route('/'),
            'create' => \App\Filament\Resources\SubscriptionResource\Pages\CreateSubscription::route('/create'),
            'edit' => \App\Filament\Resources\SubscriptionResource\Pages\EditSubscription::route('/{record}/edit'),
            'view' => \App\Filament\Resources\SubscriptionResource\Pages\ViewSubscription::route('/{record}'),
            'review-renewal' => \App\Filament\Resources\SubscriptionResource\Pages\ReviewRenewalRequest::route('/{record}/review-renewal'),
            'review-upgrade' => \App\Filament\Resources\SubscriptionResource\Pages\ReviewUpgradeRequest::route('/{record}/review-upgrade'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['subscriber']);
    }

    private static function resolveRequestTypeState(Subscription $record): string
    {
        if ($record->status === SubscriptionStatus::PENDING && static::isUpgradeRequest($record)) {
            return SubscriptionRenewalService::REQUEST_TYPE_UPGRADE;
        }

        return $record->request_type ?: SubscriptionRenewalService::REQUEST_TYPE_RENEWAL;
    }

    private static function isUpgradeRequest(Subscription $record): bool
    {
        if ($record->request_type === SubscriptionRenewalService::REQUEST_TYPE_UPGRADE) {
            return true;
        }

        return $record->upgrade_seats_to !== null
            || $record->upgrade_storage_to_gb !== null
            || (is_numeric($record->upgrade_price_difference) && (float) $record->upgrade_price_difference > 0)
            || $record->upgrade_seats_from !== null
            || $record->upgrade_storage_from_gb !== null;
    }

    public static function resolvePlanLabel(Subscription $record): string
    {
        $subscriber = $record->subscriber;

        $parsedFromSubscriptionNotes = static::extractPlanLabelFromNotes(
            is_string($record->notes) ? $record->notes : null
        );

        if ($parsedFromSubscriptionNotes !== null) {
            return $parsedFromSubscriptionNotes;
        }

        $planType = (string) data_get($subscriber, 'plan_type', '');
        $subscriptionPeriod = (string) data_get($subscriber, 'subscription_period', '');

        if (in_array($subscriptionPeriod, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)) {
            return match ($subscriptionPeriod) {
                'monthly' => 'شهري (1 شهر)',
                'quarterly' => 'ربع سنوي (3 شهور)',
                'semi_annual' => 'نصف سنوي (6 شهور)',
                'annual' => 'سنوي (1 سنة)',
                default => 'دوري',
            };
        }

        if ($planType === 'trial') {
            return 'تجريبي';
        }

        if ($planType === 'custom') {
            return 'مخصص (Custom)';
        }

        if ($planType === 'term') {
            return 'دوري';
        }

        $inferredDuration = static::inferDurationLabel($record);
        if ($inferredDuration !== null) {
            return $inferredDuration;
        }

        return 'غير محدد';
    }

    private static function planOptions(): array
    {
        $trialDays = HelperService::getTrialPeriodDays();

        return [
            'trial' => "تجريبي ({$trialDays} يوم)",
            'monthly' => 'شهري (1 شهر)',
            'quarterly' => 'ربع سنوي (3 شهور)',
            'semi_annual' => 'نصف سنوي (6 شهور)',
            'annual' => 'سنوي (1 سنة)',
            'custom' => 'مخصص (Custom)',
        ];
    }

    private static function resolvePlanSelectionKey(Subscription $record): ?string
    {
        $label = static::resolvePlanLabel($record);

        foreach (static::planOptions() as $key => $optionLabel) {
            if ($optionLabel === $label) {
                return $key;
            }
        }

        return match ($label) {
            'تجريبي' => 'trial',
            'شهري' => 'monthly',
            'شهري (1 شهر)' => 'monthly',
            'ربع سنوي' => 'quarterly',
            'ربع سنوي (3 شهور)' => 'quarterly',
            'نصف سنوي' => 'semi_annual',
            'نصف سنوي (6 شهور)' => 'semi_annual',
            'سنوي' => 'annual',
            'سنوي (1 سنة)' => 'annual',
            'مخصص (Custom)' => 'custom',
            default => null,
        };
    }

    private static function extractPlanLabelFromNotes(?string $notes): ?string
    {
        if (blank($notes)) {
            return null;
        }

        if (preg_match('/نوع الاشتراك\\s*:\\s*([^\\n\\r]+)/u', (string) $notes, $matches) === 1) {
            $label = trim((string) ($matches[1] ?? ''));
            return $label !== '' ? $label : null;
        }

        return null;
    }

    private static function inferDurationLabel(Subscription $record): ?string
    {
        if ((float) ($record->amount_due ?? 0) <= 0) {
            return 'تجريبي';
        }

        $costPerSeat = (float) ($record->cost_per_seat ?? 0);
        if ($costPerSeat <= 0) {
            return null;
        }

        $isTeacher = (string) ($record->subscriber_type ?? '') === Teacher::class;
        $settingKey = $isTeacher ? 'teacher_price_per_student' : 'academy_price_per_student';
        $defaultPrice = $isTeacher ? '60' : '40';
        $pricePerStudent = (float) Setting::getValue($settingKey, $defaultPrice);

        if ($pricePerStudent <= 0) {
            return null;
        }

        $months = (int) round($costPerSeat / $pricePerStudent);

        return match ($months) {
            1 => 'شهري (1 شهر)',
            3 => 'ربع سنوي (3 شهور)',
            6 => 'نصف سنوي (6 شهور)',
            12 => 'سنوي (1 سنة)',
            default => null,
        };
    }

    private static function upsertPlanLabelInNotes(string $notes, string $planLabel): string
    {
        $planLine = "نوع الاشتراك: {$planLabel}";

        if ($notes === '') {
            return $planLine;
        }

        if (preg_match('/نوع الاشتراك\s*:\s*[^\n\r]+/u', $notes) === 1) {
            return (string) preg_replace('/نوع الاشتراك\s*:\s*[^\n\r]+/u', $planLine, $notes, 1);
        }

        return $planLine . "\n" . $notes;
    }
}
