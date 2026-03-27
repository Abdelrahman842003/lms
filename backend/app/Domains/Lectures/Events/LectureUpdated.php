<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Events;

use App\Domains\Lectures\Models\Lecture;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class LectureUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Lecture $lecture;

    public function __construct(Lecture $lecture)
    {
        $this->lecture = $lecture;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('teacher.' . $this->lecture->teacher_id),
        ];

        $academyIds = [];

        if ($this->lecture->academy_id) {
            $academyIds[] = (string) $this->lecture->academy_id;
        }

        if ($this->lecture->teacher_id) {
            $linkedAcademies = DB::table('academy_teacher')
                ->where('teacher_id', $this->lecture->teacher_id)
                ->where('is_active', true)
                ->pluck('academy_id')
                ->map(fn ($id) => (string) $id)
                ->all();

            $academyIds = array_values(array_unique(array_merge($academyIds, $linkedAcademies)));
        }

        foreach ($academyIds as $academyId) {
            $channels[] = new PrivateChannel('academy.' . $academyId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'lecture.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture' => [
                'id' => $this->lecture->id,
                'title' => $this->lecture->title,
                'is_active' => $this->lecture->is_active,
            ],
            'lecture_id' => $this->lecture->id,
            'is_active'  => $this->lecture->is_active,
            'exists'     => $this->lecture->exists,
        ];
    }
}
