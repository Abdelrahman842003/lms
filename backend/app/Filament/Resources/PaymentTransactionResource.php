<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use App\Domains\Subscriptions\Services\PaymentGatewayService;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;
use Filament\Actions\Action;
use Filament\Actions\ViewAction;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;

class PaymentTransactionResource extends BaseResource
{
    protected static ?string $model = PaymentTransaction::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-banknotes';

    protected static ?int $navigationSort = 8;

    protected static ?string $modelLabel = 'عملية دفع';

    protected static ?string $pluralModelLabel = 'عمليات الدفع';

    public static function getNavigationGroup(): ?string
    {
        return 'إدارة المستخدمين';
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::where('status', PaymentTransactionStatus::PENDING->value)->count();
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                Section::make('معلومات المشترك')
                    ->schema([
                        Placeholder::make('payer_name')
                            ->label('الاسم')
                            ->content(fn ($record) => $record?->payer?->name ?? 'غير معروف'),
                        
                        Placeholder::make('payer_type')
                            ->label('نوع الحساب')
                            ->content(fn ($record) => $record?->payer instanceof \App\Domains\Auth\Models\Teacher ? 'معلم' : 'أكاديمية'),
                        
                        Placeholder::make('sender_name')
                            ->label('اسم المرسل (التحويل)')
                            ->content(fn ($record) => $record?->sender_name ?? '—'),
                        
                        Placeholder::make('sender_phone')
                            ->label('رقم الهاتف المحول منه')
                            ->content(fn ($record) => $record?->sender_phone ?? '—'),
                    ])
                    ->columns(2),

                Section::make('تفاصيل عملية الدفع')
                    ->schema([
                        Placeholder::make('payment_key')
                            ->label('كود العملية')
                            ->content(fn ($record) => $record?->payment_key),
                        
                        Placeholder::make('amount')
                            ->label('المبلغ')
                            ->content(fn ($record) => $record?->amount ? number_format((float)$record->amount, 2) . ' ج.م' : '—'),
                        
                        Placeholder::make('payment_method')
                            ->label('طريقة الدفع')
                            ->content(fn ($record) => $record?->payment_method?->label() ?? '—'),
                        
                        Placeholder::make('status')
                            ->label('الحالة')
                            ->content(fn ($record) => new HtmlString("<span style='color: " . match($record?->status) {
                                PaymentTransactionStatus::PENDING => 'orange',
                                PaymentTransactionStatus::CONFIRMED => 'green',
                                PaymentTransactionStatus::REJECTED => 'red',
                                PaymentTransactionStatus::EXPIRED => 'gray',
                                default => 'black',
                            } . "; font-weight: bold;'>" . ($record?->status?->label() ?? '—') . "</span>")),
                        
                        Placeholder::make('gateway_reference')
                            ->label('مرجع المعاملة')
                            ->content(fn ($record) => $record?->gateway_reference ?? '—'),
                            
                        Placeholder::make('expires_at')
                            ->label('تاريخ الصلاحية')
                            ->content(fn ($record) => $record?->expires_at?->format('Y-m-d H:i') ?? '—'),
                    ])
                    ->columns(2),

                Section::make('إيصال التحويل (Proof of Payment)')
                    ->schema([
                        Placeholder::make('proof_image_view')
                            ->label('الإيصال المرفوع')
                            ->content(function ($record) {
                                if (!$record || !$record->proof_image_key) {
                                    return 'لا يوجد إيصال دفع مرفوع بعد.';
                                }
                                $url = rtrim(config('filesystems.disks.r2.url'), '/') . '/' . ltrim($record->proof_image_key, '/');
                                return new HtmlString("
                                    <div class='flex flex-col gap-2'>
                                        <a href='{$url}' target='_blank' class='text-primary-600 hover:underline mb-2 block font-medium'>
                                            فتح الإيصال في نافذة جديدة ↗
                                        </a>
                                        <div style='max-width: 100%; text-align: center; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1;'>
                                            <img src='{$url}' alt='إيصال الدفع' style='max-height: 500px; display: inline-block; border-radius: 4px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);' />
                                        </div>
                                    </div>
                                ");
                            }),
                    ])
                    ->columnSpanFull(),

                Section::make('تفاصيل المراجعة')
                    ->schema([
                        Placeholder::make('confirmed_by')
                            ->label('المراجع')
                            ->content(fn ($record) => $record?->confirmedBy?->name ?? '—'),

                        Placeholder::make('confirmed_at')
                            ->label('تاريخ التأكيد')
                            ->content(fn ($record) => $record?->confirmed_at?->format('Y-m-d H:i') ?? '—'),

                        Placeholder::make('rejected_at')
                            ->label('تاريخ الرفض')
                            ->content(fn ($record) => $record?->rejected_at?->format('Y-m-d H:i') ?? '—'),

                        Placeholder::make('rejection_reason')
                            ->label('سبب الرفض')
                            ->content(fn ($record) => $record?->rejection_reason ?? '—'),

                        Placeholder::make('admin_notes')
                            ->label('ملاحظات الأدمين')
                            ->content(fn ($record) => $record?->admin_notes ?? '—')
                            ->columnSpanFull(),
                    ])
                    ->columns(2)
                    ->visible(fn ($record) => $record && !$record->isPending()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('payment_key')
                    ->label('كود العملية')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('payer.name')
                    ->label('المشترك')
                    ->searchable()
                    ->state(fn ($record) => $record->payer?->name ?? 'غير معروف'),

                Tables\Columns\TextColumn::make('payer_type')
                    ->label('نوع الحساب')
                    ->badge()
                    ->state(fn ($record) => $record->payer instanceof \App\Domains\Auth\Models\Teacher ? 'معلم' : 'أكاديمية')
                    ->color(fn ($record) => $record->payer instanceof \App\Domains\Auth\Models\Teacher ? 'info' : 'success'),

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

                Tables\Filters\SelectFilter::make('payment_method')
                    ->label('طريقة الدفع')
                    ->options([
                        'instapay' => 'إنستاباي',
                        'vodafone_cash' => 'فودافون كاش',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->label('عرض وتدقيق')
                    ->icon('heroicon-m-eye'),

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

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\PaymentTransactionResource\Pages\ListPaymentTransactions::route('/'),
            'view' => \App\Filament\Resources\PaymentTransactionResource\Pages\ViewPaymentTransaction::route('/{record}'),
        ];
    }
}
