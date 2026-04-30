<?php

declare(strict_types=1);

namespace App\Domains\Exams\Services;

use Illuminate\Support\Facades\Redis;

class ExamQueueService
{
    private const QUEUE_PREFIX = 'exam_entry_queue:';

    /**
     * Add student to the exam entry queue
     */
    public function addStudentToQueue(string $examId, string $studentId): int
    {
        $key = self::QUEUE_PREFIX . $examId;
        
        // Use current timestamp as score for FIFO ordering
        Redis::zadd($key, (string) now()->getTimestamp(), $studentId);
        
        return $this->getStudentPosition($examId, $studentId);
    }

    /**
     * Get student's current position in the queue (1-based)
     */
    public function getStudentPosition(string $examId, string $studentId): int
    {
        $key = self::QUEUE_PREFIX . $examId;
        $rank = Redis::zrank($key, $studentId);
        
        return $rank !== null ? $rank + 1 : 0;
    }

    /**
     * Fetch and remove the next batch of students from the queue
     */
    public function fetchNextBatch(string $examId, int $batchSize = 50): array
    {
        $key = self::QUEUE_PREFIX . $examId;
        
        // Get the first $batchSize students
        $students = Redis::zrange($key, 0, $batchSize - 1);
        
        if (!empty($students)) {
            // Remove them from the queue
            Redis::zrem($key, ...$students);
        }
        
        return $students;
    }

    /**
     * Get list of all exams that currently have students in the queue
     */
    public function getActiveQueues(): array
    {
        $keys = Redis::keys(self::QUEUE_PREFIX . '*');
        
        return array_map(function ($key) {
            return str_replace(config('database.redis.options.prefix') . self::QUEUE_PREFIX, '', $key);
        }, $keys);
    }

    /**
     * Remove a student from the queue (e.g., if they disconnect)
     */
    public function removeFromQueue(string $examId, string $studentId): void
    {
        $key = self::QUEUE_PREFIX . $examId;
        Redis::zrem($key, $studentId);
    }
}
