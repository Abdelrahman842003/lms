<?php

namespace App\Filament\Resources\AcademyResource\RelationManagers;

use App\Filament\Resources\TeacherResource;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Actions\Action;
use Filament\Actions\DetachAction;
use Filament\Actions\AttachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TeachersRelationManager extends RelationManager
{
    protected static string $relationship = 'teachers';

    protected static ?string $title = 'Academy Teachers';

    protected static ?string $recordTitleAttribute = 'name';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('phone')
                    ->tel()
                    ->maxLength(255),

                TextInput::make('specialization')
                    ->maxLength(255),

                Select::make('status')
                    ->options([
                        'active' => 'Active',
                        'inactive' => 'Inactive',
                        'suspended' => 'Suspended',
                    ])
                    ->default('active')
                    ->required(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                Tables\Columns\ImageColumn::make('avatar')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => 'https://ui-avatars.com/api/?name=' . urlencode($record->name) . '&background=random')
                    ->size(40),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('phone')
                    ->searchable()
                    ->toggleable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('specialization')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info')
                    ->placeholder('Not specified'),

                Tables\Columns\TextColumn::make('pivot.created_at')
                    ->label('Joined At')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->since()
                    ->icon('heroicon-o-calendar'),

                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),
            ])
            ->filters([
                Tables\Filters\Filter::make('active')
                    ->query(fn (Builder $query): Builder => $query->where('is_active', true))
                    ->toggle(),

                Tables\Filters\Filter::make('has_specialization')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('specialization'))
                    ->toggle(),
            ])
            ->headerActions([
                AttachAction::make()
                    ->preloadRecordSelect()
                    ->recordSelectSearchColumns(['name', 'phone'])
                    ->modalHeading('Attach Teacher to Academy')
                    ->modalDescription('Search for a teacher to attach to this academy.'),
            ])
            ->actions([
                Action::make('view')
                    ->url(fn (Model $record): string => TeacherResource::getUrl('view', ['record' => $record]))
                    ->icon('heroicon-o-eye')
                    ->color('primary'),

                DetachAction::make()
                    ->requiresConfirmation()
                    ->modalHeading('Detach Teacher')
                    ->modalDescription('Are you sure you want to detach this teacher from the academy?')
                    ->modalSubmitActionLabel('Yes, Detach'),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DetachBulkAction::make()
                        ->requiresConfirmation()
                        ->modalHeading('Detach Selected Teachers')
                        ->modalDescription('Are you sure you want to detach the selected teachers from this academy?'),
                ]),
            ])
            ->defaultSort('pivot.created_at', 'desc')
            ->emptyStateHeading('No teachers assigned')
            ->emptyStateDescription('Teachers will appear here once they are assigned to this academy.')
            ->emptyStateIcon('heroicon-o-users');
    }

    public static function canViewForRecord(Model $ownerRecord, string $pageClass): bool
    {
        return $ownerRecord->teachers()->exists() || auth()->user()->can('update', $ownerRecord);
    }
}
