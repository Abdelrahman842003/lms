<x-filament-panels::page>
    <div class="space-y-6">
        @if (! $this->analyticsConfigured)
            <x-filament::section>
                <x-slot name="heading">تحليلات جوجل غير مُفعّلة بعد</x-slot>
                <p class="text-sm text-gray-600">
                    أضف معرّف الخاصية (Property ID) والصق ملف حساب الخدمة بصيغة JSON لتفعيل لوحة التحليلات.
                </p>
            </x-filament::section>
        @endif

        {{ $this->form }}
    </div>
</x-filament-panels::page>
