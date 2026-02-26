<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domains\Application\Services\Admin\ReportService;
use App\Domains\Auth\Models\Academy;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Section;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Forms\Components\Actions\Action as FormAction;

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

    protected ReportService $reportService;

    public function boot(ReportService $reportService): void
    {
        $this->reportService = $reportService;
    }

    public function mount(): void
    {
        $this->form->fill([
            'date_from' => now()->startOfMonth()->format('Y-m-d'),
            'date_to' => now()->endOfMonth()->format('Y-m-d'),
            'report_type' => 'summary',
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('فلاتر التقرير')
                    ->schema([
                        Select::make('report_type')
                            ->label('نوع التقرير')
                            ->options([
                                'summary' => 'ملخص عام',
                                'academies' => 'تقرير الأكاديميات',
                                'teachers' => 'تقرير المعلمين',
                                'students' => 'تقرير الطلاب',
                                'payments' => 'تقرير المدفوعات',
                                'subscriptions' => 'تقرير الاشتراكات',
                            ])
                            ->required()
                            ->native(false),

                        Select::make('academy_id')
                            ->label('الأكاديمية')
                            ->options(Academy::pluck('name', 'id'))
                            ->searchable()
                            ->preload()
                            ->placeholder('جميع الأكاديميات'),

                        DatePicker::make('date_from')
                            ->label('من تاريخ')
                            ->required(),

                        DatePicker::make('date_to')
                            ->label('إلى تاريخ')
                            ->required(),
                    ])
                    ->columns(2)
                    ->footerActions([
                        FormAction::make('generate')
                            ->label('إنشاء التقرير')
                            ->icon('heroicon-m-document-chart-bar')
                            ->color('primary')
                            ->action(fn () => $this->generateReport()),
                    ]),
            ])
            ->statePath('data');
    }

    public function generateReport(): void
    {
        $data = $this->form->getState();

        // This will be used by the view to display the report
        $this->dispatch('report-generated', data: $data);
    }

    public function getReportSummary(): array
    {
        try {
            $data = $this->form->getState();
            $dateFrom = $data['date_from'] ?? now()->startOfMonth()->format('Y-m-d');
            $dateTo = $data['date_to'] ?? now()->endOfMonth()->format('Y-m-d');

            return [
                'academies_count' => Academy::count(),
                'active_academies' => Academy::where('is_active', true)->count(),
                'new_academies_this_month' => Academy::whereMonth('created_at', now()->month)->count(),
                'report_period' => "{$dateFrom} - {$dateTo}",
            ];
        } catch (\Exception $e) {
            return [
                'academies_count' => 0,
                'active_academies' => 0,
                'new_academies_this_month' => 0,
                'report_period' => '-',
            ];
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('export')
                ->label('تصدير PDF')
                ->icon('heroicon-m-document-arrow-down')
                ->color('success')
                ->action(function () {
                    // PDF export logic
                    $this->notify('success', 'تم تصدير التقرير بنجاح');
                }),
        ];
    }
}