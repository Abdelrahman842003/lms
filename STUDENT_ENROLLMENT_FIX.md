# إصلاح: السماح بإضافة الطالب للمدرس في سياقات مختلفة

## المشكلة
كان النظام يمنع إضافة طالب مرتبط بمدرس داخل أكاديمية من الارتباط بنفس المدرس كمستقل (أو العكس).

### السلوك السابق
- إذا كان الطالب مرتبطاً بالمدرس في الأكاديمية
- عند محاولة إضافته للمدرس كمستقل
- النظام يرفض ويقول "الطالب مسجل بالفعل"

## السبب
الكود كان يتحقق من وجود `Enrollment` بين الطالب والمدرس **بشكل عام** دون مراعاة السياق (أكاديمية أو مستقل).

## الحل
تم تعديل المنطق ليتحقق من `academy_id` أيضاً:
- إذا كان الطالب يُضاف في سياق أكاديمية معينة، يتحقق النظام فقط من وجود تسجيل في **نفس الأكاديمية**
- إذا كان الطالب يُضاف كمستقل، يتحقق النظام فقط من وجود تسجيل **مستقل** (academy_id = null)

## الملفات المعدلة

### 1. `/backend/app/Services/Teacher/StudentService.php`
#### التعديل في `createStudent()` method (السطور 67-102)

**قبل:**
```php
if ($existingStudent) {
    // Check if already enrolled with this teacher
    $existingEnrollment = Enrollment::where('student_id', $existingStudent->id)
        ->where('teacher_id', $teacher->id)
        ->first();
    // ...
}
```

**بعد:**
```php
if ($existingStudent) {
    // Get academy_id from grade if provided
    $academyIdFromGrade = null;
    if (!empty($data['grade_id'])) {
        $grade = \App\Models\Grade::find($data['grade_id']);
        $academyIdFromGrade = $grade?->academy_id;
    }

    // Check if already enrolled with this teacher IN THE SAME CONTEXT
    $existingEnrollment = Enrollment::where('student_id', $existingStudent->id)
        ->where('teacher_id', $teacher->id);
    
    // Filter by academy context
    if ($academyIdFromGrade) {
        $existingEnrollment->where('academy_id', $academyIdFromGrade);
    } else {
        $existingEnrollment->whereNull('academy_id');
    }
    
    $existingEnrollment = $existingEnrollment->first();
    // ...
}
```

### 2. `/backend/app/Http/Controllers/Teacher/StudentController.php`
#### التعديل في `searchByPhone()` method (السطور 47-103)

**قبل:**
```php
if ($student) {
    // Check if already enrolled with this teacher
    $teacher = $this->getTeacherFromRequest($request);
    $enrollment = Enrollment::where('student_id', $student->id)
        ->where('teacher_id', $teacher->id)
        ->first();
    // ...
}
```

**بعد:**
```php
if ($student) {
    $teacher = $this->getTeacherFromRequest($request);
    
    // Get academy context from the request
    $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
    $gradeId = $request->input('grade_id');
    
    // Determine academy_id from grade if provided
    $academyIdFromGrade = null;
    if ($gradeId) {
        $grade = \App\Models\Grade::find($gradeId);
        $academyIdFromGrade = $grade?->academy_id;
    } else if ($academyId && $academyId !== 'independent') {
        $academyIdFromGrade = $academyId;
    }
    
    // Check if already enrolled with this teacher IN THE SAME CONTEXT
    $enrollmentQuery = Enrollment::where('student_id', $student->id)
        ->where('teacher_id', $teacher->id);
    
    // Filter by academy context
    if ($academyIdFromGrade) {
        $enrollmentQuery->where('academy_id', $academyIdFromGrade);
    } else {
        $enrollmentQuery->whereNull('academy_id');
    }
    
    $enrollment = $enrollmentQuery->first();
    // ...
}
```

## النتيجة
الآن يمكن للطالب أن:
1. يكون مرتبطاً بالمدرس في الأكاديمية A
2. وفي نفس الوقت يكون مرتبطاً بنفس المدرس كمستقل
3. أو يكون مرتبطاً بنفس المدرس في أكاديميات مختلفة

كل سياق (أكاديمية أو مستقل) له تسجيل `Enrollment` منفصل.

## ملاحظات مهمة
- هذا التعديل متسق مع منطق `Academy/StudentService` الذي كان يتحقق من `academy_id` بالفعل
- التعديل لا يؤثر على البيانات الموجودة
- يحافظ على سلامة البيانات ويمنع التكرار في نفس السياق
