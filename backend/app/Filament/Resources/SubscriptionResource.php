<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DatePicker;
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
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class SubscriptionResource extends BaseResource
{
    protected static ?string $model = Subscription::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-credit-card';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'اشتراك';

    protected static ?string $pluralModelLabel = 'الاشتراكات';

    protected static ?string $recordTitleAttribute = 'type';

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
                                'App\Domains\Auth\Models\Academy' => 'أكاديمية',
                                'App\Domains\Auth\Models\Teacher' => 'مدرس',
                            ])
                            ->required()
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
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'teacher' => 'primary',
                        'academy' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'teacher' => 'مدرس',
                        'academy' => 'أكاديمية',
                        default => is_string($state) ? $state : $state->value,
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

                Action::make('cancel')
                    ->label('إلغاء الاشتراك')
                    ->icon('heroicon-m-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Subscription $record): bool => $record->status !== \App\Domains\Subscriptions\Enums\SubscriptionStatus::CANCELLED)
                    ->action(function (Subscription $record): void {
                        $record->update(['status' => 'cancelled']);
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
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
