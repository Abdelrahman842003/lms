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

        .generated-at {
            margin-top: 10px;
            font-size: 9pt;
            opacity: 0.8;
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

        /* Info Card (name, phone, join date) */
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

        /* Stats Cards Grid */
        .stats-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
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
            font-size: 22pt;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 3px;
        }

        .stat-label {
            font-size: 9pt;
            color: #64748b;
        }

        .stat-value.money {
            color: #166534;
        }

        .stat-value.money-red {
            color: #991b1b;
        }

        .stat-value.money-blue {
            color: #1e3a5f;
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

        .financial-table tr.highlight {
            background: #f0f9ff;
        }

        .financial-table tr.highlight .value {
            color: #166534;
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

        .badge-warning {
            background: #fef9c3;
            color: #854d0e;
        }

        /* Plan info row */
        .plan-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
            margin-bottom: 15px;
        }

        .plan-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10pt;
        }

        .plan-table td:first-child {
            color: #64748b;
            width: 40%;
        }

        .plan-table td:last-child {
            font-weight: bold;
        }

        .plan-table tr:last-child td {
            border-bottom: none;
        }

        /* Data table */
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

        /* Progress Bar */
        .progress-bar-bg {
            background: #e2e8f0;
            height: 8px;
            border-radius: 4px;
            margin-top: 5px;
        }

        .progress-bar-fill {
            background: #166534;
            height: 8px;
            border-radius: 4px;
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
            <div class="generated-at">تاريخ الإنشاء: {{ $report['generated_at'] }}</div>
        </div>

        <!-- Content -->
        <div class="content">

            {{-- ============================================================ --}}
            {{-- ACADEMY REPORT --}}
            {{-- ============================================================ --}}
            @if($type === 'academy')

                {{-- Academy Info --}}
                <div class="info-card">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 50%; padding: 5px 10px;">
                                <div class="info-label">اسم الأكاديمية</div>
                                <div class="info-value">{{ $report['academy']['name'] }}</div>
                            </td>
                            <td style="width: 50%; padding: 5px 10px;">
                                <div class="info-label">رقم الهاتف</div>
                                <div class="info-value">{{ $report['academy']['phone'] }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 10px;">
                                <div class="info-label">تاريخ الانضمام</div>
                                <div class="info-value">{{ $report['academy']['joined'] }}</div>
                            </td>
                            <td style="padding: 5px 10px;">
                                <div class="info-label">الحالة</div>
                                <div class="info-value">
                                    <span
                                        class="badge {{ $report['academy']['status'] === 'نشط' ? 'badge-success' : 'badge-danger' }}">
                                        {{ $report['academy']['status'] }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                {{-- Stats --}}
                <div class="section">
                    <div class="section-title">ملخص الإحصائيات</div>
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_teachers'] }}</div>
                                <div class="stat-label">إجمالي المدرسين</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['active_teachers'] }}</div>
                                <div class="stat-label">المدرسين النشطين</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_academy_students'] }}</div>
                                <div class="stat-label">إجمالي الطلاب</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_enrollments'] }}</div>
                                <div class="stat-label">التسجيلات</div>
                            </td>
                        </tr>
                    </table>
                </div>

                {{-- Plan & Payment --}}
                <div class="section">
                    <div class="section-title">معلومات الباقة والدفع</div>
                    <table class="plan-table">
                        <tr>
                            <td>الباقة الحالية</td>
                            <td>
                                @if($report['academy']['plan_type'] === 'trial') فترة تجريبية
                                @elseif($report['academy']['plan_type'] === 'term') باقة فصلية
                                @elseif($report['academy']['plan_type'] === 'custom') باقة مخصصة
                                @else {{ $report['academy']['plan_type'] ?? 'بدون باقة' }}
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>الطلاب المسموح بهم</td>
                            <td>
                                @if($report['academy']['is_unlimited_students'] ?? false)
                                    غير محدود
                                @else
                                    {{ $report['academy']['plan_max_students'] ?? 0 }} طالب
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>نسبة استخدام الباقة</td>
                            <td>
                                @php
                                    $maxStudents = $report['academy']['plan_max_students'] ?? 0;
                                    $currentStudents = $report['summary']['total_academy_students'];
                                    $pct = ($maxStudents > 0) ? min(100, round(($currentStudents / $maxStudents) * 100)) : 0;
                                @endphp
                                {{ $pct }}%
                                ({{ $currentStudents }} / {{ $maxStudents ?: '∞' }})
                            </td>
                        </tr>
                        <tr>
                            <td>تاريخ انتهاء الباقة</td>
                            <td>{{ $report['academy']['subscription_expiry'] ?? 'غير محدد' }}</td>
                        </tr>
                        <tr>
                            <td>الأيام المتبقية</td>
                            <td>
                                @if(isset($report['academy']['days_remaining']))
                                    {{ $report['academy']['days_remaining'] }} يوم
                                @else
                                    غير محدد
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>تاريخ الانضمام للمنصة</td>
                            <td>{{ $report['academy']['joined'] }}</td>
                        </tr>
                    </table>
                </div>

                {{-- Financial Summary --}}
                <div class="section">
                    <div class="section-title">الملخص المالي</div>
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money-blue">
                                    {{ number_format($report['summary']['subscription_fee'] ?? 0, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">السعر المدفوع للمنصة</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money">
                                    {{ number_format($report['summary']['confirmed_payments'] ?? 0, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">المدفوع فعلياً</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money-red">
                                    {{ number_format($report['summary']['remaining_balance'] ?? 0, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">المتبقي</div>
                            </td>
                        </tr>
                    </table>

                    @php
                        $fee = $report['summary']['subscription_fee'] ?? 0;
                        $paid = $report['summary']['confirmed_payments'] ?? 0;
                        $payPct = $fee > 0 ? min(100, round(($paid / $fee) * 100)) : 0;
                        $payStatus = $report['summary']['payment_status'] ?? 'unpaid';
                    @endphp
                    <table class="financial-table" style="margin-top: 10px;">
                        <tr>
                            <td class="label">حالة الدفع</td>
                            <td class="value">
                                <span
                                    class="badge {{ $payStatus === 'paid' ? 'badge-success' : ($payStatus === 'partial' ? 'badge-warning' : 'badge-danger') }}">
                                    {{ $payStatus === 'paid' ? 'مدفوع' : ($payStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع') }}
                                </span>
                            </td>
                        </tr>
                        <tr class="{{ $payStatus === 'paid' ? 'highlight' : '' }}">
                            <td class="label">نسبة الدفع ({{ $payPct }}%)</td>
                            <td class="value">
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill"
                                        style="width: {{ $payPct }}%; background: {{ $payStatus === 'paid' ? '#166534' : ($payStatus === 'partial' ? '#b45309' : '#991b1b') }};">
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="label">سعر الطالب / شهر</td>
                            <td class="value">{{ $report['summary']['price_per_student'] ?? 0 }} ج.م</td>
                        </tr>
                    </table>
                </div>

                {{-- ============================================================ --}}
                {{-- TEACHER REPORT --}}
                {{-- ============================================================ --}}
            @elseif($type === 'teacher')

                {{-- Teacher Info --}}
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

                {{-- Stats --}}
                <div class="section">
                    <div class="section-title">ملخص الإحصائيات</div>
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_students'] ?? 0 }}</div>
                                <div class="stat-label">إجمالي الطلاب</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['active_students'] ?? 0 }}</div>
                                <div class="stat-label">الطلاب النشطين</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['teacher']['total_secretaries'] ?? 0 }}</div>
                                <div class="stat-label">السكرتارية</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['teacher']['member_since_days'] ?? 0 }}</div>
                                <div class="stat-label">أيام العضوية</div>
                            </td>
                        </tr>
                    </table>
                </div>

                {{-- Plan & Payment --}}
                <div class="section">
                    <div class="section-title">معلومات الباقة والدفع</div>
                    <table class="plan-table">
                        <tr>
                            <td>الباقة الحالية</td>
                            <td>
                                @if($report['teacher']['plan_type'] === 'trial') فترة تجريبية
                                @elseif($report['teacher']['plan_type'] === 'term') باقة فصلية
                                @elseif($report['teacher']['plan_type'] === 'custom') باقة مخصصة
                                @else {{ $report['teacher']['plan_type'] ?? 'بدون باقة' }}
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>الطلاب المسموح بهم</td>
                            <td>
                                @if($report['teacher']['is_unlimited_students'] ?? false)
                                    غير محدود
                                @else
                                    {{ $report['teacher']['plan_max_students'] ?? 0 }} طالب
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>نسبة استخدام الباقة</td>
                            <td>
                                @php
                                    $maxSt = $report['teacher']['plan_max_students'] ?? 0;
                                    $currSt = $report['summary']['total_students'] ?? 0;
                                    $usePct = ($maxSt > 0) ? min(100, round(($currSt / $maxSt) * 100)) : 0;
                                @endphp
                                {{ $usePct }}% ({{ $currSt }} / {{ $maxSt ?: '∞' }})
                            </td>
                        </tr>
                        <tr>
                            <td>تاريخ انتهاء الباقة</td>
                            <td>{{ $report['teacher']['subscription_expiry'] ?? 'غير محدد' }}</td>
                        </tr>
                        <tr>
                            <td>الأيام المتبقية</td>
                            <td>
                                @if(isset($report['teacher']['days_remaining']))
                                    {{ $report['teacher']['days_remaining'] }} يوم
                                @else
                                    غير محدد
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>مدة الباقة</td>
                            <td>
                                @if($report['teacher']['plan_duration_months'] ?? 0)
                                    {{ $report['teacher']['plan_duration_months'] }} شهر
                                @else
                                    غير محدد
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>تاريخ آخر دفعة</td>
                            <td>{{ $report['teacher']['last_payment_date'] ?? 'لا يوجد' }}</td>
                        </tr>
                    </table>
                </div>

                {{-- Financial Summary --}}
                <div class="section">
                    <div class="section-title">الملخص المالي</div>
                    @php
                        $teacherFee = $report['financial_details']['total_revenue'] ?? $report['summary']['subscription_fee'] ?? 0;
                        $teacherPaid = $report['teacher']['paid_amount'] ?? 0;
                        $teacherDue = $report['teacher']['amount_due'] ?? 0;
                        $tPct = $report['teacher']['payment_percentage'] ?? 0;
                        $hasSubscription = $report['teacher']['has_subscription'] ?? false;
                    @endphp
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money-blue">
                                    {{ number_format($teacherFee, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">السعر المدفوع للمنصة</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money">
                                    {{ number_format($teacherPaid, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">المدفوع فعلياً</div>
                            </td>
                            <td class="stat-card" style="width: 33%;">
                                <div class="stat-value money-red">
                                    {{ number_format($teacherDue, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">المتبقي</div>
                            </td>
                        </tr>
                    </table>

                    <table class="financial-table" style="margin-top: 10px;">
                        <tr>
                            <td class="label">حالة الاشتراك</td>
                            <td class="value">
                                <span class="badge {{ $hasSubscription ? 'badge-success' : 'badge-danger' }}">
                                    {{ $hasSubscription ? 'تم الدفع' : 'لم يتم الدفع' }}
                                </span>
                            </td>
                        </tr>
                        <tr class="{{ $tPct >= 100 ? 'highlight' : '' }}">
                            <td class="label">نسبة الدفع ({{ $tPct }}%)</td>
                            <td class="value">
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill"
                                        style="width: {{ min($tPct, 100) }}%; background: {{ $tPct >= 100 ? '#166534' : ($tPct > 0 ? '#b45309' : '#991b1b') }};">
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="label">سعر الطالب / شهر</td>
                            <td class="value">{{ $report['summary']['price_per_student'] ?? 0 }} ج.م</td>
                        </tr>
                    </table>
                </div>

                {{-- ============================================================ --}}
                {{-- ADMIN REPORT --}}
                {{-- ============================================================ --}}
            @else

                {{-- System Summary --}}
                <div class="section">
                    <div class="section-title">ملخص النظام</div>
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_teachers'] }}</div>
                                <div class="stat-label">
                                    إجمالي المدرسين<br>
                                    <span style="font-size: 8pt;">{{ $report['summary']['active_teachers'] }} نشط |
                                        {{ $report['summary']['suspended_teachers'] }} معلق</span>
                                </div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_students'] }}</div>
                                <div class="stat-label">
                                    إجمالي الطلاب<br>
                                    <span style="font-size: 8pt;">{{ $report['summary']['new_students'] }} جديد</span>
                                </div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_academies'] }}</div>
                                <div class="stat-label">إجمالي الأكاديميات</div>
                            </td>
                            <td class="stat-card" style="width: 25%;">
                                <div class="stat-value">{{ $report['summary']['total_secretaries'] }}</div>
                                <div class="stat-label">السكرتارية</div>
                            </td>
                        </tr>
                    </table>
                </div>

                {{-- Financial Summary --}}
                <div class="section">
                    <div class="section-title">الملخص المالي</div>
                    <table class="stats-grid">
                        <tr>
                            <td class="stat-card" style="width: 50%;">
                                <div class="stat-value money-blue">
                                    {{ number_format($report['summary']['total_subscription_fees'] ?? 0, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">
                                    إجمالي رسوم الاشتراكات<br>
                                    <span style="font-size: 8pt;">{{ $report['summary']['total_subscriptions'] ?? 0 }}
                                        اشتراك</span>
                                </div>
                            </td>
                            <td class="stat-card" style="width: 50%;">
                                <div class="stat-value money">
                                    {{ number_format($report['summary']['net_platform_profit'] ?? 0, 0) }}
                                    <span style="font-size: 12pt;">ج.م</span>
                                </div>
                                <div class="stat-label">
                                    صافي ربح المنصة<br>
                                    <span style="font-size: 8pt;">
                                        مدرسين: {{ number_format($report['summary']['independent_commission'] ?? 0, 0) }} |
                                        أكاديميات: {{ number_format($report['summary']['academy_platform_share'] ?? 0, 0) }}
                                    </span>
                                </div>
                            </td>
                        </tr>
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