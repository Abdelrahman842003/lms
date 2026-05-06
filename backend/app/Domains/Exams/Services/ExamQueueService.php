<?php

declare(strict_types=1);

namespace App\Domains\Exams\Services;

use Illuminate\Support\Facades\Redis;

class ExamQueueService
{
    private const QUEUE_PREFIX = 'exam_entry_queue:';
    private const ACTIVE_QUEUES_KEY = 'exam_entry_queues_active';

    /**
     * Add student to the exam entry queue
     */
    public function addStudentToQueue(string $examId, string $studentId): int
    {
        try {
            $key = self::QUEUE_PREFIX . $examId;
            
            // Use current timestamp as score for FIFO ordering
            Redis::zadd($key, (string) now()->getTimestamp(), $studentId);
            
            // Add exam to the set of active queues
            Redis::sadd(self::ACTIVE_QUEUES_KEY, $examId);
            
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

            // Check if queue is now empty
            if (Redis::zcard($key) === 0) {
                Redis::srem(self::ACTIVE_QUEUES_KEY, $examId);
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
            return Redis::smembers(self::ACTIVE_QUEUES_KEY) ?: [];
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
            
            if (Redis::zcard($key) === 0) {
                Redis::srem(self::ACTIVE_QUEUES_KEY, $examId);
            }
        } catch (\Exception $e) {
            // Ignore
        }
    }
}
