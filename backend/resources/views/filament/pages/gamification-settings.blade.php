<x-filament-panels::page>
    <form wire:submit.prevent="save">
        {{ $this->form }}

        <div class="mt-6 flex items-center justify-end gap-x-3">
            <x-filament::button type="submit" size="lg">
                حفظ كافة الإعدادات العامة
            </x-filament::button>
        </div>
    </form>
</x-filament-panels::page>
