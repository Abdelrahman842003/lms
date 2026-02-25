<x-filament-widgets::widget>
    <x-filament::section>
        <x-slot name="heading">
            {{ $this->getHeading() }}
        </x-slot>

        <div class="space-y-4">
            @if($expiringAcademies->isEmpty() && $expiringTeachers->isEmpty())
                <div class="text-center text-gray-500 py-4">
                    <x-heroicon-o-check-circle class="w-8 h-8 mx-auto mb-2 text-success-500" />
                    <p>لا توجـد اشتراكات منتهية أو على وشك الانتهاء</p>
                </div>
            @else
                @if($expiringAcademies->isNotEmpty())
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">الأكاديميات</h4>
                        <div class="space-y-2">
                            @foreach($expiringAcademies as $academy)
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <x-heroicon-o-building-library class="w-5 h-5 text-primary-500" />
                                        <div>
                                            <div class="font-medium">{{ $academy->name }}</div>
                                            <div class="text-sm text-gray-500">{{ $academy->phone }}</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        @php
                                            $daysLeft = now()->diffInDays($academy->plan_expires_at, false);
                                            $isExpired = $daysLeft < 0;
                                        @endphp
                                        <div class="text-sm font-medium {{ $isExpired ? 'text-danger-600' : 'text-warning-600' }}">
                                            {{ $isExpired ? 'منتهي منذ ' . abs($daysLeft) . ' يوم' : 'ينتهي خلال ' . $daysLeft . ' يوم' }}
                                        </div>
                                        <div class="text-xs text-gray-400">{{ $academy->plan_expires_at?->format('Y-m-d') }}</div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                @if($expiringTeachers->isNotEmpty())
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">المعلمون</h4>
                        <div class="space-y-2">
                            @foreach($expiringTeachers as $teacher)
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <x-heroicon-o-academic-cap class="w-5 h-5 text-success-500" />
                                        <div>
                                            <div class="font-medium">{{ $teacher->name }}</div>
                                            <div class="text-sm text-gray-500">{{ $teacher->phone }}</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        @php
                                            $daysLeft = now()->diffInDays($teacher->plan_expires_at, false);
                                            $isExpired = $daysLeft < 0;
                                        @endphp
                                        <div class="text-sm font-medium {{ $isExpired ? 'text-danger-600' : 'text-warning-600' }}">
                                            {{ $isExpired ? 'منتهي منذ ' . abs($daysLeft) . ' يوم' : 'ينتهي خلال ' . $daysLeft . ' يوم' }}
                                        </div>
                                        <div class="text-xs text-gray-400">{{ $teacher->plan_expires_at?->format('Y-m-d') }}</div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
            @endif
        </div>
    </x-filament::section>
</x-filament-widgets::widget>