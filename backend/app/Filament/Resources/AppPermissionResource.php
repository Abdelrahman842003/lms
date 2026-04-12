<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use Spatie\Permission\Models\Permission;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AppPermissionResource extends BaseResource
{
    protected static ?string $model = Permission::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-key';

    protected static ?int $navigationSort = 3;

    protected static ?string $modelLabel = 'صلاحية تطبيق';

    protected static ?string $pluralModelLabel = 'صلاحيات التطبيق';

    protected static ?string $slug = 'app-permissions';

    public static function getNavigationGroup(): ?string
    {
        return 'الصلاحيات والأدوار';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('معلومات الصلاحية')
                    ->schema([
                        TextInput::make('name')
                            ->label('اسم الصلاحية')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('مثال: إدارة الطلاب'),

                        TextInput::make('feature_key')
                            ->label('المفتاح الثابت (Feature Key)')
                            ->helperText('لا تقم بتغيير هذا الحقل إلا إذا كنت متأكداً، فهو يربط الكود بالاسم.')
                            ->maxLength(255),

                        Select::make('guard_name')
                            ->label('نوع المستخدم (Guard)')
                            ->options([
                                'secretary' => 'سكرتير (Secretary)',
                                'student' => 'طالب (Student)',
                            ])
                            ->required()
                            ->default('secretary'),
                    ])
                    ->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('feature_key')
                    ->label('المفتاح (Key)')
                    ->searchable()
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('guard_name')
                    ->label('Guard')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'secretary' => 'warning',
                        'student' => 'success',
                        default => 'gray',
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('guard_name')
                    ->label('Guard')
                    ->options([
                        'secretary' => 'Secretary',
                        'student' => 'Student',
                    ]),
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
            ->defaultSort('created_at', 'desc');
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereIn('guard_name', ['secretary', 'student']);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\AppPermissionResource\Pages\ListAppPermissions::route('/'),
            'create' => \App\Filament\Resources\AppPermissionResource\Pages\CreateAppPermission::route('/create'),
            'edit' => \App\Filament\Resources\AppPermissionResource\Pages\EditAppPermission::route('/{record}/edit'),
        ];
    }
}
