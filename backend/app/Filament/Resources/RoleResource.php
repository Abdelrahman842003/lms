<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Hidden;
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
use Illuminate\Support\Collection;

class RoleResource extends BaseResource
{
    protected static ?string $model = Role::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-shield-check';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'دور';

    protected static ?string $pluralModelLabel = 'الأدوار';

    public static function getNavigationGroup(): ?string
    {
        return 'الصلاحيات والأدوار';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('معلومات الدور')
                    ->schema([
                        TextInput::make('name')
                            ->label('اسم الدور')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('مثال: admin, editor, viewer')
                            ->disabled(fn (string $operation, $record): bool =>
                                $operation === 'edit' && in_array($record?->name, ['super-admin', 'admin'])
                            ),

                        Hidden::make('guard_name')
                            ->default('admin'),
                    ])
                    ->columns(2),

                Section::make('الصلاحيات')
                    ->schema([
                        static::getPermissionsCheckboxList(),
                    ]),
            ]);
    }

    protected static function getPermissionsCheckboxList(): CheckboxList
    {
        $permissionsByGroup = Permission::orderBy('name')
            ->get()
            ->groupBy(function ($permission) {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'general';
            });

        $options = [];
        $groups = [];

        foreach ($permissionsByGroup as $group => $permissions) {
            $groupKey = $group;
            $groups[$groupKey] = static::getArabicGroupName($group);

            foreach ($permissions as $permission) {
                $options[$permission->id] = $permission->name;
            }
        }

        return CheckboxList::make('permissions')
            ->label('الصلاحيات')
            ->relationship('permissions', 'name')
            ->options($options)
            ->columns(3)
            ->gridDirection('row')
            ->bulkToggleable();
    }

    protected static function getArabicGroupName(string $group): string
    {
        return match ($group) {
            'academy' => 'الأكاديميات',
            'teacher' => 'المعلمون',
            'student' => 'الطلاب',
            'secretary' => 'السكرتيريون',
            'admin' => 'المديرون',
            'grade' => 'الصفوف الدراسية',
            'group' => 'المجموعات',
            'lecture' => 'المحاضرات',
            'exam' => 'الاختبارات',
            'question' => 'الأسئلة',
            'payment' => 'المدفوعات',
            'report' => 'التقارير',
            'subscription' => 'الاشتراكات',
            'setting' => 'الإعدادات',
            'role' => 'الأدوار',
            'permission' => 'الصلاحيات',
            'notification' => 'الإشعارات',
            'user' => 'المستخدمون',
            default => $group,
        };
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'super-admin' => 'مدير النظام (Super Admin)',
                        'admin' => 'مدير (Admin)',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('permissions_count')
                    ->label('عدد الصلاحيات')
                    ->counts('permissions')
                    ->sortable(),

                Tables\Columns\TextColumn::make('guard_name')
                    ->label('Guard')
                    ->badge()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                // No specific filters needed for roles
            ])
            ->actions([
                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                DeleteAction::make()
                    ->label('حذف')
                    ->icon('heroicon-m-trash')
                    ->requiresConfirmation()
                    ->disabled(fn (Role $record): bool =>
                        in_array($record->name, ['super-admin', 'admin'])
                    ),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->label('حذف المحدد')
                        ->requiresConfirmation(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->emptyStateHeading('لا يوجد أدوار')
            ->emptyStateDescription('قم بإنشاء دور جديد للبدء')
            ->emptyStateIcon('heroicon-o-shield-check');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\RoleResource\Pages\ListRoles::route('/'),
            'create' => \App\Filament\Resources\RoleResource\Pages\CreateRole::route('/create'),
            'edit' => \App\Filament\Resources\RoleResource\Pages\EditRole::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('guard_name', 'admin');
    }
}