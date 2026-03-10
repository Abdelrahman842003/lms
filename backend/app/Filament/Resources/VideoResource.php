<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\VideoLifecycleService;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class VideoResource extends BaseResource
{
    protected static ?string $model = Video::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-film';

    protected static ?int $navigationSort = 20;

    protected static ?string $modelLabel = 'فيديو';

    protected static ?string $pluralModelLabel = 'الفيديوهات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المحتوى';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('بيانات الفيديو')
                    ->schema([
                        TextInput::make('title')
                            ->label('العنوان')
                            ->required()
                            ->maxLength(255),

                        Textarea::make('description')
                            ->label('الوصف')
                            ->rows(4),

                        Select::make('status')
                            ->label('الحالة')
                            ->options(collect(VideoStatus::cases())->mapWithKeys(fn (VideoStatus $status) => [
                                $status->value => $status->value,
                            ])->all())
                            ->required(),

                        Select::make('grade_id')
                            ->label('الصف')
                            ->relationship('grade', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Select::make('groups')
                            ->label('المجموعات')
                            ->relationship('groups', 'name')
                            ->multiple()
                            ->searchable()
                            ->preload()
                            ->required(),

                        DateTimePicker::make('scheduled_at')
                            ->label('موعد النشر المجدول')
                            ->seconds(false),

                        DateTimePicker::make('published_at')
                            ->label('تاريخ النشر')
                            ->seconds(false),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('العنوان')
                    ->searchable()
                    ->sortable()
                    ->limit(40)
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('owner_type')
                    ->label('نوع المالك')
                    ->badge()
                    ->getStateUsing(fn ($record) => $record->getRawOriginal('owner_type'))
                    ->formatStateUsing(fn ($state): string => match ($state) {
                        'independent_teacher' => 'مدرس مستقل',
                        'academy'             => 'أكاديمية',
                        default               => $state ?? '-',
                    })
                    ->color(fn ($state): string => $state === 'academy' ? 'info' : 'success'),

                Tables\Columns\TextColumn::make('academy.name')
                    ->label('الأكاديمية')
                    ->placeholder('-')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('teacher_reference_name')
                    ->label('المدرس المرجعي')
                    ->placeholder('-')
                    ->searchable(),

                Tables\Columns\TextColumn::make('grade.name')
                    ->label('الصف')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->getStateUsing(fn ($record) => $record->getRawOriginal('status'))
                    ->formatStateUsing(fn ($state): string => match ($state) {
                        'published' => 'منشور',
                        'scheduled' => 'مجدول',
                        'failed'    => 'فشل',
                        default     => $state ?? '-',
                    })
                    ->color(fn ($state): string => match ($state) {
                        'published' => 'success',
                        'scheduled' => 'warning',
                        'failed'    => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('processing_status')
                    ->label('حالة المعالجة')
                    ->badge()
                    ->getStateUsing(fn ($record) => $record->getRawOriginal('processing_status'))
                    ->formatStateUsing(fn ($state): string => match ($state) {
                        'succeeded' => 'مكتمل',
                        'running'   => 'جاري',
                        'failed'    => 'فشل',
                        'pending'   => 'انتظار',
                        default     => $state ?? '-',
                    })
                    ->color(fn ($state): string => match ($state) {
                        'succeeded' => 'success',
                        'running'   => 'warning',
                        'failed'    => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('watch_progresses_count')
                    ->counts('watchProgresses')
                    ->label('عدد المشاهدات'),

                Tables\Columns\TextColumn::make('completed_count')
                    ->label('مكتمل')
                    ->state(function (Video $record): int {
                        return $record->watchProgresses()->where('status', 'completed')->count();
                    }),

                Tables\Columns\TextColumn::make('likes_count')
                    ->counts('likes')
                    ->label('لايكات'),

                Tables\Columns\TextColumn::make('comments_count')
                    ->counts('comments')
                    ->label('تعليقات'),

                Tables\Columns\TextColumn::make('attachments_count')
                    ->counts('attachments')
                    ->label('مرفقات'),

                Tables\Columns\TextColumn::make('published_at')
                    ->label('تاريخ النشر')
                    ->dateTime('Y-m-d H:i')
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('owner_type')
                    ->label('نوع المالك')
                    ->options([
                        'independent_teacher' => 'مدرس مستقل',
                        'academy' => 'أكاديمية',
                    ]),

                Tables\Filters\SelectFilter::make('grade_id')
                    ->label('الصف')
                    ->relationship('grade', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\SelectFilter::make('groups')
                    ->label('المجموعة')
                    ->relationship('groups', 'name')
                    ->searchable()
                    ->preload(),

                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options(collect(VideoStatus::cases())->mapWithKeys(fn (VideoStatus $status) => [
                        $status->value => $status->value,
                    ])->all()),

                Tables\Filters\Filter::make('published_range')
                    ->label('تاريخ النشر')
                    ->form([
                        DateTimePicker::make('published_from')->label('من'),
                        DateTimePicker::make('published_to')->label('إلى'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when($data['published_from'] ?? null, fn (Builder $q, $date): Builder => $q->where('published_at', '>=', $date))
                            ->when($data['published_to'] ?? null, fn (Builder $q, $date): Builder => $q->where('published_at', '<=', $date));
                    }),
            ])
            ->actions([
                ViewAction::make()->label('عرض'),
                EditAction::make()->label('تعديل'),
                DeleteAction::make()->label('حذف'),
                Action::make('force_delete')
                    ->label('حذف كامل')
                    ->icon('heroicon-m-trash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function (Video $record): void {
                        app(VideoLifecycleService::class)->forceDelete($record, auth()->user());
                    }),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()->label('حذف المحدد'),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\VideoResource\Pages\ListVideos::route('/'),
            'view' => \App\Filament\Resources\VideoResource\Pages\ViewVideo::route('/{record}'),
            'edit' => \App\Filament\Resources\VideoResource\Pages\EditVideo::route('/{record}/edit'),
        ];
    }
}
