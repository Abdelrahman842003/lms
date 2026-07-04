<?php

declare(strict_types=1);

namespace App\Filament\Resources\PaymentTransactionResource\Pages;

use App\Filament\Resources\PaymentTransactionResource;
use App\Domains\Subscriptions\Services\PaymentGatewayService;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Pages\ViewRecord;

class ViewPaymentTransaction extends ViewRecord
{
    protected static string $resource = PaymentTransactionResource::class;

    public function getTitle(): string
    {
        return 'تفاصيل عملية الدفع - ' . $this->record->payment_key;
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('confirm_payment')
                ->label('تأكيد الدفع')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->form([
                    Textarea::make('admin_notes')
                        ->label('ملاحظات المراجعة')
                        ->placeholder('أدخل أي ملاحظات للتأكيد...'),
                ])
                ->action(function (array $data) {
                    app(PaymentGatewayService::class)
                        ->confirmPayment($this->record, auth()->user(), $data['admin_notes'] ?? null);
                    
                    $this->refreshFormData();

                    \Filament\Notifications\Notification::make()
                        ->title('تم تأكيد الدفع وتفعيل الاشتراك بنجاح')
                        ->success()
                        ->send();
                })
                ->visible(fn () => $this->record->isPending() && !empty($this->record->proof_image_key)),

            Action::make('reject_payment')
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
                ->action(function (array $data) {
                    app(PaymentGatewayService::class)
                        ->rejectPayment($this->record, auth()->user(), $data['rejection_reason']);

                    $this->refreshFormData();

                    \Filament\Notifications\Notification::make()
                        ->title('تم رفض الدفع وإعلام المشترك')
                        ->danger()
                        ->send();
                })
                ->visible(fn () => $this->record->isPending()),
        ];
    }
}
