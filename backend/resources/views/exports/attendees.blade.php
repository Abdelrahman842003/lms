<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>تقرير الحضور - {{ $lecture->title }}</title>
    <style>
        @page {
            margin: 0;
            header: page-header;
            footer: page-footer;
        }

        body {
            font-family: 'xbriyaz', 'dejavusans', sans-serif;
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
            margin-bottom: 30px;
        }

        .meta-cell {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-right: 3px solid #1e3a5f;
            padding: 15px;
            width: 33.33%;
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
            margin-bottom: 30px;
        }

        .stat-cell {
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            width: 48%;
            vertical-align: middle;
        }

        .stat-present {
            background-color: #dcfce7;
            border: 1px solid #bbf7d0;
            color: #166534;
        }

        .stat-absent {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
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

        /* Status Badges */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }

        .badge-present {
            background-color: #dcfce7;
            color: #166534;
        }

        .badge-absent {
            background-color: #fee2e2;
            color: #991b1b;
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
        <div class="header-title">تقرير حضور المحاضرة</div>
        <div class="header-subtitle">{{ $lecture->title }}</div>
    </div>

    <!-- Meta Info using Table for reliable layout -->
    <table class="meta-table">
        <tr>
            <td class="meta-cell">
                <div class="meta-label">تاريخ التقرير</div>
                <div class="meta-value">{{ $date }}</div>
            </td>
            <td class="meta-cell">
                <div class="meta-label">الصف الدراسي</div>
                <div class="meta-value">{{ $lecture->grade->name ?? '-' }}</div>
            </td>
            <td class="meta-cell" style="border-left: none;">
                <div class="meta-label">المجموعة</div>
                <div class="meta-value">{{ $lecture->group->name ?? 'كل المجموعات' }}</div>
            </td>
        </tr>
    </table>

    <!-- Stats using Table for reliable layout -->
    <table class="stats-table">
        <tr>
            <td class="stat-cell stat-present">
                <span class="stat-number">{{ $total_present }}</span>
                <span class="stat-label">حضور</span>
            </td>
            <td style="width: 4%;"></td> <!-- Spacer -->
            <td class="stat-cell stat-absent">
                <span class="stat-number">{{ $total_absent }}</span>
                <span class="stat-label">غياب</span>
            </td>
        </tr>
    </table>

    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th width="35%">اسم الطالب</th>
                    <th width="20%">رقم الهاتف</th>
                    <th width="25%">وقت الحضور</th>
                    <th width="20%">الحالة</th>
                </tr>
            </thead>
            <tbody>
                @foreach($attendees as $attendee)
                    <tr>
                        <td style="font-weight: bold;">{{ $attendee->student->name }}</td>
                        <td dir="ltr" style="text-align: right; font-family: sans-serif;">{{ $attendee->student->phone }}
                        </td>
                        <td>
                            @if($attendee->created_at)
                                {{ $attendee->created_at->format('Y-m-d h:i A') }}
                            @else
                                -
                            @endif
                        </td>
                        <td>
                            @if($attendee->status === 'present')
                                <span class="badge badge-present">حاضر</span>
                            @else
                                <span class="badge badge-absent">غائب</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        تم استخراج هذا التقرير من نظام إدارة التعلم (LMS) • {{ date('Y-m-d h:i A') }}
    </div>
</body>

</html>