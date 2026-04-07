<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Gamification\Models\GamificationLevel;
use App\Filament\Resources\BaseResource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Illuminate\Database\Eloquent\Builder;

class GamificationLevelResource extends BaseResource
{
    protected static ?string $model = GamificationLevel::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-trophy';

    protected static ?string $modelLabel = 'مستوى';

    protected static ?string $pluralModelLabel = 'المستويات';

    protected static ?string $navigationLabel = 'مستويات الإنجازات';

    protected static string | \UnitEnum | null $navigationGroup = 'الإعدادات';

    protected static ?int $navigationSort = 15;

    protected static ?string $slug = 'gamification-levels';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('بيانات المستوى')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('اسم المستوى')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('مثال: حكيم'),

                    Forms\Components\TextInput::make('description')
                        ->label('الوصف')
                        ->maxLength(255)
                        ->placeholder('وصف مختصر للمستوى'),

                    Forms\Components\TextInput::make('icon')
                        ->label('الأيقونة')
                        ->maxLength(50)
                        ->placeholder('مثال: 🏛️'),

                    Forms\Components\ColorPicker::make('color')
                        ->label('اللون'),

                    Forms\Components\TextInput::make('min_points')
                        ->label('الحد الأدنى للنقاط')
                        ->required()
                        ->numeric()
                        ->minValue(0),

                    Forms\Components\TextInput::make('max_points')
                        ->label('الحد الأقصى للنقاط')
                        ->numeric()
                        ->minValue(0)
                        ->helperText('اتركه فارغاً للمستوى الأخير (بلا حد أقصى)'),

                    Forms\Components\TextInput::make('sort_order')
                        ->label('الترتيب')
                        ->required()
                        ->numeric()
                        ->minValue(1)
                        ->maxValue(100)
                        ->unique(ignoreRecord: true),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('الترتيب')
                    ->sortable()
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('icon')
                    ->label('الأيقونة')
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('name')
                    ->label('اسم المستوى')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('description')
                    ->label('الوصف')
                    ->limit(30),

                Tables\Columns\ColorColumn::make('color')
                    ->label('اللون'),

                Tables\Columns\TextColumn::make('min_points')
                    ->label('الحد الأدنى')
                    ->numeric()
                    ->sortable(),

                Tables\Columns\TextColumn::make('max_points')
                    ->label('الحد الأقصى')
                    ->numeric()
                    ->placeholder('∞')
                    ->sortable(),

                Tables\Columns\TextColumn::make('students_count')
                    ->label('عدد الطلاب')
                    ->counts('students')
                    ->sortable(),
            ])
            ->defaultSort('sort_order')
            ->actions([
                EditAction::make()
                    ->label('تعديل'),
                DeleteAction::make()
                    ->label('حذف'),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->label('حذف المحدد'),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => GamificationLevelResource\Pages\ListGamificationLevels::route('/'),
            'create' => GamificationLevelResource\Pages\CreateGamificationLevel::route('/create'),
            'edit' => GamificationLevelResource\Pages\EditGamificationLevel::route('/{record}/edit'),
        ];
    }
}
