<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Services\Admin\ReportService;
use App\Domains\Auth\Models\Academy;
        use Filament\Schemas\Components\Grid;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Actions\Action as PageAction;
use Filament\Schemas\Schema;
use Carbon\Carbon;

class ReportsPage extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-document-chart-bar';

    protected static ?string $navigationLabel = 'التقارير';

    protected static ?string $title = 'التقارير والإحصائيات';

    protected static ?string $slug = 'reports';

    protected static ?int $navigationSort = 50;

    protected string $view = 'filament.pages.reports';

    public ?array $data = [];

    public function mount(): void
    {
        $this->data = [];

        $this->form->fill([
            'report_type' => 'summary',
            'period_preset' => 'last_30_days',
            'custom_months' => 3,
            'academy_ids' => [],
            'teacher_ids' => [],
            'report_data' => null,
        ]);

        unset($this->data['date_from'], $this->data['date_to']);
    }

    protected function getReportService(): ReportService
    {
        return app(ReportService::class);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Section::make('إنشاء وتخصيص التقارير')
                    ->description('اختر نوع التقرير والفترة الزمنية لعرض البيانات بنسق الكروت التفاعلية.')
                    ->schema([
                        \Filament\Forms\Components\ToggleButtons::make('report_type')
                            ->label('نوع التقرير')
                            ->options([
                                'summary' => 'ملخص شامل',
                                'academies' => 'الأكاديميات',
                                'teachers' => 'المعلمين',
                                'students' => 'نمو الطلاب',
                                'payments' => 'المدفوعات',
                                'subscriptions' => 'الاشتراكات',
                            ])
                            ->icons([
                                'summary' => 'heroicon-o-chart-pie',
                                'academies' => 'heroicon-o-building-office',
                                'teachers' => 'heroicon-o-user-group',
                                'students' => 'heroicon-o-academic-cap',
                                'payments' => 'heroicon-o-banknotes',
                                'subscriptions' => 'heroicon-o-calendar-days',
                            ])
                            ->colors([
                                'summary' => 'primary',
                                'academies' => 'info',
                                'teachers' => 'success',
                                'students' => 'warning',
                                'payments' => 'danger',
                                'subscriptions' => 'purple',
                            ])
                            ->inline()
                            ->gridDirection('row')
                            ->columns(3)
                            ->required()
                            ->live(),

                        Grid::make(3)->schema([
                            Select::make('period_preset')
                                ->label('الفترة الزمنية')
                                ->options([
                                    'today' => 'اليوم (24 ساعة)',
                                    'last_10_days' => 'آخر 10 أيام',
                                    'last_30_days' => 'آخر 30 يوم (شهر)',
                                    'last_60_days' => 'آخر 60 يوم (شهرين)',
                                    'last_6_months' => 'آخر 6 شهور (نصف سنوي)',
                                    'last_1_year' => 'سنة كاملة',
                                    'last_2_years' => 'سنتين',
                                    'custom_months' => 'أشهر مخصصة...',
                                ])
                                ->required()
                                ->native(false)
                                ->live()
                                ->prefixIcon('heroicon-o-calendar-days'),

                            Select::make('academy_ids')
                                ->label('الأكاديميات')
                                ->options(fn (): array => Academy::query()->orderBy('name')->pluck('name', 'id')->toArray())
                                ->searchable()
                                ->preload()
                                ->multiple()
                                ->placeholder('جميع الأكاديميات')
                                ->prefixIcon('heroicon-o-building-office')
                                ->visible(fn (callable $get): bool => in_array($get('report_type'), ['summary', 'academies'], true)),

                            Select::make('teacher_ids')
                                ->label('المعلمين')
                                ->options(fn (): array => $this->getReportService()
                                    ->getTeachersList()
                                    ->pluck('name', 'id')
                                    ->toArray())
                                ->searchable()
                                ->preload()
                                ->multiple()
                                ->placeholder('جميع المعلمين')
                                ->prefixIcon('heroicon-o-user-group')
                                ->visible(fn (callable $get): bool => in_array($get('report_type'), ['summary', 'teachers'], true)),

                            TextInput::make('custom_months')
                                ->label('عدد الأشهر')
                                ->numeric()
                                ->minValue(1)
                                ->maxValue(120)
                                ->required(fn (callable $get): bool => $get('period_preset') === 'custom_months')
                                ->visible(fn (callable $get): bool => $get('period_preset') === 'custom_months')
                                ->placeholder('مثال: 8')
                                ->prefixIcon('heroicon-o-clock'),
                        ]),
                    ])
                    ->footerActions([
                        \Filament\Actions\Action::make('generate')
                            ->label('إنشاء التقرير')
                            ->icon('heroicon-m-sparkles')
                            ->color('primary')
                            ->size('lg')
                            ->action(fn () => $this->generateReport()),
                    ])
                    ->footerActionsAlignment(\Filament\Support\Enums\Alignment::Center),
            ]);
    }

    public function generateReport(): void
    {
        $data = $this->form->getState();

        [$dateFrom, $dateTo] = $this->resolveDateRangeFromPreset(
            $data['period_preset'] ?? 'last_30_days',
            isset($data['custom_months']) ? (int) $data['custom_months'] : null,
        );

        try {
            $report = $this->getReportService()->getAdminReport(
                $dateFrom,
                $dateTo,
                [
                    'report_type' => $data['report_type'] ?? 'summary',
                    'academy_ids' => $data['academy_ids'] ?? [],
                    'teacher_ids' => $data['teacher_ids'] ?? [],
                ]
            );
            $this->data['report_data'] = $report;

            Notification::make()
                ->success()
                ->title('تم إنشاء التقرير بنجاح')
                ->send();
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('خطأ في إنشاء التقرير')
                ->body($e->getMessage())
                ->send();
        }
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveDateRangeFromPreset(string $preset, ?int $customMonths = null): array
    {
        $end = now()->endOfDay();

        $start = match ($preset) {
            'today' => now()->startOfDay(),
            'last_10_days' => now()->subDays(9)->startOfDay(),
            'last_30_days' => now()->subDays(29)->startOfDay(),
            'last_60_days' => now()->subDays(59)->startOfDay(),
            'last_6_months' => now()->subMonthsNoOverflow(6)->startOfDay(),
            'last_1_year' => now()->subYear()->startOfDay(),
            'last_2_years' => now()->subYears(2)->startOfDay(),
            'custom_months' => now()->subMonthsNoOverflow(max(1, (int) ($customMonths ?? 1)))->startOfDay(),
            default => now()->subDays(29)->startOfDay(),
        };

        return [Carbon::parse($start), Carbon::parse($end)];
    }

    public function exportPdf()
    {
        $reportData = $this->data['report_data'] ?? null;

        if (!$reportData) {
            Notification::make()
                ->warning()
                ->title('لا يوجد تقرير')
                ->body('يرجى إنشاء التقرير أولاً قبل التصدير')
                ->send();
            return;
        }

        try {
            $pdfContent = $this->getReportService()->generatePdf(
                $reportData,
                'admin',
                'تقرير المنصة'
            );

            Notification::make()
                ->success()
                ->title('تم تصدير التقرير بنجاح')
                ->send();

            return response()->streamDownload(
                fn () => print($pdfContent),
                'admin-report-' . now()->format('Y-m-d') . '.pdf',
                ['Content-Type' => 'application/pdf']
            );
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('خطأ في تصدير التقرير')
                ->body($e->getMessage())
                ->send();
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            PageAction::make('export')
                ->label('تصدير PDF')
                ->icon('heroicon-m-document-arrow-down')
                ->color('success')
                ->action(fn () => $this->exportPdf()),
        ];
    }
}
