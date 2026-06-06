<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\Services\DrilldownRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class GenerateTeacherDrilldownAction
{
    public function __construct(
        private DrilldownRegistry $registry,
    ) {}

    public function execute($teacher, string $drilldownKey, Request $request): JsonResponse
    {
        $descriptor = $this->registry->get($drilldownKey);

        if ($descriptor === null) {
            return response()->json([
                'status' => false,
                'message' => 'Drill-down غير موجود',
            ], 404);
        }

        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);

        $schema = [];
        foreach ($descriptor->tableSchema as $key => $type) {
            $schema[] = [
                'key' => $key,
                'label' => $key,
                'sortable' => true,
            ];
        }

        $rows = [];

        return response()->json([
            'status' => true,
            'data' => [
                'drilldown_key' => $drilldownKey,
                'title' => $descriptor->title,
                'schema' => [
                    'columns' => $schema,
                ],
                'rows' => $rows,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => count($rows),
                ],
            ],
        ]);
    }
}
