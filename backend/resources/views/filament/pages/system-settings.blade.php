<x-filament-panels::page>
    <div class="space-y-6">
        {{ $this->form }}

        <div class="flex justify-end">
            {{ $this->getHeaderActions()['save'] }}
        </div>
    </div>
</x-filament-panels::page>