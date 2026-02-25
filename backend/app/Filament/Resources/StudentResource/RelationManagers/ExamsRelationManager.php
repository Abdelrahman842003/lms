<?php

namespace App\Filament\Resources\StudentResource\RelationManagers;

use App\Enums\ExamAttemptStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ExamsRelationManager extends RelationManager
{
    protected static string $relationship = 'examAttempts';

    protected static ?string $title = 'Exam Attempts';

    protected static ?string $recordTitleAttribute = 'exam.title';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('exam_id')
                    ->relationship('exam', 'title')
                    ->required()
                    ->searchable()
                    ->preload(),

                TextInput::make('score')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100)
                    ->suffix('%'),

                Select::make('status')
                    ->options(ExamAttemptStatus::class)
                    ->default(ExamAttemptStatus::PENDING)
                    ->required(),

                DateTimePicker::make('started_at'),

                DateTimePicker::make('submitted_at'),

                Textarea::make('notes')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('exam.title')
            ->columns([
                Tables\Columns\TextColumn::make('exam.title')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold')
                    ->icon('heroicon-o-clipboard-document-list')
                    ->iconColor('primary'),

                Tables\Columns\TextColumn::make('exam.group.name')
                    ->label('Group')
                    ->searchable()
                    ->sortable()
                    ->placeholder('Individual Exam')
                    ->icon('heroicon-o-user-group'),

                Tables\Columns\TextColumn::make('score')
                    ->numeric(decimalPlaces: 2)
                    ->suffix('%')
                    ->sortable()
                    ->alignment('center')
                    ->color(fn ($state): string => match (true) {
                        $state === null => 'gray',
                        $state >= 90 => 'success',
                        $state >= 70 => 'info',
                        $state >= 50 => 'warning',
                        default => 'danger',
                    })
                    ->icon(fn ($state): ?string => match (true) {
                        $state === null => null,
                        $state >= 90 => 'heroicon-o-trophy',
                        $state >= 70 => 'heroicon-o-check-circle',
                        $state >= 50 => 'heroicon-o-exclamation-circle',
                        default => 'heroicon-o-x-circle',
                    }),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (ExamAttemptStatus $state): string => match ($state) {
                        ExamAttemptStatus::COMPLETED => 'success',
                        ExamAttemptStatus::IN_PROGRESS => 'warning',
                        ExamAttemptStatus::PENDING => 'info',
                        ExamAttemptStatus::ABSENT => 'danger',
                        ExamAttemptStatus::CANCELLED => 'gray',
                        default => 'gray',
                    })
                    ->icon(fn (ExamAttemptStatus $state): string => match ($state) {
                        ExamAttemptStatus::COMPLETED => 'heroicon-o-check-circle',
                        ExamAttemptStatus::IN_PROGRESS => 'heroicon-o-clock',
                        ExamAttemptStatus::PENDING => 'heroicon-o-clipboard',
                        ExamAttemptStatus::ABSENT => 'heroicon-o-x-circle',
                        ExamAttemptStatus::CANCELLED => 'heroicon-o-no-symbol',
                        default => 'heroicon-o-question-mark-circle',
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Attempted At')
                    ->dateTime('M d, Y H:i')
                    ->sortable()
                    ->since()
                    ->icon('heroicon-o-calendar'),

                Tables\Columns\TextColumn::make('started_at')
                    ->dateTime('M d, Y H:i')
                    ->sortable()
                    ->toggleable()
                    ->placeholder('Not started'),

                Tables\Columns\TextColumn::make('submitted_at')
                    ->dateTime('M d, Y H:i')
                    ->sortable()
                    ->toggleable()
                    ->placeholder('Not submitted'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(ExamAttemptStatus::class)
                    ->native(false),

                Tables\Filters\Filter::make('has_score')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('score'))
                    ->toggle(),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        \Filament\Forms\Components\DatePicker::make('from'),
                        \Filament\Forms\Components\DatePicker::make('until'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->modalHeading('Create Exam Attempt')
                    ->slideOver(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->slideOver(),

                Tables\Actions\EditAction::make()
                    ->slideOver(),

                Tables\Actions\DeleteAction::make()
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->emptyStateHeading('No exam attempts')
            ->emptyStateDescription('This student has not attempted any exams yet.')
            ->emptyStateIcon('heroicon-o-clipboard-document-list');
    }

    public static function canViewForRecord(Model $ownerRecord, string $pageClass): bool
    {
        return true;
    }
}
