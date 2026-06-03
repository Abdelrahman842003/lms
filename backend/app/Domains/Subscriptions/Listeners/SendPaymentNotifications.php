<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Listeners;

use App\Domains\Subscriptions\Events\PaymentTransactionCreated;
use App\Domains\Subscriptions\Events\PaymentConfirmed;
use App\Domains\Subscriptions\Events\PaymentRejected;
use App\Domains\Subscriptions\Events\SubscriptionExpiringSoon;
use App\Domains\Auth\Models\Admin;
use App\Domains\Notifications\Events\NewNotificationEvent;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SendPaymentNotifications
{
    public function handle(object $event): void
    {
        if ($event instanceof PaymentTransactionCreated) {
            $this->onTransactionCreated($event);
        } elseif ($event instanceof PaymentConfirmed) {
            $this->onTransactionConfirmed($event);
        } elseif ($event instanceof PaymentRejected) {
            $this->onTransactionRejected($event);
        } elseif ($event instanceof SubscriptionExpiringSoon) {
            $this->onSubscriptionExpiringSoon($event);
        }
    }

    private function onTransactionCreated(PaymentTransactionCreated $event): void
    {
        $transaction = $event->transaction;
        $payer = $transaction->payer;
        $payerName = $payer?->name ?? 'مشترك جديد';
        $amount = $transaction->amount;
        $method = $transaction->payment_method->label();
        
        $title = 'دفعة معلقة جديدة';
        $body = "تم استلام طلب دفع بقيمة {$amount} ج.م عبر {$method} من {$payerName} بانتظار المراجعة.";

        Admin::query()->get()->each(function (Admin $admin) use ($title, $body, $transaction): void {
            Notification::make()
                ->title($title)
                ->body($body)
                ->sendToDatabase($admin);

            event(new NewNotificationEvent(
                userId: (string) $admin->id,
                userType: 'admin',
                notificationId: Str::uuid()->toString(),
                title: $title,
                message: $body,
                data: ['payment_transaction_id' => $transaction->id],
                type: 'payment_received',
            ));
        });
    }

    private function onTransactionConfirmed(PaymentConfirmed $event): void
    {
        $transaction = $event->transaction;
        $payer = $transaction->payer;
        if (!$payer) {
            return;
        }

        $title = "تم تأكيد الدفع وتفعيل الاشتراك";
        $message = "تم تأكيد عملية الدفع بنجاح وتفعيل باقة اشتراكك. تفقد تفاصيل الباقة والانتهاء في حسابك.";

        $this->notifySubscriber($payer, $title, $message, 'payment_confirmed', [
            'payment_transaction_id' => $transaction->id,
        ]);
    }

    private function onTransactionRejected(PaymentRejected $event): void
    {
        $transaction = $event->transaction;
        $payer = $transaction->payer;
        if (!$payer) {
            return;
        }

        $title = "تم رفض عملية الدفع";
        $reason = $transaction->rejection_reason ?? 'البيانات غير متطابقة';
        $message = "تم رفض إيصال الدفع الخاص بك. السبب: {$reason}";

        $this->notifySubscriber($payer, $title, $message, 'payment_rejected', [
            'payment_transaction_id' => $transaction->id,
            'reason' => $reason,
        ]);
    }

    private function notifySubscriber(Model $subscriber, string $title, string $message, string $type, array $extraData = []): void
    {
        $userType = strtolower(class_basename($subscriber));
        if (! in_array($userType, ['teacher', 'academy'], true)) {
            return;
        }

        $notificationId = Str::uuid()->toString();
        $data = array_merge([
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ], $extraData);

        // Save database notification
        $subscriber->notifications()->create([
            'id' => $notificationId,
            'type' => 'App\\Notifications\\' . ucfirst($userType) . 'Notification',
            'data' => $data,
            'read_at' => null,
        ]);

        // Broadcast notification for real-time update
        broadcast(new NewNotificationEvent(
            userId: (string) $subscriber->id,
            userType: $userType,
            notificationId: $notificationId,
            title: $title,
            message: $message,
            data: $data,
            type: $type,
        ));
    }

    private function onSubscriptionExpiringSoon(SubscriptionExpiringSoon $event): void
    {
        $subscriber = $event->subscriber;
        $daysLeft = $event->daysLeft;
        $subscriberType = $event->subscriberType;

        $title = "اقتراب انتهاء الاشتراك";
        $daysText = $daysLeft === 1 ? 'يوم واحد' : "{$daysLeft} أيام";
        $message = "تنبيه: متبقي {$daysText} على انتهاء صلاحية اشتراكك. يرجى تجديد الاشتراك لتجنب إيقاف الخدمة.";
        
        $payPath = $subscriberType === 'teacher' ? '/teacher/subscription' : '/academy/subscription';

        $this->notifySubscriber($subscriber, $title, $message, 'subscription_expiring_soon', [
            'days_left' => $daysLeft,
            'pay_path' => $payPath,
            'pay_details' => 'يمكنك التجديد والدفع ذاتياً عن طريق InstaPay أو Vodafone Cash.',
        ]);
    }
}
