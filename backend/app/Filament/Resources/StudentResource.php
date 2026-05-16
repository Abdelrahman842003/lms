<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Auth\Enums\StudentGender;
use App\Domains\Auth\Enums\StudentEducationType;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Teacher;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Schema;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Infolists\Infolist;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\Section as InfolistSection;
use Filament\Infolists\Components\RepeatableEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class StudentResource extends BaseResource
{
    protected static ?string $model = Student::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-users';

    protected static ?int $navigationSort = 4;

    protected static ?string $modelLabel = 'طالب';

    protected static ?string $pluralModelLabel = 'الطلاب';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المستخدمين';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->required()
                            ->maxLength(11)
                            ->minLength(11)
                            ->placeholder('01xxxxxxxxx')
                            ->helperText(function (?string $state): string {
                                if ($state && strlen($state) === 11) {
                                    $existing = Student::where('phone', $state)->first();
                                    if ($existing) {
                                        return '⚠️ هذا الطالب موجود بالفعل: ' . $existing->name;
                                    }
                                    return '✅ رقم الهاتف غير مسجل — يمكنك إضافة طالب جديد';
                                }
                                return 'أدخل 11 رقماً — سيتم التحقق تلقائياً';
                            })
                            ->live(debounce: 500),

                        TextInput::make('name')
                            ->label('الاسم')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم الطالب'),
                    ])
                    ->columns(2),

                Section::make('معلومات ولي الأمر')
                    ->schema([
                        TextInput::make('parent_phone')
                            ->label('هاتف ولي الأمر')
                            ->tel()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx')
                            ->helperText('لو رقم ولي الأمر جديد، سيتم إنشاء حساب بنفس كلمة مرور الطالب تلقائياً.'),
                    ])
                    ->columns(1),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        Select::make('academy_id')
                            ->label('الأكاديمية')
                            ->options(fn () => Academy::pluck('name', 'id'))
                            ->searchable()
                            ->preload()
                            ->placeholder('اختر الأكاديمية')
                            ->dehydrated(false)
                            ->live()
                            ->afterStateUpdated(function (\Filament\Schemas\Components\Utilities\Set $set) {
                                $set('grade_id', null);
                                $set('group_id', null);
                            }),

                        Select::make('teacher_id')
                            ->label('المعلم')
                            ->options(function (\Filament\Schemas\Components\Utilities\Get $get) {
                                $academyId = $get('academy_id');
                                if ($academyId) {
                                    $academy = Academy::find($academyId);
                                    if ($academy) {
                                        return $academy->teachers()->pluck('teachers.name', 'teachers.id');
                                    }
                                }
                                return Teacher::pluck('name', 'id');
                            })
                            ->searchable()
                            ->preload()
                            ->placeholder(fn (\Filament\Schemas\Components\Utilities\Get $get) => $get('academy_id') ? 'اختر المعلم' : 'اختر الأكاديمية أولاً')
                            ->disabled(fn (\Filament\Schemas\Components\Utilities\Get $get) => ! $get('academy_id'))
                            ->dehydrated(false)
                            ->live()
                            ->afterStateUpdated(function (\Filament\Schemas\Components\Utilities\Set $set) {
                                $set('grade_id', null);
                                $set('group_id', null);
                            }),

                        Select::make('grade_id')
                            ->label('الصف الدراسي')
                            ->options(function (\Filament\Schemas\Components\Utilities\Get $get) {
                                $teacherId = $get('teacher_id');
                                if ($teacherId) {
                                    return Grade::where('teacher_id', $teacherId)->pluck('name', 'id');
                                }
                                return [];
                            })
                            ->searchable()
                            ->preload()
                            ->placeholder(fn (\Filament\Schemas\Components\Utilities\Get $get) => $get('teacher_id') ? 'اختر الصف' : 'اختر المعلم أولاً')
                            ->disabled(fn (\Filament\Schemas\Components\Utilities\Get $get) => ! $get('teacher_id'))
                            ->dehydrated(false)
                            ->live()
                            ->afterStateUpdated(fn (\Filament\Schemas\Components\Utilities\Set $set) => $set('group_id', null)),

                        Select::make('group_id')
                            ->label('المجموعة')
                            ->options(function (\Filament\Schemas\Components\Utilities\Get $get) {
                                $gradeId = $get('grade_id');
                                if ($gradeId) {
                                    return Group::where('grade_id', $gradeId)->pluck('name', 'id');
                                }
                                return [];
                            })
                            ->searchable()
                            ->preload()
                            ->placeholder(fn (\Filament\Schemas\Components\Utilities\Get $get) => $get('grade_id') ? 'اختر المجموعة' : 'اختر الصف أولاً')
                            ->disabled(fn (\Filament\Schemas\Components\Utilities\Get $get) => ! $get('grade_id'))
                            ->dehydrated(false),
                    ])
                    ->columns(2),

                Section::make('المعلومات الشخصية')
                    ->schema([
                        Select::make('gender')
                            ->label('الجنس')
                            ->options([
                                'male'   => 'ذكر',
                                'female' => 'أنثى',
                            ])
                            ->native(false),

                        Select::make('education_type')
                            ->label('نوع التعليم')
                            ->options([
                                'general' => 'عام',
                                'azhar'   => 'أزهر',
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
                            ->autocomplete('new-password')
                            ->formatStateUsing(fn ($state) => null)
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->dehydrateStateUsing(fn ($state) => filled($state) ? $state : null)
                            ->dehydrated(fn ($state) => filled($state))
                            ->placeholder('أدخل كلمة المرور')
                            ->helperText(fn (string $operation): string => $operation === 'edit' ? 'اترك الحقل فارغاً إذا لم ترغب في تغيير كلمة المرور' : 'ستُستخدم نفس كلمة المرور لحساب ولي الأمر إذا كان جديداً.'),

                        TextInput::make('password_confirmation')
                            ->label('تأكيد كلمة المرور')
                            ->password()
                            ->revealable()
                            ->autocomplete('new-password')
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->same('password')
                            ->dehydrated(false)
                            ->placeholder('أعد إدخال كلمة المرور'),
                    ])
                    ->columns(2)
                    ->visible(fn (string $operation): bool => $operation === 'create' || (auth()->user()?->hasRole('super-admin') || auth()->user()?->hasRole('admin') || auth()->user()?->hasRole('filament-admin'))),
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

                Tables\Columns\TextColumn::make('phone')
                    ->label('الهاتف')
                    ->searchable()
                    ->copyable()
                    ->icon('heroicon-m-phone')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('teachers_count')
                    ->counts('teachers')
                    ->label('عدد المدرسين')
                    ->badge()
                    ->color('info')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('academies_count')
                    ->counts('academies')
                    ->label('عدد الأكاديميات')
                    ->badge()
                    ->color('warning')
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
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

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
            'index' => \App\Filament\Resources\StudentResource\Pages\ListStudents::route('/'),
            'create' => \App\Filament\Resources\StudentResource\Pages\CreateStudent::route('/create'),
            'edit' => \App\Filament\Resources\StudentResource\Pages\EditStudent::route('/{record}/edit'),
            'view' => \App\Filament\Resources\StudentResource\Pages\ViewStudent::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                InfolistSection::make('المعلومات الأساسية')
                    ->columns(3)
                    ->schema([
                        TextEntry::make('name')->label('الاسم'),
                        TextEntry::make('phone')->label('الهاتف'),
                        TextEntry::make('parent_phone')->label('هاتف ولي الأمر')->placeholder('لا يوجد'),
                        TextEntry::make('gender')->label('الجنس')
                            ->formatStateUsing(fn ($state) => $state === 'male' ? 'ذكر' : ($state === 'female' ? 'أنثى' : $state)),
                        TextEntry::make('education_type')->label('نوع التعليم')
                            ->formatStateUsing(fn ($state) => $state === 'general' ? 'عام' : ($state === 'azhar' ? 'أزهر' : $state)),
                        TextEntry::make('location')->label('الموقع')->placeholder('لا يوجد'),
                    ]),

                InfolistSection::make('تفاصيل الاشتراكات (المدرسين والأكاديميات)')
                    ->schema([
                        RepeatableEntry::make('enrollments')
                            ->label('')
                            ->schema([
                                TextEntry::make('teacher.name')
                                    ->label('المعلم')
                                    ->icon('heroicon-m-user')
                                    ->weight('bold')
                                    ->placeholder('غير محدد'),

                                TextEntry::make('academy.name')
                                    ->label('الأكاديمية')
                                    ->icon('heroicon-m-building-office')
                                    ->placeholder('مستقل'),

                                TextEntry::make('grade.name')
                                    ->label('الصف الدراسي')
                                    ->icon('heroicon-m-academic-cap')
                                    ->placeholder('غير محدد'),

                                TextEntry::make('group.name')
                                    ->label('المجموعة')
                                    ->icon('heroicon-m-user-group')
                                    ->placeholder('غير محدد'),

                                TextEntry::make('is_active')
                                    ->label('الحالة')
                                    ->badge()
                                    ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                                    ->formatStateUsing(fn (bool $state): string => $state ? 'نشط' : 'غير نشط'),
                            ])
                            ->columns(5)
                    ])
            ]);
    }
}
