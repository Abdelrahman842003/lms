<x-filament-panels::page>
    <div class="space-y-6">
        {{ $this->form }}

        <div class="flex justify-end gap-3">
            @foreach ($this->getHeaderActions() as $action)
                {{ $action }}
            @endforeach
        </div>
    </div>
</x-filament-panels::page>