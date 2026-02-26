<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Auth\Models\Academy;
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

class AcademyResource extends BaseResource
{
    protected static ?string $model = Academy::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-building-library';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'أكاديمية';

    protected static ?string $pluralModelLabel = 'الأكاديميات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المنصة';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextInput::make('name')
                            ->label('اسم الأكاديمية')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('أدخل اسم الأكاديمية'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->required()
                            ->maxLength(20)
                            ->placeholder('01xxxxxxxxx'),
                    ])
                    ->columns(2),

                Section::make('العنوان والموقع')
                    ->schema([
                        Textarea::make('address')
                            ->label('العنوان')
                            ->rows(3)
                            ->placeholder('أدخل عنوان الأكاديمية')
                            ->columnSpanFull(),
                    ]),

                Section::make('الشعار والصور')
                    ->schema([
                        FileUpload::make('logo_key')
                            ->label('شعار الأكاديمية')
                            ->image()
                            ->directory('academies/logos')
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

                Section::make('حالة الأكاديمية')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('نشط')
                            ->default(true)
                            ->helperText('تحديد ما إذا كانت الأكاديمية نشطة أم لا'),

                        Toggle::make('is_suspended')
                            ->label('موقوف')
                            ->default(false)
                            ->helperText('تحديد ما إذا كانت الأكاديمية موقوفة أم لا'),

                        Textarea::make('suspension_reason')
                            ->label('سبب الإيقاف')
                            ->rows(2)
                            ->placeholder('أدخل سبب الإيقاف إذا كان موقوفاً')
                            ->visible(fn ($get) => $get('is_suspended')),
                    ])
                    ->columns(2),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        Select::make('plan_type')
                            ->label('نوع الخطة')
                            ->options([
                                'free' => 'مجاني',
                                'basic' => 'أساسي',
                                'pro' => 'احترافي',
                                'enterprise' => 'مؤسسي',
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
                            ->default(100)
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

                        Textarea::make('billing_notes')
                            ->label('ملاحظات الفواتير')
                            ->rows(2)
                            ->placeholder('أي ملاحظات متعلقة بالفوترة'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('logo_key')
                    ->label('الشعار')
                    ->circular()
                    ->defaultImageUrl(url('/images/default-academy.png'))
                    ->toggleable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('اسم الأكاديمية')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('phone')
                    ->label('الهاتف')
                    ->searchable()
                    ->copyable()
                    ->icon('heroicon-m-phone')
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('نشط')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_suspended')
                    ->label('موقوف')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('plan_type')
                    ->label('الخطة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'free' => 'gray',
                        'basic' => 'info',
                        'pro' => 'warning',
                        'enterprise' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'free' => 'مجاني',
                        'basic' => 'أساسي',
                        'pro' => 'احترافي',
                        'enterprise' => 'مؤسسي',
                        default => $state,
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('plan_expires_at')
                    ->label('انتهاء الاشتراك')
                    ->date('Y-m-d')
                    ->sortable()
                    ->toggleable()
                    ->placeholder('غير محدد'),

                Tables\Columns\TextColumn::make('total_enrollments_count')
                    ->label('إجمالي التسجيلات')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('الحالة النشطة')
                    ->placeholder('الكل')
                    ->trueLabel('نشط فقط')
                    ->falseLabel('غير نشط فقط'),

                Tables\Filters\TernaryFilter::make('is_suspended')
                    ->label('حالة الإيقاف')
                    ->placeholder('الكل')
                    ->trueLabel('موقوف فقط')
                    ->falseLabel('غير موقوف فقط'),

                Tables\Filters\SelectFilter::make('plan_type')
                    ->label('نوع الخطة')
                    ->options([
                        'free' => 'مجاني',
                        'basic' => 'أساسي',
                        'pro' => 'احترافي',
                        'enterprise' => 'مؤسسي',
                    ])
                    ->multiple()
                    ->preload(),

                Tables\Filters\Filter::make('expired')
                    ->label('اشتراك منتهي')
                    ->query(fn (Builder $query): Builder => $query->where('plan_expires_at', '<', now()))
                    ->toggle(),
            ])
            ->actions([
                ViewAction::make()
                    ->label('عرض')
                    ->icon('heroicon-m-eye'),

                EditAction::make()
                    ->label('تعديل')
                    ->icon('heroicon-m-pencil-square'),

                Action::make('toggleSuspend')
                    ->label(fn (Academy $record): string => $record->is_suspended ? 'إلغاء الإيقاف' : 'إيقاف')
                    ->icon(fn (Academy $record): string => $record->is_suspended ? 'heroicon-m-play' : 'heroicon-m-pause')
                    ->color(fn (Academy $record): string => $record->is_suspended ? 'success' : 'warning')
                    ->requiresConfirmation()
                    ->modalHeading(fn (Academy $record): string => $record->is_suspended ? 'إلغاء إيقاف الأكاديمية' : 'إيقاف الأكاديمية')
                    ->modalDescription('هل أنت متأكد من هذا الإجراء؟')
                    ->action(function (Academy $record): void {
                        $record->update([
                            'is_suspended' => ! $record->is_suspended,
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
            ->emptyStateHeading('لا يوجد أكاديميات')
            ->emptyStateDescription('قم بإنشاء أكاديمية جديدة للبدء')
            ->emptyStateIcon('heroicon-o-building-library');
    }

    public static function getRelations(): array
    {
        return [
            // Relations can be added here if needed
        ];
    }

    public static function getWidgets(): array
    {
        return [
            \App\Filament\Resources\AcademyResource\Widgets\AcademyStatsWidget::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\AcademyResource\Pages\ListAcademies::route('/'),
            'create' => \App\Filament\Resources\AcademyResource\Pages\CreateAcademy::route('/create'),
            'edit' => \App\Filament\Resources\AcademyResource\Pages\EditAcademy::route('/{record}/edit'),
            'view' => \App\Filament\Resources\AcademyResource\Pages\ViewAcademy::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery();
    }
}
