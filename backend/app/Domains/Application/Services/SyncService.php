<?php

declare(strict_types=1);

namespace App\Domains\Application\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Guardian;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SyncService
{
    /**
     * Pull updated records since the last sync timestamp per entity
     */
    public function pullEntities($user, array $sinceData): array
    {
        $result = [];

        if ($user instanceof Teacher) {
            $result = $this->pullForTeacher($user, $sinceData);
        } elseif ($user instanceof Student) {
            $result = $this->pullForStudent($user, $sinceData);
        } elseif ($user instanceof Academy) {
            $result = $this->pullForAcademy($user, $sinceData);
        } elseif ($user instanceof Guardian) {
            $result = $this->pullForGuardian($user, $sinceData);
        }

        return $result;
    }

    private function pullForTeacher(Teacher $teacher, array $sinceData): array
    {
        $results = [];

        // 1. Grades
        $since = isset($sinceData['grades']) ? Carbon::parse($sinceData['grades']) : null;
        $query = DB::table('grades')->where('teacher_id', $teacher->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['grades'] = $query->get()->toArray();

        // 2. Groups
        $since = isset($sinceData['groups']) ? Carbon::parse($sinceData['groups']) : null;
        $query = DB::table('groups')->where('teacher_id', $teacher->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['groups'] = $query->get()->toArray();

        // 3. Lectures
        $since = isset($sinceData['lectures']) ? Carbon::parse($sinceData['lectures']) : null;
        $query = DB::table('lectures')->where('teacher_id', $teacher->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['lectures'] = $query->get()->toArray();

        // 4. Exams
        $since = isset($sinceData['exams']) ? Carbon::parse($sinceData['exams']) : null;
        $query = DB::table('exams')->where('teacher_id', $teacher->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['exams'] = $query->get()->toArray();

        // 5. Notes
        $since = isset($sinceData['notes']) ? Carbon::parse($sinceData['notes']) : null;
        $query = DB::table('notes')->where('teacher_id', $teacher->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['notes'] = $query->get()->toArray();

        // 6. Students
        $since = isset($sinceData['students']) ? Carbon::parse($sinceData['students']) : null;
        $query = DB::table('students')
            ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.teacher_id', $teacher->id)
            ->select('students.*', 'enrollments.grade_id', 'enrollments.group_id', 'enrollments.is_active');
        if ($since) {
            $query->where('students.updated_at', '>', $since);
        }
        $results['students'] = $query->get()->toArray();

        return $results;
    }

    private function pullForStudent(Student $student, array $sinceData): array
    {
        $results = [];

        // 1. studentTeachers
        $since = isset($sinceData['studentTeachers']) ? Carbon::parse($sinceData['studentTeachers']) : null;
        $query = DB::table('teachers')
            ->join('enrollments', 'teachers.id', '=', 'enrollments.teacher_id')
            ->where('enrollments.student_id', $student->id)
            ->select('teachers.id', 'teachers.name', 'teachers.subject');
        if ($since) {
            $query->where('teachers.updated_at', '>', $since);
        }
        $results['studentTeachers'] = $query->get()->toArray();

        // 2. studentLectures
        $since = isset($sinceData['studentLectures']) ? Carbon::parse($sinceData['studentLectures']) : null;
        $enrollments = DB::table('enrollments')->where('student_id', $student->id)->get();
        $groupIds = $enrollments->pluck('group_id')->filter()->toArray();
        $gradeIds = $enrollments->pluck('grade_id')->filter()->toArray();

        $query = DB::table('lectures')
            ->where(function($q) use ($groupIds, $gradeIds) {
                $q->whereIn('group_id', $groupIds)->orWhereIn('grade_id', $gradeIds);
            });
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['studentLectures'] = $query->get()->toArray();

        // 3. studentExams
        $since = isset($sinceData['studentExams']) ? Carbon::parse($sinceData['studentExams']) : null;
        $query = DB::table('exams')
            ->where(function($q) use ($groupIds, $gradeIds) {
                $q->whereIn('group_id', $groupIds)->orWhereIn('grade_id', $gradeIds);
            });
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['studentExams'] = $query->get()->toArray();

        // 4. studentPoints
        $since = isset($sinceData['studentPoints']) ? Carbon::parse($sinceData['studentPoints']) : null;
        $query = DB::table('point_transactions')->where('student_id', $student->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['studentPoints'] = $query->get()->toArray();

        return $results;
    }

    private function pullForAcademy(Academy $academy, array $sinceData): array
    {
        $results = [];

        // 1. academyTeachers
        $since = isset($sinceData['academyTeachers']) ? Carbon::parse($sinceData['academyTeachers']) : null;
        $query = DB::table('teachers')
            ->join('academy_teacher', 'teachers.id', '=', 'academy_teacher.teacher_id')
            ->where('academy_teacher.academy_id', $academy->id)
            ->select('teachers.*');
        if ($since) {
            $query->where('teachers.updated_at', '>', $since);
        }
        $results['academyTeachers'] = $query->get()->toArray();

        // 2. academyStudents
        $since = isset($sinceData['academyStudents']) ? Carbon::parse($sinceData['academyStudents']) : null;
        $query = DB::table('students')
            ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.academy_id', $academy->id)
            ->select('students.*');
        if ($since) {
            $query->where('students.updated_at', '>', $since);
        }
        $results['academyStudents'] = $query->get()->toArray();

        // 3. academyLectures
        $since = isset($sinceData['academyLectures']) ? Carbon::parse($sinceData['academyLectures']) : null;
        $query = DB::table('lectures')->where('academy_id', $academy->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['academyLectures'] = $query->get()->toArray();

        return $results;
    }

    private function pullForGuardian(Guardian $guardian, array $sinceData): array
    {
        $results = [];

        // 1. children
        $since = isset($sinceData['children']) ? Carbon::parse($sinceData['children']) : null;
        $query = DB::table('students')->where('guardian_id', $guardian->id);
        if ($since) {
            $query->where('updated_at', '>', $since);
        }
        $results['children'] = $query->get()->toArray();

        return $results;
    }
}
