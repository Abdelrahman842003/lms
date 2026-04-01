@php
    $reportData = $data['report_data'] ?? null;
@endphp

<x-filament-panels::page>
    <div class="space-y-6">
        {{ $this->form }}

        @if($reportData)
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <x-filament::section>
                    <x-slot name="heading">
                        لوحة بيانات التقرير (من {{ $reportData['period']['start'] }} إلى {{ $reportData['period']['end'] }})
                    </x-slot>

                    <!-- Section 1: Overview (4 items) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <!-- Card 1 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي الأكاديميات</div>
                                    <div style="font-size: 1.875rem; font-weight: bold;">{{ $reportData['summary']['total_academies'] ?? 0 }}</div>
                                </div>
                                <div style="padding: 0.5rem; border-radius: 0.5rem; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                                    <x-heroicon-o-building-office style="width: 1.75rem; height: 1.75rem;" />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Card 2 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي المدرسين</div>
                                    <div style="font-size: 1.875rem; font-weight: bold;">{{ $reportData['summary']['total_teachers'] ?? 0 }}</div>
                                    <div style="font-size: 0.75rem; color: #10b981; margin-top: 0.25rem;">{{ $reportData['summary']['active_teachers'] ?? 0 }} نشط</div>
                                </div>
                                <div style="padding: 0.5rem; border-radius: 0.5rem; background: rgba(16, 185, 129, 0.1); color: #10b981;">
                                    <x-heroicon-o-users style="width: 1.75rem; height: 1.75rem;" />
                                </div>
                            </div>
                        </div>

                        <!-- Card 3 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي الطلاب</div>
                                    <div style="font-size: 1.875rem; font-weight: bold;">{{ $reportData['summary']['total_students'] ?? 0 }}</div>
                                    <div style="font-size: 0.75rem; color: #0ea5e9; margin-top: 0.25rem;">+{{ $reportData['summary']['new_students'] ?? 0 }} جديد</div>
                                </div>
                                <div style="padding: 0.5rem; border-radius: 0.5rem; background: rgba(14, 165, 233, 0.1); color: #0ea5e9;">
                                    <x-heroicon-o-academic-cap style="width: 1.75rem; height: 1.75rem;" />
                                </div>
                            </div>
                        </div>

                        <!-- Card 4 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(128,128,128,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي التسجيلات</div>
                                    <div style="font-size: 1.875rem; font-weight: bold;">{{ $reportData['summary']['total_enrollments'] ?? 0 }}</div>
                                    <div style="font-size: 0.75rem; color: #f59e0b; margin-top: 0.25rem;">{{ $reportData['summary']['active_enrollments'] ?? 0 }} نشط</div>
                                </div>
                                <div style="padding: 0.5rem; border-radius: 0.5rem; background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                                    <x-heroicon-o-clipboard-document-check style="width: 1.75rem; height: 1.75rem;" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Finances (3 items) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <!-- Fin Card 1 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-top: 4px solid #3b82f6; background: rgba(128,128,128,0.05);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                                    <x-heroicon-o-currency-dollar style="width: 2rem; height: 2rem;" />
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي رسوم الاشتراكات</div>
                                    <div style="font-size: 1.5rem; font-weight: bold;">
                                        {{ number_format($reportData['summary']['total_subscription_fees'] ?? 0, 0) }} 
                                        <span style="font-size: 0.875rem; font-weight: normal; color: gray;">ج.م</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Fin Card 2 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-top: 4px solid #10b981; background: rgba(128,128,128,0.05);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(16, 185, 129, 0.1); color: #10b981;">
                                    <x-heroicon-o-banknotes style="width: 2rem; height: 2rem;" />
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">المدفوعات المؤكدة</div>
                                    <div style="font-size: 1.5rem; font-weight: bold;">
                                        {{ number_format($reportData['summary']['confirmed_payments'] ?? 0, 0) }} 
                                        <span style="font-size: 0.875rem; font-weight: normal; color: gray;">ج.م</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Fin Card 3 -->
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-top: 4px solid #8b5cf6; background: rgba(128,128,128,0.05);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                                    <x-heroicon-o-wallet style="width: 2rem; height: 2rem;" />
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">صافي ربح المنصة</div>
                                    <div style="font-size: 1.5rem; font-weight: bold;">
                                        {{ number_format($reportData['summary']['net_platform_profit'] ?? 0, 0) }} 
                                        <span style="font-size: 0.875rem; font-weight: normal; color: gray;">ج.م</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Breakdown & Activity (Mix) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 0.5rem;">
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-right: 4px solid #a855f7; background: rgba(128,128,128,0.05);">
                            <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">إجمالي الاشتراكات (شهور)</div>
                            <div style="font-size: 1.5rem; font-weight: bold;">{{ $reportData['summary']['total_subscriptions'] ?? 0 }}</div>
                        </div>
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-right: 4px solid #6366f1; background: rgba(128,128,128,0.05);">
                            <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">عمولة المدرسين المستقلين</div>
                            <div style="font-size: 1.5rem; font-weight: bold;">{{ number_format($reportData['summary']['independent_commission'] ?? 0, 0) }}</div>
                        </div>
                        <div style="padding: 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(128,128,128,0.2); border-right: 4px solid #14b8a6; background: rgba(128,128,128,0.05);">
                            <div style="font-size: 0.875rem; color: gray; margin-bottom: 0.25rem;">حصة المنصة من الأكاديميات</div>
                            <div style="font-size: 1.5rem; font-weight: bold;">{{ number_format($reportData['summary']['academy_platform_share'] ?? 0, 0) }}</div>
                        </div>
                    </div>
                </x-filament::section>

                @if(!empty($reportData['monthly_breakdown']))
                    <x-filament::section>
                        <x-slot name="heading">التوزيع الشهري للمدفوعات والتسجيلات</x-slot>
                        
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 0.875rem;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(128,128,128,0.2);">
                                        <th style="padding: 1rem 0.5rem; color: gray;">الشهر</th>
                                        <th style="padding: 1rem 0.5rem; color: gray;">التسجيلات الجديدة</th>
                                        <th style="padding: 1rem 0.5rem; color: gray;">الإيرادات المؤكدة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($reportData['monthly_breakdown'] as $month)
                                        <tr style="border-bottom: 1px solid rgba(128,128,128,0.1);">
                                            <td style="padding: 1rem 0.5rem; font-weight: bold;">
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <x-heroicon-o-calendar style="width: 1.25rem; height: 1.25rem; color: gray;" />
                                                    {{ $month['month_name'] }}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem 0.5rem;">
                                                <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold;">
                                                    {{ $month['new_enrollments'] }} طالب
                                                </span>
                                            </td>
                                            <td style="padding: 1rem 0.5rem; color: #10b981; font-weight: bold;">
                                                {{ number_format($month['confirmed_payments'], 0) }} ج.م
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </x-filament::section>
                @endif

                <x-filament::section>
                    <x-slot name="heading">معلومات التسعير المطبقة</x-slot>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
                        <div style="padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(59, 130, 246, 0.05); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.875rem; color: #3b82f6; font-weight: bold; margin-bottom: 0.5rem;">سعر الطالب / شهر (للمستقلين)</div>
                                <div style="font-size: 2rem; font-weight: bold;">{{ $reportData['summary']['price_per_student'] ?? 0 }} <span style="font-size: 1rem; color: gray; font-weight: normal;">ج.م</span></div>
                            </div>
                            <x-heroicon-o-user style="width: 3rem; height: 3rem; color: #3b82f6; opacity: 0.8;" />
                        </div>
                        <div style="padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(128,128,128,0.2); background: rgba(16, 185, 129, 0.05); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.875rem; color: #10b981; font-weight: bold; margin-bottom: 0.5rem;">سعر الطالب / شهر (للأكاديميات)</div>
                                <div style="font-size: 2rem; font-weight: bold;">{{ $reportData['summary']['academy_student_price'] ?? 0 }} <span style="font-size: 1rem; color: gray; font-weight: normal;">ج.م</span></div>
                            </div>
                            <x-heroicon-o-building-office-2 style="width: 3rem; height: 3rem; color: #10b981; opacity: 0.8;" />
                        </div>
                    </div>

                    <div style="margin-top: 1.5rem; text-align: center;">
                        <span style="font-size: 0.875rem; color: gray; background: rgba(128,128,128,0.1); padding: 0.5rem 1rem; border-radius: 0.5rem;">
                            تاريخ الإصدار: {{ $reportData['generated_at'] }}
                        </span>
                    </div>
                </x-filament::section>
            </div>
        @else
            <x-filament::section>
                <div style="text-align: center; padding: 3rem 1rem;">
                    <x-heroicon-o-document-magnifying-glass style="width: 4rem; height: 4rem; color: gray; opacity: 0.5; margin: 0 auto 1rem;" />
                    <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">لا توجد بيانات حالياً</h3>
                    <p style="color: gray;">الرجاء تحديد نوع التقرير والضغط على "إنشاء التقرير" لعرض الإحصائيات.</p>
                </div>
            </x-filament::section>
        @endif
    </div>
</x-filament-panels::page>
