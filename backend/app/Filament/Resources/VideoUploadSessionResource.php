<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Videos\Models\VideoUploadSession;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class VideoUploadSessionResource extends BaseResource
{
    protected static ?string $model = VideoUploadSession::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-arrow-up-tray';

    protected static ?int $navigationSort = 21;

    protected static ?string $modelLabel = 'جلسة رفع فيديو';

    protected static ?string $pluralModelLabel = 'جلسات رفع الفيديوهات';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المحتوى';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('بيانات الجلسة')->schema([
                TextInput::make('id')->label('Session ID')->disabled(),
                TextInput::make('video_id')->label('Video ID')->disabled(),
                TextInput::make('status')->label('الحالة')->disabled(),
                TextInput::make('object_key')->label('Object Key')->disabled(),
                TextInput::make('declared_filename')->label('اسم الملف')->disabled(),
                TextInput::make('declared_mime')->label('MIME Type')->disabled(),
                TextInput::make('declared_size_bytes')->label('الحجم (bytes)')->disabled(),
                TextInput::make('total_parts')->label('إجمالي الأجزاء')->disabled(),
                TextInput::make('initiator_ip')->label('IP المُبادر')->disabled(),
                TextInput::make('abort_reason')->label('سبب الإلغاء')->disabled(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('Session ID')
                    ->copyable()
                    ->limit(12)
                    ->searchable(),

                Tables\Columns\TextColumn::make('video.title')
                    ->label('الفيديو')
                    ->limit(35)
                    ->searchable(),

                Tables\Columns\TextColumn::make('uploader_type')
                    ->label('نوع الرافع')
                    ->badge()
                    ->formatStateUsing(fn ($state) => match (true) {
                        str_contains((string) $state, 'Teacher') => 'معلم',
                        str_contains((string) $state, 'Academy') => 'أكاديمية',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (VideoUploadSessionStatus $state): string => match ($state) {
                        VideoUploadSessionStatus::COMPLETED      => 'success',
                        VideoUploadSessionStatus::UPLOADING,
                        VideoUploadSessionStatus::PENDING_UPLOAD,
                        VideoUploadSessionStatus::COMPLETING     => 'warning',
                        VideoUploadSessionStatus::ABORTED        => 'gray',
                        VideoUploadSessionStatus::FAILED         => 'danger',
                    })
                    ->formatStateUsing(fn (VideoUploadSessionStatus $state): string => match ($state) {
                        VideoUploadSessionStatus::PENDING_UPLOAD => 'في الانتظار',
                        VideoUploadSessionStatus::UPLOADING      => 'جاري الرفع',
                        VideoUploadSessionStatus::COMPLETING     => 'جاري الإكمال',
                        VideoUploadSessionStatus::COMPLETED      => 'مكتملة',
                        VideoUploadSessionStatus::ABORTED        => 'ملغاة',
                        VideoUploadSessionStatus::FAILED         => 'فاشلة',
                    }),

                Tables\Columns\TextColumn::make('declared_filename')
                    ->label('اسم الملف')
                    ->limit(30),

                Tables\Columns\TextColumn::make('declared_size_bytes')
                    ->label('الحجم')
                    ->formatStateUsing(fn ($state) => $state
                        ? number_format((int) $state / 1048576, 1) . ' MB'
                        : '-'),

                Tables\Columns\TextColumn::make('total_parts')
                    ->label('الأجزاء'),

                Tables\Columns\TextColumn::make('initiator_ip')
                    ->label('IP')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('initiated_at')
                    ->label('بدأت في')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('completed_at')
                    ->label('اكتملت في')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options(collect(VideoUploadSessionStatus::cases())
                        ->mapWithKeys(fn ($s) => [$s->value => match ($s) {
                            VideoUploadSessionStatus::PENDING_UPLOAD => 'في الانتظار',
                            VideoUploadSessionStatus::UPLOADING      => 'جاري الرفع',
                            VideoUploadSessionStatus::COMPLETING     => 'جاري الإكمال',
                            VideoUploadSessionStatus::COMPLETED      => 'مكتملة',
                            VideoUploadSessionStatus::ABORTED        => 'ملغاة',
                            VideoUploadSessionStatus::FAILED         => 'فاشلة',
                        }])
                        ->all()),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                ViewAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\VideoUploadSessionResource\Pages\ListVideoUploadSessions::route('/'),
            'view'  => \App\Filament\Resources\VideoUploadSessionResource\Pages\ViewVideoUploadSession::route('/{record}'),
        ];
    }

    public static function canCreate(): bool
    {
        return false; // Sessions are created programmatically only
    }
}
