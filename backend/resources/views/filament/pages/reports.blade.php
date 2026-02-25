<x-filament-panels::page>
    <div class="space-y-6">
        {{ $this->form }}

        <x-filament::section>
            <x-slot name="heading">
                ملخص التقرير
            </x-slot>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                @php
                    $summary = $this->getReportSummary();
                @endphp

                <x-filament::card>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary-600">
                            {{ $summary['academies_count'] }}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">إجمالي الأكاديميات</div>
                    </div>
                </x-filament::card>

                <x-filament::card>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-success-600">
                            {{ $summary['active_academies'] }}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">الأكاديميات النشطة</div>
                    </div>
                </x-filament::card>

                <x-filament::card>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-info-600">
                            {{ $summary['new_academies_this_month'] }}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">جديد هذا الشهر</div>
                    </div>
                </x-filament::card>

                <x-filament::card>
                    <div class="text-center">
                        <div class="text-lg font-bold text-gray-700">
                            {{ $summary['report_period'] }}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">فترة التقرير</div>
                    </div>
                </x-filament::card>
            </div>
        </x-filament::section>

        <x-filament::section>
            <x-slot name="heading">
                تفاصيل التقرير
            </x-slot>

            <div class="text-center text-gray-500 py-8">
                <x-heroicon-o-document-chart-bar class="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>اختر نوع التقرير والفترة الزمنية ثم اضغط على "إنشاء التقرير"</p>
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>