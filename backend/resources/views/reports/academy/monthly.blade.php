<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>التقرير الشهري</title>
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

        /* Financial Stats */
        .financial-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px 0;
            margin: 0 25px 30px 25px;
        }

        .financial-cell {
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            vertical-align: middle;
        }

        .financial-revenue {
            background-color: #dcfce7;
            border: 1px solid #bbf7d0;
            color: #166534;
        }

        .financial-fees {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
        }

        .financial-net {
            background-color: #dbeafe;
            border: 1px solid #bfdbfe;
            color: #1e40af;
        }

        /* Section Title */
        .section-title {
            margin: 0 40px 15px 40px;
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
            padding-bottom: 8px;
            border-bottom: 2px solid #1e3a5f;
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
        <div class="header-title">التقرير الشهري</div>
        <div class="header-subtitle">{{ $academy['name'] }}</div>
    </div>

    <!-- Meta Info -->
    <table class="meta-table">
        <tr>
            <td class="meta-cell" style="width: 33.33%;">
                <div class="meta-label">الفترة</div>
                <div class="meta-value">
                    @if($period['month'] == 0)
                        السنة الكاملة {{ $period['year'] }}
                    @else
                        {{ date('F', mktime(0, 0, 0, $period['month'], 1)) }} {{ $period['year'] }}
                    @endif
                </div>
            </td>
            <td class="meta-cell" style="width: 33.33%;">
                <div class="meta-label">من - إلى</div>
                <div class="meta-value">{{ $period['from'] }} — {{ $period['to'] }}</div>
            </td>
            <td class="meta-cell" style="width: 33.33%;">
                <div class="meta-label">تاريخ التقرير</div>
                <div class="meta-value">{{ now()->format('Y-m-d H:i') }}</div>
            </td>
        </tr>
    </table>

    <!-- Summary Stats -->
    @if(isset($summary))
        <div class="section-title">ملخص الإحصائيات</div>
        <table class="stats-table">
            <tr>
                <td class="stat-cell" style="width: 23%;">
                    <span class="stat-number">{{ $summary['total_teachers'] ?? 0 }}</span>
                    <span class="stat-label">إجمالي المدرسين</span>
                </td>
                <td style="width: 2%;"></td>
                <td class="stat-cell" style="width: 23%;">
                    <span class="stat-number">{{ $summary['total_students'] ?? 0 }}</span>
                    <span class="stat-label">إجمالي الطلاب</span>
                </td>
                <td style="width: 2%;"></td>
                <td class="stat-cell" style="width: 23%;">
                    <span class="stat-number">{{ $summary['total_attendance_logs'] ?? 0 }}</span>
                    <span class="stat-label">سجلات الحضور</span>
                </td>
                <td style="width: 2%;"></td>
                <td class="stat-cell" style="width: 23%;">
                    <span class="stat-number">{{ $summary['average_duration_minutes'] ?? 0 }}</span>
                    <span class="stat-label">متوسط المدة (دقيقة)</span>
                </td>
            </tr>
        </table>
    @endif

    <!-- Financial Details -->
    @if(isset($financial_details))
        <div class="section-title">التفاصيل المالية</div>
        <table class="financial-table">
            <tr>
                <td class="financial-cell financial-revenue" style="width: 31%;">
                    <span class="stat-number">{{ number_format($financial_details['total_revenue'], 2) }}</span>
                    <span class="stat-label">إجمالي الإيرادات (جنيه)</span>
                </td>
                <td style="width: 3%;"></td>
                <td class="financial-cell financial-fees" style="width: 31%;">
                    <span class="stat-number">{{ number_format($financial_details['platform_fees'], 2) }}</span>
                    <span class="stat-label">رسوم المنصة ({{ $financial_details['platform_fee_percentage'] }}%)</span>
                </td>
                <td style="width: 3%;"></td>
                <td class="financial-cell financial-net" style="width: 31%;">
                    <span class="stat-number">{{ number_format($financial_details['net_revenue'], 2) }}</span>
                    <span class="stat-label">صافي الإيرادات (جنيه)</span>
                </td>
            </tr>
        </table>
    @endif

    <div class="footer">
        تم استخراج هذا التقرير من نظام إدارة التعلم (LMS) • {{ date('Y-m-d H:i') }}
    </div>
</body>

</html>