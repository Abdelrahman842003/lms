<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 0;
            size: A4 landscape;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .certificate-container {
            width: 100%;
            height: 100%;
            position: relative;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%);
            padding: 40px;
        }

        /* Decorative border */
        .border-frame {
            border: 3px solid
                {{ $level_color }}
            ;
            border-radius: 16px;
            padding: 40px 50px;
            height: 100%;
            position: relative;
            background: rgba(255, 255, 255, 0.03);
        }

        .border-frame::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 12px;
        }

        /* Corner decorations */
        .corner {
            position: absolute;
            width: 40px;
            height: 40px;
            border-color:
                {{ $level_color }}
            ;
        }

        .corner-tl {
            top: 20px;
            left: 20px;
            border-top: 3px solid;
            border-left: 3px solid;
        }

        .corner-tr {
            top: 20px;
            right: 20px;
            border-top: 3px solid;
            border-right: 3px solid;
        }

        .corner-bl {
            bottom: 20px;
            left: 20px;
            border-bottom: 3px solid;
            border-left: 3px solid;
        }

        .corner-br {
            bottom: 20px;
            right: 20px;
            border-bottom: 3px solid;
            border-right: 3px solid;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
        }

        .platform-name {
            font-size: 16px;
            color:
                {{ $level_color }}
            ;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }

        .certificate-title {
            font-size: 36px;
            color: #ffffff;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .certificate-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
        }

        .divider {
            width: 200px;
            height: 2px;
            background: linear-gradient(90deg, transparent,
                    {{ $level_color }}
                    , transparent);
            margin: 20px auto;
        }

        .body-content {
            text-align: center;
            margin-top: 15px;
        }

        .level-icon {
            font-size: 50px;
            margin-bottom: 10px;
            display: block;
        }

        .awarded-text {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
        }

        .student-name {
            font-size: 32px;
            color: #ffffff;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .achievement-text {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
        }

        .level-name {
            font-size: 28px;
            color:
                {{ $level_color }}
            ;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .divider-small {
            width: 120px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            margin: 15px auto;
        }

        .footer {
            position: absolute;
            bottom: 60px;
            left: 50px;
            right: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .footer-item {
            text-align: center;
        }

        .footer-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 5px;
        }

        .footer-value {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
        }

        .footer-line {
            width: 140px;
            height: 1px;
            background: rgba(255, 255, 255, 0.3);
            margin: 0 auto 8px;
        }
    </style>
</head>

<body>
    <div class="certificate-container">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>

        <div class="border-frame">
            <div class="header">
                <div class="platform-name">{{ $platform_name }}</div>
                <div class="certificate-title">شهادة إنجاز</div>
                <div class="certificate-subtitle">Certificate of Achievement</div>
            </div>

            <div class="divider"></div>

            <div class="body-content">
                <span class="level-icon">{{ $level_icon }}</span>

                <div class="awarded-text">تُمنح هذه الشهادة إلى</div>
                <div class="student-name">{{ $student_name }}</div>

                <div class="divider-small"></div>

                <div class="achievement-text">تقديراً لوصوله إلى مستوى</div>
                <div class="level-name">{{ $level_name }}</div>
            </div>

            <div class="footer">
                <div class="footer-item">
                    <div class="footer-line"></div>
                    <div class="footer-label">تاريخ الإنجاز</div>
                    <div class="footer-value">{{ $achieved_at }}</div>
                </div>
                <div class="footer-item">
                    <div class="footer-line"></div>
                    <div class="footer-label">المنصة</div>
                    <div class="footer-value">{{ $platform_name }}</div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>