<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Events;

use App\Domains\Lectures\Models\Lecture;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LectureUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Lecture $lecture;

    public function __construct(Lecture $lecture)
    {
        $this->lecture = $lecture;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('teacher.' . $this->lecture->teacher_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'lecture.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture_id' => $this->lecture->id,
            'is_active'  => $this->lecture->is_active,
            'exists'     => $this->lecture->exists,
        ];
    }
}
