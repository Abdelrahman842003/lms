<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\KeyValue;
use Filament\Schemas\Components\Component;

class ArabicKeyValue extends KeyValue
{
    protected string $view = 'filament.forms.components.arabic-key-value';

    protected bool $isRtl = true;

    /**
     * Create a new Arabic KeyValue component with RTL support.
     */
    public static function make(?string $name = null): static
    {
        $static = parent::make($name);

        $static->configure()
            ->keyLabel(__('Key'))
            ->valueLabel(__('Value'))
            ->reorderable()
            ->rtl();

        return $static;
    }

    /**
     * Enable RTL mode for Arabic text input.
     */
    public function rtl(bool $condition = true): static
    {
        $this->isRtl = $condition;

        return $this;
    }

    /**
     * Check if RTL mode is enabled.
     */
    public function isRtl(): bool
    {
        return $this->isRtl;
    }

    /**
     * Set Arabic-specific placeholders.
     */
    public function arabicPlaceholders(string $keyPlaceholder = null, string $valuePlaceholder = null): static
    {
        $this->keyPlaceholder($keyPlaceholder ?? __('مثال: الإعداد'));
        $this->valuePlaceholder($valuePlaceholder ?? __('مثال: القيمة'));

        return $this;
    }

    /**
     * Configure for settings data.
     */
    public function forSettings(): static
    {
        $this
            ->keyLabel(__('Setting Name'))
            ->valueLabel(__('Setting Value'))
            ->keyPlaceholder(__('setting_name'))
            ->valuePlaceholder(__('Enter value...'))
            ->addable()
            ->deletable()
            ->reorderable()
            ->rtl();

        return $this;
    }

    /**
     * Configure for translations.
     */
    public function forTranslations(): static
    {
        $this
            ->keyLabel(__('Translation Key'))
            ->valueLabel(__('Arabic Translation'))
            ->keyPlaceholder(__('key.name'))
            ->valuePlaceholder(__('الترجمة العربية'))
            ->addable()
            ->deletable()
            ->reorderable()
            ->rtl(true);

        return $this;
    }

    /**
     * Get the extra attributes for the component.
     */
    public function getExtraInputAttributes(): array
    {
        $attributes = parent::getExtraInputAttributes();

        if ($this->isRtl()) {
            $attributes['dir'] = 'rtl';
            $attributes['lang'] = 'ar';
        }

        return $attributes;
    }
}
