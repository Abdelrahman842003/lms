<!DOCTYPE html>
<html dir="rtl" lang="ar">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>{{ $title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'xbriyaz', 'dejavusans', sans-serif;
            background: #ffffff;
            color: #1e293b;
            direction: rtl;
            text-align: right;
            font-size: 10pt;
            line-height: 1.7;
        }

        /* Page Container */
        .page-container {
            background: #ffffff;
            padding: 0;
            margin: 0;
        }

        /* Header */
        .header {
            background: #1e3a5f;
            color: #ffffff;
            padding: 25px 30px;
        }

        .header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 5px 0;
        }

        .header .subtitle {
            font-size: 10pt;
            opacity: 0.9;
        }

        .period-info {
            margin-top: 12px;
            padding: 8px 15px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 5px;
            display: inline-block;
            font-size: 10pt;
        }

        /* Content Area */
        .content {
            padding: 25px 30px;
        }

        /* Section Headers */
        .section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 13pt;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1e3a5f;
        }

        /* Stats Cards Grid */
        .stats-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-bottom: 15px;
        }

        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 3px solid #1e3a5f;
            padding: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 24pt;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 3px;
        }

        .stat-label {
            font-size: 9pt;
            color: #64748b;
        }

        /* Info Card */
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px 20px;
            margin-bottom: 20px;
        }

        .info-label {
            color: #64748b;
            font-size: 9pt;
            margin-bottom: 2px;
        }

        .info-value {
            color: #1e293b;
            font-weight: bold;
            font-size: 11pt;
        }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }

        table.data-table thead th {
            background: #1e3a5f;
            color: #ffffff;
            font-weight: 600;
            padding: 10px 12px;
            text-align: right;
            font-size: 10pt;
            border: 1px solid #1e3a5f;
        }

        table.data-table tbody tr {
            background: #ffffff;
        }

        table.data-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        table.data-table tbody td {
            padding: 10px 12px;
            font-size: 10pt;
            color: #334155;
            text-align: right;
            border: 1px solid #e2e8f0;
        }

        /* Financial Table */
        .financial-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }

        .financial-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }

        .financial-table tr:last-child td {
            border-bottom: none;
        }

        .financial-table .label {
            color: #475569;
        }

        .financial-table .value {
            text-align: left;
            font-weight: bold;
            color: #1e3a5f;
        }

        .financial-table tr.total {
            background: #f8fafc;
        }

        .financial-table tr.total .value {
            font-size: 12pt;
        }

        /* Status Badges */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: 600;
        }

        .badge-success {
            background: #dcfce7;
            color: #166534;
        }

        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
        }

        /* Money Values */
        .money {
            color: #166534;
            font-weight: bold;
        }

        .money-pending {
            color: #b45309;
            font-weight: bold;
        }

        /* Footer */
        .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 15px 30px;
            margin-top: 20px;
            text-align: center;
            color: #64748b;
            font-size: 9pt;
        }

        .footer-brand {
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 3px;
        }
    </style>
</head>

<body>
    <div class="page-container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $title }}</h1>
            <div class="subtitle">نظام إدارة التعليم</div>
            <div class="period-info">
                الفترة: {{ $report['period']['start'] }} — {{ $report['period']['end'] }}
                ({{ $report['period']['duration_months'] }} شهر)
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            @if($type === 'teacher')
                <!-- Teacher Info Card -->
                <div class="info-card">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 50%; padding: 5px 10px;">
                                <div class="info-label">اسم المدرس</div>
                                <div class="info-value">{{ $report['teacher']['name'] }}</div>
                            </td>
                            <td style="width: 50%; padding: 5px 10px;">
                                <div class="info-label">رقم الهاتف</div>
                                <div class="info-value">{{ $report['teacher']['phone'] }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 10px;">
                                <div class="info-label">تاريخ الانضمام</div>
                                <div class="info-value">{{ $report['teacher']['joined'] }}</div>
                            </td>
                            <td style="padding: 5px 10px;">
                                <div class="info-label">الحالة</div>
                                <div class="info-value">
                                    <span
                                        class="badge {{ $report['teacher']['status'] === 'نشط' ? 'badge-success' : 'badge-danger' }}">
                                        {{ $report['teacher']['status'] }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Stats Section -->
                <div class="section">
                    <div class="section-title">ملخص الإحصائيات</div>

                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_students'] }}</div>
                                <div class="stat-label">إجمالي الطلاب</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['active_students'] }}</div>
                                <div class="stat-label">الطلاب النشطين</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['new_enrollments'] }}</div>
                                <div class="stat-label">اشتراكات جديدة</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_secretaries'] }}</div>
                                <div class="stat-label">السكرتارية</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Subscription Summary -->
                <div class="section">
                    <div class="section-title">ملخص الاشتراكات</div>

                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value" style="color: #1e3a5f;">
                                    {{ number_format($report['summary']['total_due'] ?? 0, 2) }} <span
                                        style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">إجمالي المستحقات</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value" style="color: #166534;">
                                    {{ number_format($report['summary']['total_paid'] ?? 0, 2) }} <span
                                        style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">إجمالي المدفوع</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value" style="color: #991b1b;">
                                    {{ number_format($report['summary']['total_remaining'] ?? 0, 2) }} <span
                                        style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">إجمالي المتبقي</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Teacher Profits -->
                <div class="section">
                    <div class="section-title">ارباح المدرس</div>

                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value" style="color: #166534;">
                                    {{ number_format($report['summary']['confirmed_payments'] ?? 0, 2) }} <span
                                        style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">صافي الارباح</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value">
                                    {{ $report['summary']['paying_students_count'] ?? 0 }}
                                </div>
                                <div class="stat-label">طلاب دفعوا</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value">
                                    {{ $report['summary']['not_paying_students_count'] ?? 0 }}
                                </div>
                                <div class="stat-label">طلاب لم يدفعوا</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Monthly Subscription Breakdown -->

                @if (isset($report['subscription_breakdown']) && count($report['subscription_breakdown']) > 0)
                    <div class="section">
                        <div class="section-title">تفاصيل الاشتراكات الشهرية</div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>الشهر</th>
                                    <th>عدد الطلاب</th>
                                    <th>المستحق</th>
                                    <th>المدفوع</th>
                                    <th>المتبقي</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($report['subscription_breakdown'] as $month)
                                            <tr>
                                                <td style="font-weight: 600;">{{ $month['month_name'] }}</td>
                                                <td>{{ $month['student_count'] }}</td>
                                                <td style="color: #1e3a5f; font-weight: bold;">
                                                    {{ number_format($month['amount_due'], 2) }} ج.م
                                                </td>
                                                <td style="color: #166534; font-weight: bold;">
                                                    {{ number_format($month['amount_paid'], 2) }} ج.م
                                                </td>
                                                <td style="color: #991b1b; font-weight: bold;">
                                                    {{ number_format($month['amount_remaining'], 2) }} ج.م
                                                </td>
                                                <td>
                                                    <span class="badge {{ $month['status'] === 'paid'
                                    ? 'badge-success'
                                    : ($month['status'] === 'partial'
                                        ? 'badge-warning'
                                        : 'badge-danger') }}">
                                                        {{ $month['status_label'] }}
                                                    </span>
                                                </td>
                                            </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif

                <!-- Student Account Breakdown -->
                @if (isset($report['student_account_breakdown']) && count($report['student_account_breakdown']) > 0)
                    <div class="section">
                        <div class="section-title">تفاصيل حساب الطلاب</div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>الشهر</th>
                                    <th>عدد الطلاب</th>
                                    <th>المستحق</th>
                                    <th>المدفوع</th>
                                    <th>المتبقي</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($report['student_account_breakdown'] as $month)
                                            <tr>
                                                <td style="font-weight: 600;">{{ $month['month_name'] }}</td>
                                                <td>{{ $month['student_count'] }}</td>
                                                <td style="color: #1e3a5f; font-weight: bold;">
                                                    {{ number_format($month['amount_due'], 2) }} ج.م
                                                </td>
                                                <td style="color: #166534; font-weight: bold;">
                                                    {{ number_format($month['amount_paid'], 2) }} ج.م
                                                </td>
                                                <td style="color: #991b1b; font-weight: bold;">
                                                    {{ number_format($month['amount_remaining'], 2) }} ج.م
                                                </td>
                                                <td>
                                                    <span class="badge {{ $month['status'] === 'paid'
                                    ? 'badge-success'
                                    : ($month['status'] === 'partial'
                                        ? 'badge-warning'
                                        : 'badge-danger') }}">
                                                        {{ $month['status_label'] }}
                                                    </span>
                                                </td>
                                            </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif

            @else

                <!-- Admin Report Stats -->
                <div class="section">
                    <div class="section-title">ملخص النظام</div>

                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_teachers'] }}</div>
                                <div class="stat-label">إجمالي المدرسين</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_students'] }}</div>
                                <div class="stat-label">إجمالي الطلاب</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_secretaries'] }}</div>
                                <div class="stat-label">السكرتارية</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['active_enrollments'] }}</div>
                                <div class="stat-label">الاشتراكات النشطة</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- New Registrations -->
                <div class="section">
                    <div class="section-title">التسجيلات الجديدة في الفترة</div>

                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value">{{ $report['summary']['new_teachers'] }}</div>
                                <div class="stat-label">مدرسين جدد</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value">{{ $report['summary']['new_students'] }}</div>
                                <div class="stat-label">طلاب جدد</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value">{{ $report['summary']['new_enrollments'] }}</div>
                                <div class="stat-label">اشتراكات جديدة</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Financial Summary -->
                <div class="section">
                    <div class="section-title">الملخص المالي</div>

                    <table class="financial-table">
                        <tr>
                            <td class="label">المدفوعات المؤكدة في الفترة</td>
                            <td class="value money">{{ number_format($report['summary']['confirmed_payments'], 2) }} ج.م
                            </td>
                        </tr>
                        <tr class="total">
                            <td class="label">
                                إجمالي الإيرادات
                                <span style="color: #94a3b8; font-size: 9pt;">
                                    ({{ $report['summary']['active_enrollments'] }} اشتراك ×
                                    {{ $report['summary']['price_per_student'] }} ج.م)
                                </span>
                            </td>
                            <td class="value money">{{ number_format($report['summary']['total_revenue'], 2) }} ج.م</td>
                        </tr>
                    </table>
                </div>

                <!-- Teachers Breakdown -->
                @if(count($report['teachers_breakdown']) > 0)
                    <div class="section">
                        <div class="section-title">تفاصيل المدرسين</div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الاسم</th>
                                    <th>الحالة</th>
                                    <th>الطلاب</th>
                                    <th>النشطين</th>
                                    <th>السكرتارية</th>
                                    <th>الإيرادات</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($report['teachers_breakdown'] as $index => $teacher)
                                    <tr>
                                        <td>{{ $index + 1 }}</td>
                                        <td style="font-weight: 600;">{{ $teacher['name'] }}</td>
                                        <td>
                                            <span
                                                class="badge {{ $teacher['status'] === 'نشط' ? 'badge-success' : 'badge-danger' }}">
                                                {{ $teacher['status'] }}
                                            </span>
                                        </td>
                                        <td>{{ $teacher['total_students'] }}</td>
                                        <td>{{ $teacher['active_students'] }}</td>
                                        <td>{{ $teacher['secretaries'] }}</td>
                                        <td class="money">{{ number_format($teacher['revenue'], 2) }} ج.م</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif
            @endif

            <!-- Monthly Breakdown -->
            @if(count($report['monthly_breakdown']) > 0)
                <div class="section">
                    <div class="section-title">التفصيل الشهري</div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>الشهر</th>
                                <th>اشتراكات جديدة</th>
                                <th>المدفوعات المؤكدة</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($report['monthly_breakdown'] as $month)
                                <tr>
                                    <td style="font-weight: 600;">{{ $month['month_name'] }}</td>
                                    <td>{{ $month['new_enrollments'] }}</td>
                                    <td class="money">{{ number_format($month['confirmed_payments'], 2) }} ج.م</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">نظام إدارة التعليم</div>
            <div>تم إنشاء التقرير في: {{ $report['generated_at'] }}</div>
            <div>جميع الحقوق محفوظة © {{ date('Y') }}</div>
        </div>
    </div>
</body>

</html>