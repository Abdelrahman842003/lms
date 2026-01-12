<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>تقرير المدرسين</title>
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #1e293b;
            font-size: 10pt;
        }

        /* Header */
        .header-container {
            background-color: #1e3a5f;
            color: white;
            padding: 30px 40px;
            margin-bottom: 30px;
        }

        .header-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }

        /* Meta Info Table */
        .meta-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px 0;
            margin: 0 25px 30px 25px;
        }

        .meta-cell {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-right: 3px solid #1e3a5f;
            padding: 15px;
            vertical-align: top;
        }

        .meta-label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .meta-value {
            font-size: 12px;
            font-weight: bold;
            color: #1e293b;
        }

        /* Stats Table */
        .stats-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px 0;
            margin: 0 25px 30px 25px;
        }

        .stat-cell {
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            vertical-align: middle;
            background-color: #dbeafe;
            border: 1px solid #bfdbfe;
            color: #1e40af;
        }

        .stat-number {
            font-size: 28px;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 12px;
            font-weight: bold;
        }

        /* Data Table */
        .table-container {
            margin: 0 40px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }

        .data-table th {
            background-color: #1e3a5f;
            color: white;
            padding: 12px 15px;
            font-size: 11px;
            font-weight: bold;
            text-align: right;
            border: 1px solid #1e3a5f;
        }

        .data-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
            border-left: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            font-size: 11px;
            color: #334155;
        }

        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 30px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
    </style>
</head>

<body>
    <div class="header-container">
        <div class="header-title">تقرير المدرسين</div>
        <div class="header-subtitle">{{ $academy['name'] }}</div>
    </div>

    <!-- Meta Info -->
    <table class="meta-table">
        <tr>
            <td class="meta-cell" style="width: 50%;">
                <div class="meta-label">تاريخ التقرير</div>
                <div class="meta-value">{{ now()->format('Y-m-d H:i') }}</div>
            </td>
            <td class="meta-cell" style="width: 50%;">
                <div class="meta-label">نوع التقرير</div>
                <div class="meta-value">إحصائيات شاملة للمدرسين</div>
            </td>
        </tr>
    </table>

    <!-- Stats -->
    @if(isset($summary))
        <table class="stats-table">
            <tr>
                <td class="stat-cell" style="width: 48%;">
                    <span class="stat-number">{{ $summary['total_teachers'] ?? 0 }}</span>
                    <span class="stat-label">إجمالي المدرسين</span>
                </td>
                <td style="width: 4%;"></td>
                <td class="stat-cell" style="width: 48%;">
                    <span class="stat-number">{{ $summary['total_students'] ?? 0 }}</span>
                    <span class="stat-label">إجمالي الطلاب</span>
                </td>
            </tr>
        </table>
    @endif

    <!-- Teachers Table -->
    @if(isset($teachers) && count($teachers) > 0)
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="25%">اسم المدرس</th>
                        <th width="20%">رقم الهاتف</th>
                        <th width="15%">عدد الطلاب</th>
                        <th width="15%">الحضور</th>
                        <th width="15%">الغياب</th>
                        <th width="10%">المدة (دقيقة)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($teachers as $teacherData)
                        <tr>
                            <td style="font-weight: bold;">{{ $teacherData['teacher']->name ?? '-' }}</td>
                            <td>{{ $teacherData['teacher']->phone ?? '-' }}</td>
                            <td>{{ $teacherData['students_count'] ?? 0 }}</td>
                            <td>{{ $teacherData['attendance']['present'] ?? 0 }}</td>
                            <td>{{ $teacherData['attendance']['absent'] ?? 0 }}</td>
                            <td>{{ $teacherData['attendance']['total_duration_minutes'] ?? 0 }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <div class="footer">
        تم استخراج هذا التقرير من نظام إدارة التعلم (LMS) • {{ date('Y-m-d H:i') }}
    </div>
</body>

</html>