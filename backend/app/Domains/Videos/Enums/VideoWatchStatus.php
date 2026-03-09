<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoWatchStatus: string
{
    case NOT_STARTED          = 'not_started';
    case STARTED              = 'started';
    case IN_PROGRESS          = 'in_progress';
    // شاف الفيديو كاملاً لكن لم يجتز التدريب بعد
    case WATCHED_PENDING_QUIZ = 'watched_pending_quiz';
    // شاف + اجتاز التدريب (أو لا يوجد تدريب)
    case COMPLETED            = 'completed';
}
