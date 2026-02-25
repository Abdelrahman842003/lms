<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Enums\StudentGender;
use App\Enums\StudentEducationType;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Academy;
use App\Models\Guardian;
use App\Models\Teacher;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class StudentResource extends BaseResource
{
    protected static ?string $model = Student::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'إدارة المستخدمين';

    protected static ?int $navigationSort = 4;

    protected static ?string $modelLabel = 'طالب';

    protected static ?string $pluralModelLabel = 'الطلاب';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('name')
                            ->label('الاسم')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم الطالب'),

                        TextInput::make('email')
                            ->label('البريد الإلكتروني')
                            ->email()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('student@example.com'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),
                    ])
                    ->columns(3),

                Section::make('معلومات ولي الأمر')
                    ->schema([
                        TextInput::make('parent_phone')
                            ->label('هاتف ولي الأمر')
                            ->tel()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),

                        TextInput::make('parent_email')
                            ->label('بريد ولي الأمر')
                            ->email()
                            ->maxLength(255)
                            ->placeholder('parent@example.com'),

                        Select::make('guardian_id')
                            ->label('ولي الأمر')
                            ->relationship('guardian', 'name')
                            ->searchable()
                            ->preload()
                            ->placeholder('اختر ولي الأمر'),
                    ])
                    ->columns(3),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        Select::make('academy_id')
                            ->label('الأكاديمية')
                            ->relationship('academies', 'name')
                            ->searchable()
                            ->preload()
                            ->placeholder('اختر الأكاديمية'),

                        Select::make('grade_id')
                            ->label('الصف الدراسي')
                            ->relationship('grades', 'name')
                            ->searchable()
                            ->preload()
                            ->placeholder('اختر الصف')
                            ->live(),

                        Select::make('group_id')
                            ->label('المجموعة')
                            ->relationship(
                                name: 'groups',
                                titleAttribute: 'name',
                                modifyQueryUsing: fn (Builder $query, \Filament\Forms\Get $get) =>
                                    $query->when($get('grade_id'), fn ($q, $gradeId) =>
                                        $q->where('grade_id', $gradeId)
                                    )
                            )
                            ->searchable()
                            ->preload()
                            ->placeholder('اختر المجموعة'),
                    ])
                    ->columns(3),

                Section::make('المعلمون')
                    ->schema([
                        Select::make('teachers')
                            ->label('المعلمون')
                            ->relationship('teachers', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->placeholder('اختر المعلمين'),
                    ]),

                Section::make('المعلومات الشخصية')
                    ->schema([
                        Select::make('gender')
                            ->label('الجنس')
                            ->options([
                                'male' => 'ذكر',
                                'female' => 'أنثى',
                            ])
                            ->native(false),

                        Select::make('education_type')
                            ->label('نوع التعليم')
                            ->options([
                                'regular' => 'عادي',
                                'private' => 'خاص',
                                'homeschool' => 'تعليم منزلي',
                            ])
                            ->native(false),

                        Textarea::make('location')
                            ->label('الموقع')
                            ->rows(2)
                            ->placeholder('أدخل موقع الطالب')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('الصورة الشخصية')
                    ->schema([
                        FileUpload::make('avatar_key')
                            ->label('الصورة الشخصية')
                            ->image()
                            ->directory('students/avatars')
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

                Section::make('الحالة')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('نشط')
                            ->default(true)
                            ->helperText('تحديد ما إذا كان الطالب نشطاً أم لا'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar_key')
                    ->label('الصورة')
                    ->circular()
                    ->defaultImageUrl(url('/images/default-avatar.png'))
                    ->toggleable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('email')
                    ->label('البريد الإلكتروني')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->icon('heroicon-m-envelope')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('phone')
                    ->label('الهاتف')
                    ->searchable()
                    ->copyable()
                    ->icon('heroicon-m-phone')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('grades.name')
                    ->label('الصف')
                    ->badge()
                    ->separator(',')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('groups.name')
                    ->label('المجموعة')
                    ->badge()
                    ->separator(',')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('academies.name')
                    ->label('الأكاديمية')
                    ->badge()
                    ->separator(',')
                    ->limitList(2)
                    ->expandableLimitedList()
                    ->toggleable(),

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
                Tables\Filters\SelectFilter::make('academies')
                    ->label('الأكاديمية')
                    ->relationship('academies', 'name')
                    ->preload()
                    ->searchable(),

                Tables\Filters\SelectFilter::make('grades')
                    ->label('الصف')
                    ->relationship('grades', 'name')
                    ->preload()
                    ->searchable(),

                Tables\Filters\SelectFilter::make('groups')
                    ->label('المجموعة')
                    ->relationship('groups', 'name')
                    ->preload()
                    ->searchable(),

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

                Tables\Actions\Action::make('toggleActive')
                    ->label(fn (Student $record): string => $record->is_active ? 'إلغاء التنشيط' : 'تنشيط')
                    ->icon(fn (Student $record): string => $record->is_active ? 'heroicon-m-x-circle' : 'heroicon-m-check-circle')
                    ->color(fn (Student $record): string => $record->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(function (Student $record): void {
                        $record->update(['is_active' => ! $record->is_active]);
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
            ->defaultSort('created_at', 'desc')
            ->emptyStateHeading('لا يوجد طلاب')
            ->emptyStateDescription('قم بإنشاء طالب جديد للبدء')
            ->emptyStateIcon('heroicon-o-users');
    }

    public static function getRelations(): array
    {
        return [
            // Relations can be added here for exams, attendance, payments
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListStudents::class,
            'create' => Pages\CreateStudent::class,
            'edit' => Pages\EditStudent::class,
            'view' => Pages\ViewStudent::class,
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
