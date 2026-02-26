<?php

namespace App\Filament\Resources\StudentResource\RelationManagers;

use App\Domains\Lectures\Enums\StudentAttendanceStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Actions\CreateAction;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AttendanceRelationManager extends RelationManager
{
    protected static string $relationship = 'attendance';

    protected static ?string $title = 'Attendance Records';

    protected static ?string $recordTitleAttribute = 'lecture.title';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('lecture_id')
                    ->relationship('lecture', 'title')
                    ->required()
                    ->searchable()
                    ->preload(),

                Select::make('status')
                    ->options(StudentAttendanceStatus::class)
                    ->default(StudentAttendanceStatus::PRESENT)
                    ->required(),

                DateTimePicker::make('attended_at')
                    ->label('Attendance Time')
                    ->seconds(false)
                    ->default(now()),

                Toggle::make('is_excused')
                    ->label('Excused Absence')
                    ->default(false),

                Textarea::make('excuse')
                    ->label('Excuse Reason')
                    ->rows(3)
                    ->placeholder('Provide reason for absence if applicable...')
                    ->columnSpanFull()
                    ->visible(fn (callable $get) => $get('is_excused') || in_array($get('status'), ['absent', 'excused'])),

                Textarea::make('notes')
                    ->label('Additional Notes')
                    ->rows(2)
                    ->columnSpanFull(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('lecture.title')
            ->columns([
                Tables\Columns\TextColumn::make('lecture.title')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold')
                    ->icon('heroicon-o-book-open')
                    ->iconColor('primary'),

                Tables\Columns\TextColumn::make('lecture.group.name')
                    ->label('Group')
                    ->searchable()
                    ->sortable()
                    ->placeholder('Individual')
                    ->icon('heroicon-o-user-group'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (StudentAttendanceStatus $state): string => match ($state) {
                        StudentAttendanceStatus::PRESENT => 'success',
                        StudentAttendanceStatus::ABSENT => 'danger',
                        StudentAttendanceStatus::EXCUSED => 'warning',
                        StudentAttendanceStatus::LATE => 'info',
                        default => 'gray',
                    })
                    ->icon(fn (StudentAttendanceStatus $state): string => match ($state) {
                        StudentAttendanceStatus::PRESENT => 'heroicon-o-check-circle',
                        StudentAttendanceStatus::ABSENT => 'heroicon-o-x-circle',
                        StudentAttendanceStatus::EXCUSED => 'heroicon-o-clipboard-document-check',
                        StudentAttendanceStatus::LATE => 'heroicon-o-clock',
                        default => 'heroicon-o-question-mark-circle',
                    }),

                Tables\Columns\TextColumn::make('attended_at')
                    ->dateTime('M d, Y H:i')
                    ->sortable()
                    ->since()
                    ->icon('heroicon-o-clock'),

                Tables\Columns\IconColumn::make('is_excused')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-badge')
                    ->falseIcon('heroicon-o-x-mark')
                    ->trueColor('warning')
                    ->falseColor('gray')
                    ->label('Excused'),

                Tables\Columns\TextColumn::make('excuse')
                    ->limit(50)
                    ->tooltip(fn ($state): ?string => $state)
                    ->placeholder('No excuse provided')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('M d, Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(StudentAttendanceStatus::class)
                    ->native(false)
                    ->multiple(),

                Tables\Filters\Filter::make('excused')
                    ->query(fn (Builder $query): Builder => $query->where('is_excused', true))
                    ->toggle(),

                Tables\Filters\Filter::make('attended_at')
                    ->form([
                        \Filament\Forms\Components\DatePicker::make('from'),
                        \Filament\Forms\Components\DatePicker::make('until'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('attended_at', '>=', $date),
                            )
                            ->when(
                                $data['until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('attended_at', '<=', $date),
                            );
                    }),
            ])
            ->headerActions([
                CreateAction::make()
                    ->modalHeading('Record Attendance')
                    ->slideOver(),
            ])
            ->actions([
                ViewAction::make()
                    ->slideOver(),

                EditAction::make()
                    ->slideOver(),

                DeleteAction::make()
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('attended_at', 'desc')
            ->emptyStateHeading('No attendance records')
            ->emptyStateDescription('Attendance records will appear here once the student attends lectures.')
            ->emptyStateIcon('heroicon-o-clipboard-document-check');
    }

    public static function canViewForRecord(Model $ownerRecord, string $pageClass): bool
    {
        return true;
    }

    public function getAttendanceStats(): array
    {
        $total = $this->getOwnerRecord()->attendance()->count();
        $present = $this->getOwnerRecord()->attendance()->where('status', StudentAttendanceStatus::PRESENT)->count();
        $absent = $this->getOwnerRecord()->attendance()->where('status', StudentAttendanceStatus::ABSENT)->count();
        $excused = $this->getOwnerRecord()->attendance()->where('status', StudentAttendanceStatus::EXCUSED)->count();
        $late = $this->getOwnerRecord()->attendance()->where('status', StudentAttendanceStatus::LATE)->count();

        $attendanceRate = $total > 0 ? round(($present / $total) * 100, 2) : 0;

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'excused' => $excused,
            'late' => $late,
            'attendance_rate' => $attendanceRate,
        ];
    }
}
