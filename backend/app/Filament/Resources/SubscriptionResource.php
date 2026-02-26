<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class SubscriptionResource extends BaseResource
{
    protected static ?string $model = Subscription::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'اشتراك';

    protected static ?string $pluralModelLabel = 'الاشتراكات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة الاشتراكات';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('نوع المشترك')
                    ->schema([
                        Select::make('subscriber_type')
                            ->label('نوع المشترك')
                            ->options([
                                'App\Models\Academy' => 'أكاديمية',
                                'App\Models\Teacher' => 'مدرس',
                            ])
                            ->required()
                            ->live(),

                        Select::make('subscriber_id')
                            ->label('المشترك')
                            ->options(function (\Filament\Forms\Get $get) {
                                $type = $get('subscriber_type');
                                if ($type === 'App\Models\Academy') {
                                    return Academy::pluck('name', 'id');
                                } elseif ($type === 'App\Models\Teacher') {
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
                        Select::make('type')
                            ->label('نوع الاشتراك')
                            ->options([
                                'teacher' => 'مدرس',
                                'academy' => 'أكاديمية',
                            ])
                            ->required(),

                        DatePicker::make('month')
                            ->label('الشهر')
                            ->required()
                            ->default(now()),

                        TextInput::make('seats_count')
                            ->label('عدد المقاعد')
                            ->numeric()
                            ->default(0)
                            ->required(),

                        TextInput::make('quota_limit')
                            ->label('الحد الأقصى للمقاعد')
                            ->numeric()
                            ->placeholder('اتركه فارغاً للغير محدود')
                            ->nullable(),

                        TextInput::make('cost_per_seat')
                            ->label('التكلفة لكل مقعد')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0),

                        TextInput::make('amount_due')
                            ->label('المبلغ المستحق')
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

                        Toggle::make('is_active')
                            ->label('نشط')
                            ->default(true),

                        DatePicker::make('paid_at')
                            ->label('تاريخ الدفع')
                            ->placeholder('اختر تاريخ الدفع'),

                        Select::make('payment_method')
                            ->label('طريقة الدفع')
                            ->options([
                                'cash' => 'نقدي',
                                'vodafone_cash' => 'فودافون كاش',
                                'bank_transfer' => 'تحويل بنكي',
                                'online' => 'دفع إلكتروني',
                            ])
                            ->placeholder('اختر طريقة الدفع'),
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

                Tables\Columns\BadgeColumn::make('subscriber_type')
                    ->label('النوع')
                    ->colors([
                        'success' => 'App\Models\Academy',
                        'primary' => 'App\Models\Teacher',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'App\Models\Academy' => 'أكاديمية',
                        'App\Models\Teacher' => 'مدرس',
                        default => $state,
                    }),

                Tables\Columns\BadgeColumn::make('type')
                    ->label('خطة الاشتراك')
                    ->colors([
                        'primary' => 'teacher',
                        'success' => 'academy',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'teacher' => 'مدرس',
                        'academy' => 'أكاديمية',
                        default => $state,
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

                Tables\Columns\BadgeColumn::make('status')
                    ->label('حالة الدفع')
                    ->colors([
                        'warning' => 'pending',
                        'info' => 'partial',
                        'success' => 'paid',
                        'danger' => 'cancelled',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'غير مدفوع',
                        'partial' => 'مدفوع جزئياً',
                        'paid' => 'مدفوع',
                        'cancelled' => 'ملغي',
                        default => $state,
                    }),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('نشط')
                    ->boolean()
                    ->sortable()
                    ->toggleable(),

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
                        'App\Models\Academy' => 'أكاديمية',
                        'App\Models\Teacher' => 'مدرس',
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

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('الحالة')
                    ->placeholder('الكل')
                    ->trueLabel('نشط')
                    ->falseLabel('غير نشط'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                Tables\Actions\EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                Tables\Actions\Action::make('cancel')
                    ->label('إلغاء الاشتراك')
                    ->icon('heroicon-m-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Subscription $record): bool => $record->status !== 'cancelled')
                    ->action(function (Subscription $record): void {
                        $record->update(['status' => 'cancelled', 'is_active' => false]);
                    }),

                Tables\Actions\DeleteAction::make()
                    ->label('حذف')
                    ->icon('heroicon-m-trash')
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
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
            'index' => Pages\ListSubscriptions::class,
            'create' => Pages\CreateSubscription::class,
            'edit' => Pages\EditSubscription::class,
            'view' => Pages\ViewSubscription::class,
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
