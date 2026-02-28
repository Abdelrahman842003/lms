<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Support\Models\Setting;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class SettingResource extends BaseResource
{
    protected static ?string $model = Setting::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?int $navigationSort = 99;

    protected static ?string $modelLabel = 'إعداد';

    protected static ?string $pluralModelLabel = 'الإعدادات';

    protected static ?string $recordTitleAttribute = 'key';

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
                    ])
                    ->columns(2),

                Section::make('القيمة')
                    ->schema([
                        Textarea::make('value')
                            ->label('القيمة')
                            ->placeholder('أدخل القيمة'),
                    ])
                    ->columns(1),
            ]);
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
                    ->tooltip(fn ($record) => $record->value),

                Tables\Columns\TextColumn::make('group')
                    ->label('المجموعة')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'general' => 'primary',
                        'payment' => 'success',
                        'notification' => 'warning',
                        'security' => 'danger',
                        'integration' => 'info',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'general' => 'عام',
                        'payment' => 'الدفع',
                        'notification' => 'الإشعارات',
                        'security' => 'الأمان',
                        'integration' => 'التكاملات',
                        'academy' => 'الأكاديمية',
                        'subscription' => 'الاشتراكات',
                        default => is_string($state) ? $state : $state->value,
                    }),

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