<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #4264eb;
            padding-bottom: 20px;
        }

        .header h1 {
            color: #4264eb;
            font-size: 24px;
            margin: 0 0 10px 0;
        }

        .header h2 {
            color: #666;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
        }

        .meta-info {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }

        .meta-item {
            display: table-cell;
            width: 33%;
            vertical-align: middle;
        }

        .meta-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }

        .meta-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }

        .stats-container {
            margin-bottom: 30px;
            display: table;
            width: 100%;
        }

        .stat-box {
            display: table-cell;
            width: 48%;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .stat-present {
            background-color: rgba(0, 214, 143, 0.1);
            border: 1px solid rgba(0, 214, 143, 0.2);
            color: #00d68f;
        }

        .stat-absent {
            background-color: rgba(255, 91, 91, 0.1);
            border: 1px solid rgba(255, 91, 91, 0.2);
            color: #ff5b5b;
        }

        .stat-number {
            font-size: 24px;
            font-weight: bold;
            display: block;
        }

        .stat-label {
            font-size: 12px;
            opacity: 0.8;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            background-color: #4264eb;
            color: white;
            padding: 12px;
            font-size: 12px;
            text-align: right;
        }

        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 12px;
        }

        tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }

        .status-present {
            background-color: rgba(0, 214, 143, 0.1);
            color: #008f5d;
        }

        .status-absent {
            background-color: rgba(255, 91, 91, 0.1);
            color: #d63030;
        }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>تقرير حضور المحاضرة</h1>
        <h2>{{ $lecture->title }}</h2>
    </div>

    <div class="meta-info">
        <div class="meta-item">
            <div class="meta-label">تاريخ التقرير</div>
            <div class="meta-value">{{ $date }}</div>
        </div>
        <div class="meta-item" style="text-align: center;">
            <div class="meta-label">الصف الدراسي</div>
            <div class="meta-value">{{ $lecture->grade->name ?? '-' }}</div>
        </div>
        <div class="meta-item" style="text-align: left;">
            <div class="meta-label">المجموعة</div>
            <div class="meta-value">{{ $lecture->group->name ?? 'كل المجموعات' }}</div>
        </div>
    </div>

    <div class="stats-container">
        <div class="stat-box stat-present">
            <span class="stat-number">{{ $total_present }}</span>
            <span class="stat-label">حضور</span>
        </div>
        <div class="stat-box" style="width: 4%;"></div> <!-- Spacer -->
        <div class="stat-box stat-absent">
            <span class="stat-number">{{ $total_absent }}</span>
            <span class="stat-label">غياب</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="border-top-right-radius: 8px;">اسم الطالب</th>
                <th>رقم الهاتف</th>
                <th>وقت الحضور</th>
                <th style="border-top-left-radius: 8px;">الحالة</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendees as $attendee)
                <tr>
                    <td>{{ $attendee->student->name }}</td>
                    <td dir="ltr" style="text-align: right;">{{ $attendee->student->phone }}</td>
                    <td>
                        @if($attendee->created_at)
                            {{ $attendee->created_at->format('Y-m-d h:i A') }}
                        @else
                            -
                        @endif
                    </td>
                    <td>
                        @if($attendee->status === 'present')
                            <span class="status-badge status-present">حاضر</span>
                        @else
                            <span class="status-badge status-absent">غائب</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        تم استخراج هذا التقرير من نظام إدارة التعلم (LMS) • {{ date('Y-m-d h:i A') }}
    </div>
</body>

</html>