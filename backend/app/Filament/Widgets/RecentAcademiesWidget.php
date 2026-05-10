<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\AcademyResource;
use App\Domains\Auth\Models\Academy;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class RecentAcademiesWidget extends BaseWidget
{
    protected static ?string $heading = 'أحدث الأكاديميات';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Academy::query()
                    ->latest('created_at')
                    ->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->sortable()
                    ->weight('font-bold')
                    ->icon('heroicon-o-building-office-2')
                    ->iconColor('primary'),

                Tables\Columns\TextColumn::make('phone')
                    ->label('رقم الهاتف')
                    ->searchable()
                    ->toggleable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ التسجيل')
                    ->sortable()
                    ->since()
                    ->icon('heroicon-o-calendar'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('الحالة')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                Tables\Columns\TextColumn::make('plan_type')
                    ->label('خطة الاشتراك')
                    ->badge()
                    ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'pro' => 'success',
                        'basic' => 'warning',
                        'free' => 'info',
                        'enterprise' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                        'free' => 'مجاني',
                        'basic' => 'أساسي',
                        'pro' => 'احترافي',
                        'enterprise' => 'مؤسسي',
                        default => 'بدون اشتراك',
                    })
                    ->placeholder('بدون اشتراك'),
            ])
            ->actions([
                Action::make('view')
                    ->label('عرض')
                    ->url(fn (Academy $record): string => AcademyResource::getUrl('view', ['record' => $record]))
                    ->icon('heroicon-o-eye')
                    ->color('primary'),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated(false)
            ->emptyStateHeading('لم يتم العثور على أكاديميات')
            ->emptyStateDescription('ستظهر الأكاديميات هنا بمجرد تسجيلها.')
            ->emptyStateIcon('heroicon-o-building-office-2');
    }

    /**
     * Override the getTableQuery to ensure we only get the last 5
     */
    protected function getTableQuery(): Builder
    {
        return Academy::query()
            ->latest('created_at')
            ->limit(5);
    }
}
