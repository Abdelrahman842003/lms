<x-filament-widgets::widget class="fi-wi-stats-overview">
    <x-filament::section :heading="__('تنبيهات الاشتراكات')">
        <div class="space-y-4">
            {{-- Pending Payments Section --}}
            @if($pendingAcademies->isNotEmpty() || $pendingTeachers->isNotEmpty())
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <x-heroicon-o-clock class="w-4 h-4 text-warning-500"/>
                        {{ __('في انتظار الدفع') }}
                    </h4>

                    {{-- Pending Academies --}}
                    @if($pendingAcademies->isNotEmpty())
                        <div class="mb-2">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('الأكاديميات') }}
                            </span>
                            <div class="mt-1 space-y-1">
                                @foreach($pendingAcademies as $academy)
                                    <div class="flex items-center justify-between p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-building-office-2 class="w-4 h-4 text-warning-600"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $academy['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($academy['month'])->format('M Y') }}</span>
                                            <x-filament::badge
                                                color="warning"
                                                size="sm"
                                            >
                                                {{ __('معلق') }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    {{-- Pending Teachers --}}
                    @if($pendingTeachers->isNotEmpty())
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('المعلمون') }}
                            </span>
                            <div class="mt-1 space-y-1">
                                @foreach($pendingTeachers as $teacher)
                                    <div class="flex items-center justify-between p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-academic-cap class="w-4 h-4 text-warning-600"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $teacher['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($teacher['month'])->format('M Y') }}</span>
                                            <x-filament::badge
                                                color="warning"
                                                size="sm"
                                            >
                                                {{ __('معلق') }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                </div>
            @endif

            {{-- Recent Payments Section --}}
            @if($paidAcademies->isNotEmpty() || $paidTeachers->isNotEmpty())
                <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <x-heroicon-o-check-circle class="w-4 h-4 text-success-500"/>
                        {{ __('مدفوع حديثاً') }}
                    </h4>

                    {{-- Paid Academies --}}
                    @if($paidAcademies->isNotEmpty())
                        <div class="mb-2">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('الأكاديميات') }}
                            </span>
                            <div class="mt-1 space-y-1">
                                @foreach($paidAcademies as $academy)
                                    <div class="flex items-center justify-between p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-building-office-2 class="w-4 h-4 text-success-600"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $academy['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($academy['month'])->format('M Y') }}</span>
                                            <x-filament::badge color="success" size="sm">
                                                {{ __('مدفوع') }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    {{-- Paid Teachers --}}
                    @if($paidTeachers->isNotEmpty())
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('المعلمون') }}
                            </span>
                            <div class="mt-1 space-y-1">
                                @foreach($paidTeachers as $teacher)
                                    <div class="flex items-center justify-between p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-academic-cap class="w-4 h-4 text-success-600"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $teacher['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($teacher['month'])->format('M Y') }}</span>
                                            <x-filament::badge color="success" size="sm">
                                                {{ __('مدفوع') }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                </div>
            @endif

            {{-- Empty State --}}
            @if($pendingAcademies->isEmpty() && $pendingTeachers->isEmpty() && $paidAcademies->isEmpty() && $paidTeachers->isEmpty())
                <div class="flex items-center justify-center gap-2 py-3 text-success-600">
                    <x-heroicon-o-check-circle class="w-5 h-5"/>
                    <span class="text-sm font-medium">{{ __('لا توجد تنبيهات') }}</span>
                </div>
            @endif
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
