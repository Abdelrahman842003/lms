<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\DTO;

final readonly class DrilldownDescriptor
{
    /**
     * @param  array<int, string>  $supportedFilters
     * @param  array<string, string>  $tableSchema
     * @param  array<string, string>  $defaultSort
     */
    public function __construct(
        public string $drilldownKey,
        public string $title,
        public array $supportedFilters,
        public array $tableSchema,
        public array $defaultSort,
    ) {}

    public function toArray(): array
    {
        return [
            'drilldown_key' => $this->drilldownKey,
            'title' => $this->title,
            'supported_filters' => $this->supportedFilters,
            'table_schema' => $this->tableSchema,
            'default_sort' => $this->defaultSort,
        ];
    }
}
