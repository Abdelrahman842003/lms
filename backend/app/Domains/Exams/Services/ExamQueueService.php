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
        try {
            $key = self::QUEUE_PREFIX . $examId;
            
            // Use current timestamp as score for FIFO ordering
            Redis::zadd($key, (string) now()->getTimestamp(), $studentId);
            
            return $this->getStudentPosition($examId, $studentId);
        } catch (\Exception $e) {
            // If Redis is not available, return 0 to indicate bypass
            return 0;
        }
    }

    /**
     * Get student's current position in the queue (1-based)
     */
    public function getStudentPosition(string $examId, string $studentId): int
    {
        try {
            $key = self::QUEUE_PREFIX . $examId;
            $rank = Redis::zrank($key, $studentId);
            
            return $rank !== null ? $rank + 1 : 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Fetch and remove the next batch of students from the queue
     */
    public function fetchNextBatch(string $examId, int $batchSize = 50): array
    {
        try {
            $key = self::QUEUE_PREFIX . $examId;
            
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
     * Get list of all exams that currently have students in the queue
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

    /**
     * Remove a student from the queue (e.g., if they disconnect)
     */
    public function removeFromQueue(string $examId, string $studentId): void
    {
        try {
            $key = self::QUEUE_PREFIX . $examId;
            Redis::zrem($key, $studentId);
        } catch (\Exception $e) {
            // Ignore
        }
    }
}
