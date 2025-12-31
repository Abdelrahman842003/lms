<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }

        th {
            background-color: #f2f2f2;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .summary {
            margin-bottom: 20px;
        }

        .status-present {
            color: green;
            font-weight: bold;
        }

        .status-absent {
            color: red;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>تقرير حضور المحاضرة</h2>
        <h3>{{ $lecture->title }}</h3>
        <p>تاريخ التقرير: {{ $date }}</p>
    </div>

    <div class="summary">
        <p><strong>إجمالي الحضور:</strong> {{ $total_present }}</p>
        <p><strong>إجمالي الغياب:</strong> {{ $total_absent }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>اسم الطالب</th>
                <th>رقم الهاتف</th>
                <th>الحالة</th>
                <th>وقت الحضور</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendees as $attendance)
                <tr>
                    <td>{{ $attendance->student->name ?? 'غير معروف' }}</td>
                    <td>{{ $attendance->student->phone ?? '-' }}</td>
                    <td>
                        @if($attendance->status === 'present')
                            <span class="status-present">حاضر</span>
                        @else
                            <span class="status-absent">غائب</span>
                        @endif
                    </td>
                    <td>{{ $attendance->created_at->format('Y-m-d H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>