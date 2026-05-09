<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Subscriptions\Models\PricingPackage;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Repeater;
use Filament\Schemas\Schema;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;

class PricingPackageResource extends BaseResource
{
    protected static ?string $model = PricingPackage::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-gift';

    protected static ?string $modelLabel = 'باقة أسعار';

    protected static ?string $pluralModelLabel = 'باقات الأسعار';

    protected static ?int $navigationSort = 8;

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة النظام';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('name_ar')
                            ->label('اسم الباقة (بالعربي)')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('name_en')
                            ->label('اسم الباقة (بالإنجليزي)')
                            ->maxLength(255),
                    ])->columns(2),

                Section::make('التسعير الشهري')
                    ->schema([
                        TextInput::make('price')
                            ->label('السعر الشهري الأساسي')
                            ->numeric()
                            ->prefix('ج.م')
                            ->required(),
                        TextInput::make('discount_percentage')
                            ->label('نسبة الخصم الشهري')
                            ->numeric()
                            ->suffix('%')
                            ->default(0),
                    ])->columns(2),

                Section::make('التسعير السنوي')
                    ->schema([
                        TextInput::make('yearly_price')
                            ->label('السعر السنوي الأساسي')
                            ->numeric()
                            ->prefix('ج.م')
                            ->required(),
                        TextInput::make('yearly_discount_percentage')
                            ->label('نسبة الخصم السنوي')
                            ->numeric()
                            ->suffix('%')
                            ->default(0),
                    ])->columns(2),

                Section::make('الحدود والمميزات')
                    ->schema([
                        TextInput::make('max_students')
                            ->label('أقصى عدد للطلاب')
                            ->numeric()
                            ->default(0)
                            ->helperText('استخدم 0 لعدد غير محدود')
                            ->required(),
                        TextInput::make('storage_limit_gb')
                            ->label('مساحة التخزين (GB)')
                            ->numeric()
                            ->default(0)
                            ->required(),
                        Repeater::make('features')
                            ->label('المميزات')
                            ->schema([
                                TextInput::make('feature')
                                    ->label('الميزة')
                                    ->required(),
                            ])
                            ->columnSpanFull()
                            ->createItemButtonLabel('إضافة ميزة'),
                    ])->columns(2),

                Section::make('الإعدادات الإضافية')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('نشطة')
                            ->default(true),
                        Toggle::make('is_popular')
                            ->label('الباقة الأكثر رواجاً')
                            ->default(false),
                        TextInput::make('sort_order')
                            ->label('ترتيب العرض')
                            ->numeric()
                            ->default(0),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name_ar')
                    ->label('الاسم (عربي)')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('price')
                    ->label('السعر الشهري')
                    ->money('EGP')
                    ->sortable(),
                TextColumn::make('yearly_price')
                    ->label('السعر السنوي')
                    ->money('EGP')
                    ->sortable(),
                TextColumn::make('max_students')
                    ->label('الطلاب')
                    ->formatStateUsing(fn ($state) => $state == 0 ? 'غير محدود' : $state),
                TextColumn::make('storage_limit_gb')
                    ->label('المساحة')
                    ->suffix(' GB'),
                IconColumn::make('is_active')
                    ->label('نشطة')
                    ->boolean(),
                IconColumn::make('is_popular')
                    ->label('رائجة')
                    ->boolean(),
                TextColumn::make('sort_order')
                    ->label('الترتيب')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('الحالة النشطة'),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('sort_order', 'asc');
    }

    public static function getPages(): array
    {
        return [
            'index' => PricingPackageResource\Pages\ListPricingPackages::route('/'),
            'create' => PricingPackageResource\Pages\CreatePricingPackage::route('/create'),
            'edit' => PricingPackageResource\Pages\EditPricingPackage::route('/{record}/edit'),
        ];
    }
}
