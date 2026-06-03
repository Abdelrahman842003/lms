<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\PaymentTransactionResource;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use Filament\Actions\Action;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class PendingPaymentsWidget extends BaseWidget
{
    protected static ?string $heading = 'المدفوعات الذاتية المعلقة بانتظار التأكيد';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                PaymentTransaction::query()
                    ->where('status', PaymentTransactionStatus::PENDING->value)
                    ->whereNotNull('proof_image_key')
                    ->latest('created_at')
                    ->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('payment_key')
                    ->label('كود العملية')
                    ->weight('font-bold'),

                Tables\Columns\TextColumn::make('payer.name')
                    ->label('المشترك')
                    ->state(fn ($record) => $record->payer?->name ?? 'غير معروف'),

                Tables\Columns\TextColumn::make('payer_type')
                    ->label('نوع الحساب')
                    ->badge()
                    ->state(fn ($record) => $record->payer instanceof \App\Domains\Auth\Models\Teacher ? 'معلم' : 'أكاديمية')
                    ->color(fn ($record) => $record->payer instanceof \App\Domains\Auth\Models\Teacher ? 'info' : 'success'),

                Tables\Columns\TextColumn::make('amount')
                    ->label('المبلغ')
                    ->money('EGP'),

                Tables\Columns\TextColumn::make('payment_method')
                    ->label('طريقة الدفع')
                    ->badge()
                    ->state(fn ($record) => $record->payment_method?->label()),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الطلب')
                    ->dateTime('Y-m-d H:i')
                    ->icon('heroicon-o-calendar'),
            ])
            ->actions([
                Action::make('view')
                    ->label('عرض وتدقيق')
                    ->url(fn (PaymentTransaction $record): string => PaymentTransactionResource::getUrl('view', ['record' => $record]))
                    ->icon('heroicon-o-eye')
                    ->color('primary'),
            ])
            ->paginated(false)
            ->emptyStateHeading('لا توجد مدفوعات معلقة')
            ->emptyStateDescription('كل عمليات الدفع الذاتي تمت مراجعتها بالكامل.')
            ->emptyStateIcon('heroicon-o-check-circle');
    }

    protected function getTableQuery(): Builder
    {
        return PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::PENDING->value)
            ->whereNotNull('proof_image_key')
            ->latest('created_at')
            ->limit(5);
    }
}
