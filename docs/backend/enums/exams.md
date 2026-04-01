---
title: Exam Enums
description: Enumeration types for the Exams domain including exam status, question types, exam modes, and attempt statuses
---

# Exam Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Exams\Enums` namespace.

---

## ExamStatus

Defines the lifecycle status of an exam.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `DRAFT` | `draft` | مسودة | Exam is being prepared |
| `ACTIVE` | `active` | نشط | Exam is active and can be taken |
| `CLOSED` | `closed` | منتهي | Exam has ended |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Exams\Enums\ExamStatus;

$status = ExamStatus::ACTIVE;
echo $status->value;  // 'active'
echo $status->label(); // 'نشط'
```

**Location:** `App\Domains\Exams\Enums\ExamStatus`

---

## QuestionType

Defines types of exam questions.

| Case | Value | Label (AR) | Auto-Graded | Description |
|------|-------|------------|-------------|-------------|
| `MCQ` | `mcq` | اختيار من متعدد | Yes | Multiple choice question |
| `TRUE_FALSE` | `true_false` | صح أو غلط | Yes | True/false question |
| `ESSAY` | `essay` | مقالي | No | Essay/free-text question |

**Methods:**
- `label(): string` - Returns Arabic label
- `isAutoGraded(): bool` - Returns true if question type can be auto-graded

**Usage:**
```php
use App\Domains\Exams\Enums\QuestionType;

$type = QuestionType::MCQ;
echo $type->value;          // 'mcq'
echo $type->label();        // 'اختار من متعدد'
echo $type->isAutoGraded(); // true
```

**Location:** `App\Domains\Exams\Enums\QuestionType`

---

## ExamMode

Defines the mode/purpose of an exam.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `PRACTICE` | `practice` | تدريب | Practice quiz |
| `EXAM` | `exam` | امتحان | Formal exam |
| `HOMEWORK` | `homework` | واجب | Homework assignment |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Exams\Enums\ExamMode;

$mode = ExamMode::EXAM;
echo $mode->value;  // 'exam'
echo $mode->label(); // 'امتحان'
```

**Location:** `App\Domains\Exams\Enums\ExamMode`

---

## ExamAttemptStatus

Defines the status of an exam attempt.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `IN_PROGRESS` | `in_progress` | جاري | Student is currently taking the exam |
| `COMPLETED` | `completed` | مكتمل | Exam completed successfully |
| `TERMINATED` | `terminated` | منتهي قسراً | Exam was forcibly terminated |
| `FLAGGED` | `flagged` | مشبوه | Exam flagged for review |

**Methods:**
- `label(): string` - Returns Arabic label
- `isFinished(): bool` - Returns true if attempt is in a finished state

**Usage:**
```php
use App\Domains\Exams\Enums\ExamAttemptStatus;

$status = ExamAttemptStatus::COMPLETED;
echo $status->value;     // 'completed'
echo $status->label();   // 'مكتمل'
echo $status->isFinished(); // true
```

**Location:** `App\Domains\Exams\Enums\ExamAttemptStatus`
