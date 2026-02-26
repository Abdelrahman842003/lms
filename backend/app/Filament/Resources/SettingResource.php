<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Support\Models\Setting;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
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
use Illuminate\Support\Str;

class SettingResource extends BaseResource
{
    protected static ?string $model = Setting::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?int $navigationSort = 99;

    protected static ?string $modelLabel = 'إعداد';

    protected static ?string $pluralModelLabel = 'الإعدادات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المنصة';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('معلومات الإعداد')
                    ->schema([
                        TextInput::make('key')
                            ->label('المفتاح')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('مثال: site_name, payment_gateway')
                            ->disabled(fn (string $operation): bool => $operation === 'edit')
                            ->prefixIcon('heroicon-m-key'),

                        Select::make('group')
                            ->label('المجموعة')
                            ->options([
                                'general' => 'عام',
                                'payment' => 'الدفع',
                                'notification' => 'الإشعارات',
                                'security' => 'الأمان',
                                'integration' => 'التكاملات',
                                'academy' => 'الأكاديمية',
                                'subscription' => 'الاشتراكات',
                            ])
                            ->required()
                            ->native(false),

                        Select::make('type')
                            ->label('النوع')
                            ->options([
                                'text' => 'نص',
                                'number' => 'رقم',
                                'toggle' => 'تبديل',
                                'json' => 'JSON',
                            ])
                            ->default('text')
                            ->required()
                            ->live()
                            ->native(false),

                        Textarea::make('description')
                            ->label('الوصف')
                            ->rows(2)
                            ->placeholder('وصف مختصر للإعداد'),
                    ])
                    ->columns(2),

                Section::make('القيمة')
                    ->schema([
                        TextInput::make('value')
                            ->label('القيمة')
                            ->maxLength(65535)
                            ->visible(fn (\Filament\Forms\Get $get): bool => $get('type') === 'text')
                            ->placeholder('أدخل القيمة النصية'),

                        TextInput::make('value_number')
                            ->label('القيمة')
                            ->numeric()
                            ->visible(fn (\Filament\Forms\Get $get): bool => $get('type') === 'number')
                            ->placeholder('أدخل القيمة الرقمية'),

                        Toggle::make('value_toggle')
                            ->label('القيمة')
                            ->visible(fn (\Filament\Forms\Get $get): bool => $get('type') === 'toggle')
                            ->default(false),

                        Textarea::make('value_json')
                            ->label('القيمة (JSON)')
                            ->visible(fn (\Filament\Forms\Get $get): bool => $get('type') === 'json')
                            ->placeholder('{"key": "value"}')
                            ->helperText('يجب أن تكون صيغة JSON صحيحة'),
                    ])
                    ->visible(fn (string $operation): bool => $operation === 'create')
                    ->columns(1),

                Section::make('القيمة')
                    ->schema([
                        // Dynamic value field based on existing type
                        TextInput::make('value')
                            ->label('القيمة')
                            ->maxLength(65535)
                            ->placeholder('أدخل القيمة'),
                    ])
                    ->visible(fn (string $operation): bool => $operation === 'edit')
                    ->columns(1),

                Section::make('الإعدادات العامة')
                    ->schema([
                        Toggle::make('is_public')
                            ->label('عام')
                            ->default(true)
                            ->helperText('إظهار في API للعموم'),
                    ]),
            ]);
    }

    protected static function mutateFormDataBeforeCreate(array $data): array
    {
        // Handle different value types
        $type = $data['type'] ?? 'text';
        $data['value'] = match ($type) {
            'number' => $data['value_number'] ?? '0',
            'toggle' => ($data['value_toggle'] ?? false) ? '1' : '0',
            'json' => $data['value_json'] ?? '{}',
            default => $data['value'] ?? '',
        };

        // Remove temporary fields
        unset($data['value_number'], $data['value_toggle'], $data['value_json']);

        return $data;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('key')
                    ->label('المفتاح')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold')
                    ->copyable(),

                Tables\Columns\TextColumn::make('value')
                    ->label('القيمة')
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->value)
                    ->formatStateUsing(function ($state, $record) {
                        // Mask sensitive values
                        if (in_array($record->key, Setting::$encryptedKeys)) {
                            return '********';
                        }
                        return Str::limit($state, 50);
                    }),

                Tables\Columns\BadgeColumn::make('group')
                    ->label('المجموعة')
                    ->colors([
                        'primary' => 'general',
                        'success' => 'payment',
                        'warning' => 'notification',
                        'danger' => 'security',
                        'info' => 'integration',
                        'gray' => 'academy',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'general' => 'عام',
                        'payment' => 'الدفع',
                        'notification' => 'الإشعارات',
                        'security' => 'الأمان',
                        'integration' => 'التكاملات',
                        'academy' => 'الأكاديمية',
                        'subscription' => 'الاشتراكات',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('type')
                    ->label('النوع')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'text' => 'نص',
                        'number' => 'رقم',
                        'toggle' => 'تبديل',
                        'json' => 'JSON',
                        default => $state ?? 'نص',
                    }),

                Tables\Columns\IconColumn::make('is_public')
                    ->label('عام')
                    ->boolean()
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('آخر تحديث')
                    ->dateTime('Y-m-d H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('group')
                    ->label('المجموعة')
                    ->options([
                        'general' => 'عام',
                        'payment' => 'الدفع',
                        'notification' => 'الإشعارات',
                        'security' => 'الأمان',
                        'integration' => 'التكاملات',
                        'academy' => 'الأكاديمية',
                        'subscription' => 'الاشتراكات',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\SelectFilter::make('type')
                    ->label('النوع')
                    ->options([
                        'text' => 'نص',
                        'number' => 'رقم',
                        'toggle' => 'تبديل',
                        'json' => 'JSON',
                    ]),

                Tables\Filters\TernaryFilter::make('is_public')
                    ->label('الإظهار العام')
                    ->placeholder('الكل')
                    ->trueLabel('عام')
                    ->falseLabel('خاص'),
            ])
            ->actions([
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
            ->defaultSort('group', 'asc')
            ->emptyStateHeading('لا يوجد إعدادات')
            ->emptyStateDescription('قم بإنشاء إعداد جديد للبدء')
            ->emptyStateIcon('heroicon-o-cog-6-tooth');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\SettingResource\Pages\ListSettings::route('/'),
            'create' => \App\Filament\Resources\SettingResource\Pages\CreateSetting::route('/create'),
            'edit' => \App\Filament\Resources\SettingResource\Pages\EditSetting::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}