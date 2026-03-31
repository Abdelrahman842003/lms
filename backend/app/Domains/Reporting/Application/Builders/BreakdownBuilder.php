<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

final readonly class BreakdownBuilder
{
    /**
     * @param  array<int, mixed>  $rows
     * @param  array<string, string>  $schema
     * @param  array{column: string, direction: string}  $sort
     * @return array{data: array<int, mixed>, schema: array<string, string>, pagination: array{page: int, per_page: int, total: int, last_page: int}, sort: array<string, string>}
     */
    public function build(
        array $rows,
        array $schema,
        array $sort = ['column' => 'id', 'direction' => 'asc'],
        int $page = 1,
        int $perPage = 15,
    ): array {
        $total = count($rows);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $offset = ($page - 1) * $perPage;

        $pageRows = array_slice($rows, $offset, $perPage);

        return [
            'data' => $pageRows,
            'schema' => $schema,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
            ],
            'sort' => $sort,
        ];
    }
}
