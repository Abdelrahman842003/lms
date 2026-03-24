<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

/**
 * Trait ResolvesOwnedResources
 * 
 * Provides helper methods for controllers to resolve resources with IDOR protection.
 * These methods ensure that users can only access resources they own or have
 * legitimate access to through their academy/teacher relationship.
 * 
 * @example
 * class StudentController extends Controller {
 *     use ResolvesOwnedResources;
 *     
 *     public function show($id) {
 *         $student = $this->findOwnedStudent($id);
 *         return new StudentResource($student);
 *     }
 * }
 */
trait ResolvesOwnedResources
{
    /**
     * Find a model with ownership check based on the authenticated user type.
     * 
     * This method automatically determines the user type (Academy, Teacher, or Student)
     * and applies the appropriate ownership filter.
     * 
     * @param string $modelClass The fully qualified model class name
     * @param int|string $id The resource ID to find
     * @param string $ownerColumn The column to check for ownership (default: 'user_id')
     * @return Model
     * @throws ModelNotFoundException If the resource is not found or not owned
     */
    protected function findOwned(string $modelClass, int|string $id, string $ownerColumn = 'user_id'): Model
    {
        $user = Auth::user();
        
        $query = $modelClass::where('id', $id);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            $query->where('teacher_id', $user->teacher->id);
        } else {
            $query->where($ownerColumn, $user->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a model owned by a specific academy.
     * 
     * @param string $modelClass The fully qualified model class name
     * @param int|string $id The resource ID to find
     * @param int $academyId The academy ID that must own the resource
     * @return Model
     * @throws ModelNotFoundException
     */
    protected function findOwnedByAcademy(string $modelClass, int|string $id, int $academyId): Model
    {
        return $modelClass::where('id', $id)
            ->where('academy_id', $academyId)
            ->firstOrFail();
    }

    /**
     * Find a model owned by a specific teacher.
     * 
     * @param string $modelClass The fully qualified model class name
     * @param int|string $id The resource ID to find
     * @param int $teacherId The teacher ID that must own the resource
     * @return Model
     * @throws ModelNotFoundException
     */
    protected function findOwnedByTeacher(string $modelClass, int|string $id, int $teacherId): Model
    {
        return $modelClass::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();
    }

    /**
     * Find a student belonging to the authenticated teacher/academy.
     * 
     * This method checks enrollment ownership to ensure the student
     * is enrolled with the authenticated teacher or academy.
     * 
     * @param int|string $studentId The student ID to find
     * @return \App\Domains\Auth\Models\Student
     * @throws ModelNotFoundException
     */
    protected function findOwnedStudent(int|string $studentId): \App\Domains\Auth\Models\Student
    {
        $user = Auth::user();
        
        $query = \App\Domains\Auth\Models\Student::where('id', $studentId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            // Academy can see students enrolled in their academy
            $query->whereHas('enrollments', function ($q) use ($user) {
                $q->where('academy_id', $user->academy->id ?? $user->id);
            });
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            // Teacher can see students enrolled with them
            $query->whereHas('enrollments', function ($q) use ($user) {
                $q->where('teacher_id', $user->teacher->id);
            });
        } elseif (method_exists($user, 'isGuardian') && $user->isGuardian()) {
            // Guardian can see their own children
            $query->where('guardian_id', $user->guardian->id ?? $user->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a student enrollment belonging to the authenticated teacher/academy.
     * 
     * This returns the enrollment record rather than the student, which is
     * useful when you need enrollment-specific data (grade, group, subscription, etc.)
     * 
     * @param int|string $studentId The student ID
     * @return \App\Domains\Enrollments\Models\Enrollment
     * @throws ModelNotFoundException
     */
    protected function findOwnedEnrollment(int|string $studentId): \App\Domains\Enrollments\Models\Enrollment
    {
        $user = Auth::user();
        
        $query = \App\Domains\Enrollments\Models\Enrollment::where('student_id', $studentId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            $query->where('teacher_id', $user->teacher->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a video belonging to the authenticated teacher/academy.
     * 
     * @param int|string $videoId The video ID to find
     * @return \App\Domains\Videos\Models\Video
     * @throws ModelNotFoundException
     */
    protected function findOwnedVideo(int|string $videoId): \App\Domains\Videos\Models\Video
    {
        $user = Auth::user();
        
        $query = \App\Domains\Videos\Models\Video::where('id', $videoId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            $query->where('teacher_reference_id', $user->teacher->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a lecture belonging to the authenticated teacher/academy.
     * 
     * @param int|string $lectureId The lecture ID to find
     * @return \App\Domains\Lectures\Models\Lecture
     * @throws ModelNotFoundException
     */
    protected function findOwnedLecture(int|string $lectureId): \App\Domains\Lectures\Models\Lecture
    {
        $user = Auth::user();
        
        $query = \App\Domains\Lectures\Models\Lecture::where('id', $lectureId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            $query->where('teacher_id', $user->teacher->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a teacher belonging to the authenticated academy.
     * 
     * @param int|string $teacherId The teacher ID to find
     * @return \App\Domains\Auth\Models\Teacher
     * @throws ModelNotFoundException
     */
    protected function findOwnedTeacher(int|string $teacherId): \App\Domains\Auth\Models\Teacher
    {
        $user = Auth::user();
        
        $query = \App\Domains\Auth\Models\Teacher::where('id', $teacherId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            // Teacher must be associated with this academy
            $query->whereHas('academies', function ($q) use ($user) {
                $q->where('academies.id', $user->academy->id ?? $user->id);
            });
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find an exam belonging to the authenticated teacher/academy.
     * 
     * @param int|string $examId The exam ID to find
     * @return \App\Domains\Exams\Models\Exam
     * @throws ModelNotFoundException
     */
    protected function findOwnedExam(int|string $examId): \App\Domains\Exams\Models\Exam
    {
        $user = Auth::user();
        
        $query = \App\Domains\Exams\Models\Exam::where('id', $examId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        } elseif (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            $query->where('teacher_id', $user->teacher->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a grade belonging to the authenticated academy.
     * 
     * @param int|string $gradeId The grade ID to find
     * @return \App\Domains\Enrollments\Models\Grade
     * @throws ModelNotFoundException
     */
    protected function findOwnedGrade(int|string $gradeId): \App\Domains\Enrollments\Models\Grade
    {
        $user = Auth::user();
        
        $query = \App\Domains\Enrollments\Models\Grade::where('id', $gradeId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Find a group belonging to the authenticated academy.
     * 
     * @param int|string $groupId The group ID to find
     * @return \App\Domains\Enrollments\Models\Group
     * @throws ModelNotFoundException
     */
    protected function findOwnedGroup(int|string $groupId): \App\Domains\Enrollments\Models\Group
    {
        $user = Auth::user();
        
        $query = \App\Domains\Enrollments\Models\Group::where('id', $groupId);
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            $query->where('academy_id', $user->academy->id ?? $user->id);
        }
        
        return $query->firstOrFail();
    }

    /**
     * Verify that a resource belongs to the authenticated user's context.
     * 
     * This is a boolean check that returns true/false instead of throwing an exception.
     * Useful for conditional logic.
     * 
     * @param Model $model The model to check
     * @param string $ownerColumn The column to check for ownership
     * @return bool
     */
    protected function isOwned(Model $model, string $ownerColumn = 'user_id'): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        if (method_exists($user, 'isAcademy') && $user->isAcademy()) {
            return isset($model->academy_id) && $model->academy_id === ($user->academy->id ?? $user->id);
        }
        
        if (method_exists($user, 'isTeacher') && $user->isTeacher()) {
            return isset($model->teacher_id) && $model->teacher_id === $user->teacher->id;
        }
        
        return isset($model->{$ownerColumn}) && $model->{$ownerColumn} === $user->id;
    }
}
