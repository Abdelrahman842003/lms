<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\RelationManagers;

use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use App\Domains\Subscriptions\Services\PaymentGatewayService;
use App\Filament\Resources\PaymentTransactionResource;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PaymentTransactionsRelationManager extends RelationManager
{
    protected static string $relationship = 'paymentTransactions';

    protected static ?string $title = 'سجل مدفوعات الاشتراك';

    protected static ?string $recordTitleAttribute = 'payment_key';

    public function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('payment_key')
            ->columns([
                Tables\Columns\TextColumn::make('payment_key')
                    ->label('كود العملية')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('amount')
                    ->label('المبلغ')
                    ->money('EGP')
                    ->sortable(),

                Tables\Columns\TextColumn::make('payment_method')
                    ->label('طريقة الدفع')
                    ->badge()
                    ->color('primary')
                    ->state(fn ($record) => $record->payment_method?->label()),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (PaymentTransactionStatus $state): string => $state->color())
                    ->state(fn ($record) => $record->status),

                Tables\Columns\TextColumn::make('sender_name')
                    ->label('اسم المرسل')
                    ->searchable()
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('sender_phone')
                    ->label('هاتف المرسل')
                    ->searchable()
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الطلب')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options([
                        'pending' => 'معلق',
                        'confirmed' => 'مؤكد',
                        'rejected' => 'مرفوض',
                        'expired' => 'منتهي الصلاحية',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('view_details')
                    ->label('تفاصيل')
                    ->icon('heroicon-m-eye')
                    ->color('gray')
                    ->url(fn ($record) => PaymentTransactionResource::getUrl('view', ['record' => $record])),

                Tables\Actions\Action::make('confirm')
                    ->label('تأكيد الدفع')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->form([
                        Textarea::make('admin_notes')
                            ->label('ملاحظات المراجعة')
                            ->placeholder('أدخل أي ملاحظات للتأكيد...'),
                    ])
                    ->action(function (PaymentTransaction $record, array $data) {
                        app(PaymentGatewayService::class)
                            ->confirmPayment($record, auth()->user(), $data['admin_notes'] ?? null);
                        
                        \Filament\Notifications\Notification::make()
                            ->title('تم تأكيد الدفع وتفعيل الاشتراك بنجاح')
                            ->success()
                            ->send();
                    })
                    ->visible(fn ($record) => $record->isPending() && !empty($record->proof_image_key)),

                Tables\Actions\Action::make('reject')
                    ->label('رفض الدفع')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->form([
                        Textarea::make('rejection_reason')
                            ->label('سبب الرفض')
                            ->required()
                            ->placeholder('يرجى تحديد سبب رفض الدفع لمشاركته مع العميل...'),
                    ])
                    ->action(function (PaymentTransaction $record, array $data) {
                        app(PaymentGatewayService::class)
                            ->rejectPayment($record, auth()->user(), $data['rejection_reason']);

                        \Filament\Notifications\Notification::make()
                            ->title('تم رفض الدفع وإعلام المشترك')
                            ->danger()
                            ->send();
                    })
                    ->visible(fn ($record) => $record->isPending()),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
