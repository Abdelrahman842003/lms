<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Auth\Enums\TeacherStatus;
use App\Domains\Auth\Models\Teacher;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\DatePicker;
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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class TeacherResource extends BaseResource
{
    protected static ?string $model = Teacher::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?int $navigationSort = 3;

    protected static ?string $modelLabel = 'معلم';

    protected static ?string $pluralModelLabel = 'المعلمون';

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
                        TextInput::make('name')
                            ->label('الاسم')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم المعلم'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->required()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),
                    ])
                    ->columns(2),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        TextInput::make('subject')
                            ->label('التخصص / المادة')
                            ->maxLength(255)
                            ->placeholder('مثال: الرياضيات، الفيزياء'),

                        Textarea::make('bio')
                            ->label('نبذة عن المعلم')
                            ->rows(3)
                            ->placeholder('أدخل نبذة قصيرة عن المعلم')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('الصورة الشخصية')
                    ->schema([
                        FileUpload::make('avatar_key')
                            ->label('الصورة الشخصية')
                            ->image()
                            ->directory('teachers/avatars')
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

                Section::make('حالة المعلم')
                    ->schema([
                        Select::make('status')
                            ->label('الحالة')
                            ->options([
                                'active' => 'نشط',
                                'suspended' => 'موقوف',
                                'pending' => 'معلق',
                            ])
                            ->default('pending')
                            ->required(),

                        Toggle::make('is_independent_active')
                            ->label('نشط كمعلم مستقل')
                            ->default(false)
                            ->helperText('يمكن للمعلم العمل كمعلم مستقل خارج الأكاديميات'),
                    ])
                    ->columns(2),

                Section::make('الأكاديميات')
                    ->schema([
                        Select::make('academies')
                            ->label('الأكاديميات')
                            ->relationship('academies', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->placeholder('اختر الأكاديميات'),
                    ]),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        Select::make('plan_type')
                            ->label('نوع الخطة')
                            ->options([
                                'free' => 'مجاني',
                                'basic' => 'أساسي',
                                'pro' => 'احترافي',
                            ])
                            ->default('free'),

                        DatePicker::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
                            ->placeholder('اختر التاريخ'),

                        Toggle::make('is_unlimited_students')
                            ->label('طلاب غير محدودين')
                            ->default(false),

                        TextInput::make('plan_max_students')
                            ->label('الحد الأقصى للطلاب')
                            ->numeric()
                            ->default(50)
                            ->visible(fn ($get) => ! $get('is_unlimited_students')),

                        TextInput::make('subscription_fee')
                            ->label('رسوم الاشتراك')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0),

                        TextInput::make('paid_amount')
                            ->label('المبلغ المدفوع')
                            ->numeric()
                            ->prefix('ج.م')
                            ->default(0),
                    ])
                    ->columns(2),
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

                Tables\Columns\TextColumn::make('subject')
                    ->label('التخصص')
                    ->searchable()
                    ->sortable()
                    ->placeholder('غير محدد')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('academies.name')
                    ->label('الأكاديميات')
                    ->badge()
                    ->separator(',')
                    ->limitList(2)
                    ->expandableLimitedList()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('activeEnrollments_count')
                    ->label('عدد الطلاب')
                    ->counts('activeEnrollments')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'suspended' => 'danger',
                        'pending' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active' => 'نشط',
                        'suspended' => 'موقوف',
                        'pending' => 'معلق',
                        default => $state,
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options([
                        'active' => 'نشط',
                        'suspended' => 'موقوف',
                        'pending' => 'معلق',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\SelectFilter::make('academies')
                    ->label('الأكاديمية')
                    ->relationship('academies', 'name')
                    ->preload()
                    ->searchable(),

                Tables\Filters\TernaryFilter::make('is_independent_active')
                    ->label('معلم مستقل')
                    ->placeholder('الكل')
                    ->trueLabel('نشط كمستقل')
                    ->falseLabel('غير نشط كمستقل'),
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                Action::make('toggleActive')
                    ->label(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'إلغاء التنشيط' : 'تنشيط')
                    ->icon(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'heroicon-m-x-circle' : 'heroicon-m-check-circle')
                    ->color(fn (Teacher $record): string => $record->status === TeacherStatus::ACTIVE ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(function (Teacher $record): void {
                        $record->update([
                            'status' => $record->status === TeacherStatus::ACTIVE ? 'suspended' : 'active',
                        ]);
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
            ->defaultSort('created_at', 'desc')
            ->emptyStateHeading('لا يوجد معلمون')
            ->emptyStateDescription('قم بإنشاء معلم جديد للبدء')
            ->emptyStateIcon('heroicon-o-academic-cap');
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
            'index' => \App\Filament\Resources\TeacherResource\Pages\ListTeachers::route('/'),
            'create' => \App\Filament\Resources\TeacherResource\Pages\CreateTeacher::route('/create'),
            'edit' => \App\Filament\Resources\TeacherResource\Pages\EditTeacher::route('/{record}/edit'),
            'view' => \App\Filament\Resources\TeacherResource\Pages\ViewTeacher::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
