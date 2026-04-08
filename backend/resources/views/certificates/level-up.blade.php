<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>شهادة - {{ $level_name }}</title>
    <style>
        body { font-family: 'Arial', sans-serif; text-align: center; background-color: #f8f9fa; }
        .certificate-container { border: 10px solid {{ $level_color ?? '#000' }}; padding: 50px; margin: 20px; background-color: #fff; }
        .title { font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .name { font-size: 48px; font-weight: bold; color: {{ $level_color ?? '#000' }}; margin: 20px 0; }
        .level { font-size: 24px; margin: 10px 0; }
        .teacher { font-size: 20px; margin: 10px 0; font-weight: bold; }
        .date { font-size: 18px; margin-top: 40px; color: #555; }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="title">شهادة تفوق</div>
        <div>بكل فخر واعتزاز، نشهد أن الطالب(ة)</div>
        <div class="name">{{ $student_name }}</div>
        <div class="level">قد اجتاز بنجاح وتفوق متطلبات مستوى <strong>{{ $level_name }}</strong></div>
        @if(isset($teacher_name) && $teacher_name)
        <div class="teacher">تحت قيادة المعلم القدير "{{ $teacher_name }}"</div>
        @endif
        <div class="date">تاريخ الإصدار: {{ $achieved_at }}</div>
    </div>
</body>
</html>
