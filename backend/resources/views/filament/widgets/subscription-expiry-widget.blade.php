<x-filament-widgets::widget class="fi-wi-stats-overview">
    <x-filament::section :heading="__('Subscription Alerts')">
        <div class="space-y-6">
            {{-- Expiring Soon Section --}}
            @if($expiringAcademies->isNotEmpty() || $expiringTeachers->isNotEmpty())
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <x-heroicon-o-clock class="w-4 h-4 text-warning-500"/>
                        {{ __('Expiring in Next 7 Days') }}
                    </h4>

                    {{-- Expiring Academies --}}
                    @if($expiringAcademies->isNotEmpty())
                        <div class="mb-3">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('Academies') }}
                            </span>
                            <div class="mt-2 space-y-2">
                                @foreach($expiringAcademies as $academy)
                                    <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-building-office-2 class="w-4 h-4 text-primary-500"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $academy['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ $academy['plan'] }}</span>
                                            <x-filament::badge
                                                :color="$this->getExpiryBadgeColor($academy['days_remaining'])"
                                                size="sm"
                                            >
                                                {{ $this->getExpiryBadgeText($academy['days_remaining']) }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    {{-- Expiring Teachers --}}
                    @if($expiringTeachers->isNotEmpty())
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('Teachers') }}
                            </span>
                            <div class="mt-2 space-y-2">
                                @foreach($expiringTeachers as $teacher)
                                    <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-academic-cap class="w-4 h-4 text-success-500"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $teacher['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ $teacher['plan'] }}</span>
                                            <x-filament::badge
                                                :color="$this->getExpiryBadgeColor($teacher['days_remaining'])"
                                                size="sm"
                                            >
                                                {{ $this->getExpiryBadgeText($teacher['days_remaining']) }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                </div>
            @endif

            {{-- Recently Expired Section --}}
            @if($expiredAcademies->isNotEmpty() || $expiredTeachers->isNotEmpty())
                <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <x-heroicon-o-x-circle class="w-4 h-4 text-danger-500"/>
                        {{ __('Recently Expired') }}
                    </h4>

                    {{-- Expired Academies --}}
                    @if($expiredAcademies->isNotEmpty())
                        <div class="mb-3">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('Academies') }}
                            </span>
                            <div class="mt-2 space-y-2">
                                @foreach($expiredAcademies as $academy)
                                    <div class="flex items-center justify-between p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-building-office-2 class="w-4 h-4 text-danger-500"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $academy['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ $academy['plan'] }}</span>
                                            <x-filament::badge color="danger" size="sm">
                                                {{ $this->getExpiryBadgeText($academy['days_remaining']) }}
                                            </x-filament::badge>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    {{-- Expired Teachers --}}
                    @if($expiredTeachers->isNotEmpty())
                        <div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ __('Teachers') }}
                            </span>
                            <div class="mt-2 space-y-2">
                                @foreach($expiredTeachers as $teacher)
                                    <div class="flex items-center justify-between p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                                        <div class="flex items-center gap-2">
                                            <x-heroicon-o-academic-cap class="w-4 h-4 text-danger-500"/>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {{ $teacher['name'] }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">{{ $teacher['plan'] }}</span>
                                            <x-filament::badge color="danger" size="sm">
                                                {{ $this->getExpiryBadgeText($teacher['days_remaining']) }}
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
            @if($expiringAcademies->isEmpty() && $expiringTeachers->isEmpty() && $expiredAcademies->isEmpty() && $expiredTeachers->isEmpty())
                <div class="text-center py-6">
                    <x-heroicon-o-check-circle class="w-10 h-10 mx-auto text-success-500 mb-2"/>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ __('No subscriptions expiring soon or recently expired.') }}
                    </p>
                </div>
            @endif
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
