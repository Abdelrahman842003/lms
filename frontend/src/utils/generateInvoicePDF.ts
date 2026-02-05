/**
 * Generate Invoice PDF using browser print functionality
 * Creates a hidden iframe with invoice HTML and triggers print/save as PDF
 */

interface InvoiceData {
  teacher: {
    name: string;
    email: string;
    phone?: string;
  };
  invoice_number: string;
  invoice_date: string;
  plan_type: string;
  duration_text: string;
  students_count: number;
  expires_at?: string;
  total_paid: number;
  base_cost?: number;
  discount?: number;
  final_cost?: number;
  is_current: boolean;
  old_plan?: {
    plan_type: string;
    duration_months: number;
    remaining_months: number;
    students_count: number;
    total_paid: number;
    remaining_value: number;
    expires_at: string;
  } | null;
}

const getInvoiceHTML = (data: InvoiceData): string => {
  const planTypeText = data.plan_type === 'trial' ? 'تجريبية' : 
                       data.plan_type === 'term' ? 'مدة ثابتة' : 'مخصصة';
  
  const planTypeBadgeClass = data.plan_type === 'trial' ? 'badge-trial' : 
                              data.plan_type === 'term' ? 'badge-term' : 'badge-custom';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة اشتراك - ${data.teacher.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 15px;
            background: #fff;
            line-height: 1.4;
            font-size: 13px;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
            border: 2px solid #e5e7eb;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            text-align: center;
            padding: 20px 15px;
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 13px;
            opacity: 0.95;
        }
        
        .content {
            padding: 15px;
        }
        
        .invoice-meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 3px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .meta-value {
            font-size: 13px;
            color: #1f2937;
            font-weight: 700;
        }
        
        .section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #4F46E5;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            font-size: 12px;
        }
        
        .info-label {
            font-weight: 600;
            color: #4b5563;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 700;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 700;
        }
        
        .badge-trial {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-term {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .badge-custom {
            background: #e0e7ff;
            color: #3730a3;
        }
        
        .badge-current {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge-new {
            background: #ddd6fe;
            color: #5b21b6;
        }
        
        .notes-box {
            background: #fef3c7;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
            font-size: 11px;
            color: #854d0e;
        }
        
        .notes-box ul {
            margin: 8px 0 0 15px;
            line-height: 1.5;
        }
        
        .footer {
            background: #f9fafb;
            text-align: center;
            padding: 15px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 11px;
        }
        
        .footer strong {
            color: #4F46E5;
            display: block;
            margin-bottom: 5px;
            font-size: 13px;
        }
        
        .total-amount {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            margin: 10px 0;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
        }
        
        .total-amount .label {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .total-amount .amount {
            font-size: 28px;
            font-weight: 700;
            margin: 5px 0;
        }
        
        .total-amount .amount-words {
            font-size: 12px;
            opacity: 0.85;
            font-style: italic;
        }
        
        .comparison-section {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .comparison-header {
            text-align: center;
            font-size: 15px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
        }
        
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 10px;
            align-items: start;
        }
        
        .plan-box {
            background: white;
            border-radius: 6px;
            padding: 12px;
            border: 2px solid #e5e7eb;
        }
        
        .plan-box.old-plan {
            border-color: #fbbf24;
            background: #fffbeb;
        }
        
        .plan-box.new-plan {
            border-color: #10b981;
            background: #ecfdf5;
        }
        
        .plan-header {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .plan-box.old-plan .plan-header {
            color: #d97706;
            border-color: #fbbf24;
        }
        
        .plan-box.new-plan .plan-header {
            color: #059669;
            border-color: #10b981;
        }
        
        .plan-detail {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 11px;
            border-bottom: 1px dashed #e5e7eb;
        }
        
        .plan-detail:last-child {
            border-bottom: none;
        }
        
        .plan-detail-label {
            color: #64748b;
            font-weight: 600;
        }
        
        .plan-detail-value {
            color: #1e293b;
            font-weight: 700;
        }
        
        .comparison-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #3b82f6;
            font-weight: 700;
            padding: 0 10px;
        }
        
        .difference-box {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border-radius: 6px;
            padding: 12px;
            margin-top: 12px;
            text-align: center;
        }
        
        .difference-title {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 6px;
        }
        
        .difference-items {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 8px;
        }
        
        .difference-item {
            background: rgba(255, 255, 255, 0.15);
            padding: 6px;
            border-radius: 4px;
        }
        
        .difference-item-label {
            font-size: 10px;
            opacity: 0.85;
            margin-bottom: 3px;
        }
        
        .difference-item-value {
            font-size: 13px;
            font-weight: 700;
        }
        
        .difference-item.positive {
            background: rgba(16, 185, 129, 0.2);
        }
        
        .difference-item.negative {
            background: rgba(239, 68, 68, 0.2);
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            .container {
                box-shadow: none;
                border: none;
            }
            .header {
                page-break-after: avoid;
            }
            .total-amount {
                page-break-inside: avoid;
            }
            .footer {
                page-break-inside: avoid;
            }
        }
        
        @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
        }
        
        /* Remove default browser print styles */
        html, body {
            height: auto;
            overflow: visible;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>فاتورة اشتراك</h1>
            <p>منصة نطاق للتعليم الإلكتروني</p>
        </div>
        
        <div class="content">
            <!-- Invoice Meta Info -->
            <div class="invoice-meta">
                <div class="meta-item">
                    <div class="meta-label">رقم الفاتورة</div>
                    <div class="meta-value">${data.invoice_number}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">تاريخ الإصدار</div>
                    <div class="meta-value">${data.invoice_date}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">حالة الفاتورة</div>
                    <div class="meta-value">
                        <span class="badge ${data.is_current ? 'badge-current' : 'badge-new'}">
                            ${data.is_current ? 'باقة حالية' : 'باقة جديدة'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Teacher Information -->
            <div class="section">
                <div class="section-title">📋 بيانات المعلم</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">الاسم الكامل:</span>
                        <span class="info-value">${data.teacher.name}</span>
                    </div>
                    ${data.teacher.phone ? `
                    <div class="info-item">
                        <span class="info-label">رقم الهاتف:</span>
                        <span class="info-value">${data.teacher.phone}</span>
                    </div>
                    ` : ''}
                    <div class="info-item">
                        <span class="info-label">تاريخ التسجيل:</span>
                        <span class="info-value">${new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
            </div>
            
            ${data.old_plan && !data.is_current ? `
            <!-- Subscription Comparison -->
            <div class="section">
                <div class="comparison-section">
                    <div class="comparison-header">🔄 مقارنة الاشتراكات</div>
                    
                    <div class="comparison-grid">
                        <!-- Old Plan -->
                        <div class="plan-box old-plan">
                            <div class="plan-header">📦 الاشتراك القديم</div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">النوع:</span>
                                <span class="plan-detail-value">${data.old_plan.plan_type === 'trial' ? 'تجريبي' : data.old_plan.plan_type === 'term' ? 'مدة ثابتة' : 'مخصص'}</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">المدة:</span>
                                <span class="plan-detail-value">${data.old_plan.duration_months} شهر</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">عدد الطلاب:</span>
                                <span class="plan-detail-value">${data.old_plan.students_count === 0 ? '♾️ لا نهائي' : `${data.old_plan.students_count} طالب`}</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">المبلغ المدفوع:</span>
                                <span class="plan-detail-value">${Math.round(data.old_plan.total_paid).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">الشهور المتبقية:</span>
                                <span class="plan-detail-value">${data.old_plan.remaining_months} شهر</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">القيمة المتبقية:</span>
                                <span class="plan-detail-value" style="color: #d97706;">${Math.round(data.old_plan.remaining_value).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                        </div>
                        
                        <!-- Arrow -->
                        <div class="comparison-arrow">➜</div>
                        
                        <!-- New Plan -->
                        <div class="plan-box new-plan">
                            <div class="plan-header">✨ الاشتراك الجديد</div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">النوع:</span>
                                <span class="plan-detail-value">${data.plan_type === 'trial' ? 'تجريبي' : data.plan_type === 'term' ? 'مدة ثابتة' : 'مخصص'}</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">المدة:</span>
                                <span class="plan-detail-value">${data.duration_text}</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">عدد الطلاب:</span>
                                <span class="plan-detail-value">${data.students_count === 0 ? '♾️ لا نهائي' : `${data.students_count} طالب`}</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">التكلفة الأساسية:</span>
                                <span class="plan-detail-value">${Math.round(data.base_cost || data.total_paid).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">الخصم المطبق:</span>
                                <span class="plan-detail-value" style="color: #059669;">- ${Math.round(data.discount || 0).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div class="plan-detail">
                                <span class="plan-detail-label">المبلغ النهائي:</span>
                                <span class="plan-detail-value" style="color: #059669; font-size: 13px;">${Math.round(data.final_cost || data.total_paid).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Difference Summary -->
                    <div class="difference-box">
                        <div class="difference-title">📊 الفروقات</div>
                        <div class="difference-items">
                            <div class="difference-item ${data.students_count - data.old_plan.students_count > 0 ? 'positive' : data.students_count - data.old_plan.students_count < 0 ? 'negative' : ''}">
                                <div class="difference-item-label">فرق الطلاب</div>
                                <div class="difference-item-value">
                                    ${data.students_count === 0 || data.old_plan.students_count === 0 ? '—' : 
                                      (data.students_count - data.old_plan.students_count > 0 ? '+' : '') + (data.students_count - data.old_plan.students_count)}
                                </div>
                            </div>
                            <div class="difference-item">
                                <div class="difference-item-label">فرق المدة</div>
                                <div class="difference-item-value">
                                    ${(() => {
                                        const newMonths = parseInt(data.duration_text.match(/(\d+)/)?.[1] || '0');
                                        const diff = newMonths - data.old_plan.duration_months;
                                        return diff > 0 ? `+${diff} شهر` : diff < 0 ? `${diff} شهر` : 'نفس المدة';
                                    })()}
                                </div>
                            </div>
                            <div class="difference-item positive">
                                <div class="difference-item-label">الوفورات</div>
                                <div class="difference-item-value">${Math.round(data.discount || 0).toLocaleString('ar-EG')} ج.م</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Subscription Details -->
            <div class="section">
                <div class="section-title">📦 تفاصيل الباقة${data.old_plan && !data.is_current ? ' الجديدة' : ''}</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">نوع الباقة:</span>
                        <span class="info-value">
                            <span class="badge ${planTypeBadgeClass}">${planTypeText}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">مدة الاشتراك:</span>
                        <span class="info-value">${data.duration_text}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">عدد الطلاب:</span>
                        <span class="info-value">${data.students_count === 0 ? '♾️ لا نهائي' : `${data.students_count} طالب`}</span>
                    </div>
                    ${data.students_count > 0 ? `
                    <div class="info-item">
                        <span class="info-label">التكلفة الشهرية:</span>
                        <span class="info-value">${(data.students_count * 15).toLocaleString('ar-EG')} ج.م (${data.students_count} × 15 ج.م)</span>
                    </div>
                    ` : ''}
                    ${data.expires_at ? `
                    <div class="info-item">
                        <span class="info-label">تاريخ الانتهاء:</span>
                        <span class="info-value">${data.expires_at}</span>
                    </div>
                    ` : ''}
                    <div class="info-item">
                        <span class="info-label">📍 الحالة:</span>
                        <span class="info-value" style="color: #16a34a;">✓ نشط</span>
                    </div>
                </div>
            </div>
            
            <!-- Financial Calculations -->
            <div class="section" style="display: block !important; visibility: visible !important;">
                <div class="section-title" style="font-size: 15px; font-weight: 700; color: #1f2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #4F46E5;">
                    💰 التفاصيل المالية
                </div>
                
                <div style="display: block !important; visibility: visible !important; background: #f0f9ff; border: 2px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <div style="text-align: center; font-weight: bold; color: #1e40af; margin-bottom: 12px; font-size: 14px; background: white; padding: 8px; border-radius: 4px;">
                        تفاصيل الحساب الكاملة
                    </div>
                    
                    <div style="background: white; padding: 12px; border-radius: 4px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px 8px; text-align: right; width: 50%; color: #4b5563;">طريقة الحساب:</td>
                                <td style="padding: 10px 8px; text-align: left; width: 50%; color: #1f2937; font-weight: 600;">${data.students_count} طالب × ${data.duration_text.match(/(\d+)/)?.[1] || '0'} شهر × 15 ج.م</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px 8px; text-align: right; color: #1f2937;"><strong>تكلفة الباقة الأساسية:</strong></td>
                                <td style="padding: 10px 8px; text-align: left; color: #1f2937;"><strong>${Math.round(data.base_cost || 0).toLocaleString('ar-EG')} ج.م</strong></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb; background: #ecfdf5;">
                                <td style="padding: 10px 8px; text-align: right; color: #059669; font-weight: 600;"><strong>خصم القيمة المتبقية:</strong></td>
                                <td style="padding: 10px 8px; text-align: left; color: #059669; font-weight: 600;"><strong>- ${Math.round(data.discount || 0).toLocaleString('ar-EG')} ج.م</strong></td>
                            </tr>
                            <tr style="border-top: 2px solid #3b82f6; background: #dbeafe;">
                                <td style="padding: 12px 8px; text-align: right; font-size: 15px; font-weight: 700; color: #1e40af;"><strong>المبلغ الإجمالي المطلوب:</strong></td>
                                <td style="padding: 12px 8px; text-align: left; font-size: 15px; font-weight: 700; color: #1e40af;"><strong>${Math.round(data.final_cost || 0).toLocaleString('ar-EG')} ج.م</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div style="display: block !important; background: #dcfce7; border: 1px solid #86efac; padding: 12px; border-radius: 6px; margin-top: 10px; font-size: 12px; color: #166534;">
                    <strong>💡 ملاحظة:</strong>
                    تم خصم المبلغ المتبقي من الاشتراك السابق (${Math.round(data.discount || 0).toLocaleString('ar-EG')} ج.م) من قيمة الاشتراك الجديد.
                </div>
            </div>
            
            <!-- Total Amount Highlight -->
            <div class="total-amount">
                <div class="label">💳 المبلغ النهائي</div>
                <div class="amount">${(data.final_cost || data.total_paid).toLocaleString('ar-EG')} جنيه مصري</div>
                <div class="amount-words">
                    فقط ${convertNumberToArabicWords(data.final_cost || data.total_paid)} لا غير
                </div>
            </div>
            
            <!-- Important Notes -->
            ${data.students_count > 0 ? `
            <div class="notes-box">
                <strong>📌 ملاحظات هامة:</strong>
                <ul>
                    <li>الفاتورة صالحة لمدة <strong>${data.duration_text}</strong> | <strong>${data.students_count} طالب</strong> كحد أقصى</li>
                    <li>تكلفة الطالب: <strong>15 ج.م/شهر</strong> | ${data.discount && data.discount > 0 ? 'تم خصم القيمة المتبقية ✓' : 'يتم التجديد تلقائياً'}</li>
                    <li>يمكن ترقية أو تعديل الباقة في أي وقت | الدعم الفني متاح 24/7</li>
                </ul>
            </div>
            ` : `
            <div class="notes-box">
                <strong>📌 ملاحظات هامة:</strong>
                <ul>
                    <li>الفاتورة صالحة لمدة <strong>${data.duration_text}</strong> | <strong>عدد غير محدود</strong> من الطلاب</li>
                    <li>${data.discount && data.discount > 0 ? 'تم خصم القيمة المتبقية ✓ | ' : ''}يتم التجديد تلقائياً عند انتهاء المدة</li>
                    <li>يمكن تعديل الباقة في أي وقت | الدعم الفني متاح 24/7</li>
                </ul>
            </div>
            `}
        </div>
        
        <div class="footer">
            <strong>منصة نطاق للتعليم الإلكتروني</strong>
            <p>شكراً لثقتكم بنا ولاستخدامكم منصتنا 🙏</p>
            <p>هذه الفاتورة تم إنشاؤها إلكترونياً ولا تحتاج إلى توقيع أو ختم</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
  `;
};

// Helper function to convert numbers to Arabic words
function convertNumberToArabicWords(num: number): string {
  if (num === 0) return 'صفر';
  
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  
  let result = '';
  let roundedNum = Math.floor(num);
  
  // Thousands
  if (roundedNum >= 1000) {
    const thousands = Math.floor(roundedNum / 1000);
    if (thousands === 1) {
      result += 'ألف';
    } else if (thousands === 2) {
      result += 'ألفان';
    } else if (thousands <= 10) {
      result += ones[thousands] + ' آلاف';
    } else {
      result += convertNumberToArabicWords(thousands) + ' ألف';
    }
    roundedNum %= 1000;
    if (roundedNum > 0) result += ' و ';
  }
  
  // Hundreds
  if (roundedNum >= 100) {
    result += hundreds[Math.floor(roundedNum / 100)];
    roundedNum %= 100;
    if (roundedNum > 0) result += ' و ';
  }
  
  // Tens and ones
  if (roundedNum >= 20) {
    result += tens[Math.floor(roundedNum / 10)];
    roundedNum %= 10;
    if (roundedNum > 0) result += ' و ' + ones[roundedNum];
  } else if (roundedNum >= 10) {
    result += teens[roundedNum - 10];
  } else if (roundedNum > 0) {
    result += ones[roundedNum];
  }
  
  return result + ' جنيهاً مصرياً';
}

const downloadInvoicePDF = (invoiceData: InvoiceData): void => {
  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  document.body.appendChild(iframe);
  
  // Write HTML to iframe
  if (iframe.contentWindow) {
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(getInvoiceHTML(invoiceData));
    iframeDoc.close();
    
    // Remove iframe after print dialog closes
    iframe.contentWindow.addEventListener('afterprint', () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    });
  }
};

export const generateInvoicePDF = async (teacherId: string, invoiceData: any): Promise<void> => {
    // Create invoice data object
  const data: InvoiceData = {
    teacher: {
      name: invoiceData.teacher_name || 'غير متوفر',
      email: invoiceData.teacher_email || 'غير متوفر',
      phone: invoiceData.teacher_phone,
    },
    invoice_number: `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${teacherId}`,
    invoice_date: new Date().toLocaleDateString('ar-EG'),
    plan_type: invoiceData.plan_type,
    duration_text: invoiceData.duration_text,
    students_count: invoiceData.students_count,
    expires_at: invoiceData.expires_at,
    total_paid: invoiceData.total_paid || 0,
    base_cost: invoiceData.base_cost || invoiceData.total_paid || 0,
    discount: invoiceData.discount || 0,
    final_cost: invoiceData.final_cost || invoiceData.total_paid || 0,
    is_current: invoiceData.is_current || false,
    old_plan: invoiceData.old_plan || null,
  };
  downloadInvoicePDF(data);
};
