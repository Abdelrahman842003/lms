<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Services;

use Illuminate\Support\Facades\Redis;

class AttendanceQueueService
{
    private const QUEUE_PREFIX = 'attendance_entry_queue:';

    /**
     * Add student to the attendance entry queue
     */
    public function addStudentToQueue(string $lectureId, string $studentId): int
    {
        try {
            $key = self::QUEUE_PREFIX . $lectureId;
            
            // Use current timestamp as score for FIFO ordering
            Redis::zadd($key, (string) now()->getTimestamp(), $studentId);
            
            return $this->getStudentPosition($lectureId, $studentId);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get student's current position in the queue (1-based)
     */
    public function getStudentPosition(string $lectureId, string $studentId): int
    {
        try {
            $key = self::QUEUE_PREFIX . $lectureId;
            $rank = Redis::zrank($key, $studentId);
            
            return $rank !== null ? $rank + 1 : 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Fetch and remove the next batch of students from the queue
     */
    public function fetchNextBatch(string $lectureId, int $batchSize = 50): array
    {
        try {
            $key = self::QUEUE_PREFIX . $lectureId;
            
            // Get the first $batchSize students
            $students = Redis::zrange($key, 0, $batchSize - 1);
            
            if (!empty($students)) {
                // Remove them from the queue
                Redis::zrem($key, ...$students);
            }
            
            return $students;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get list of all lectures that currently have students in the queue
     */
    public function getActiveQueues(): array
    {
        try {
            $keys = Redis::keys(self::QUEUE_PREFIX . '*');
            
            return array_map(function ($key) {
                return str_replace(config('database.redis.options.prefix') . self::QUEUE_PREFIX, '', $key);
            }, $keys);
        } catch (\Exception $e) {
            return [];
        }
    }
}
