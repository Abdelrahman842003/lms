# NeetaQ — UI Design System

## 1. Color Palette (HSL Tokens)

### Light Mode

```css
:root {
  /* Base */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Cards */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  /* Primary — Indigo (ثقة وتعليم) */
  --primary: 230 78% 55%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Accent — Emerald (إنجاز/جيميفيكيشن) */
  --accent: 152 60% 40%;
  --accent-foreground: 0 0% 100%;

  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Destructive */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  /* Warning — Amber */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;

  /* Success — Green */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;

  /* Borders */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 230 78% 55%;

  /* Gamification colors */
  --xp-bar: 45 93% 47%; /* ذهبي */
  --streak: 25 95% 53%; /* برتقالي */
  --badge-glow: 280 67% 58%; /* بنفسجي */
  --leaderboard-gold: 43 96% 56%;
  --leaderboard-silver: 210 11% 71%;
  --leaderboard-bronze: 29 57% 50%;

  /* Seasonal (يتم تجاوزها عند تفعيل preset) */
  --seasonal-bg: transparent;
  --seasonal-accent: var(--primary);
  --seasonal-overlay-opacity: 0;

  /* Radius */
  --radius: 0.625rem;
}
```

### Dark Mode

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 6.5%;
  --card-foreground: 210 40% 98%;

  --primary: 230 78% 60%;
  --primary-foreground: 222.2 84% 4.9%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --accent: 152 55% 45%;
  --accent-foreground: 222.2 84% 4.9%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --destructive: 0 62.8% 50%;
  --destructive-foreground: 210 40% 98%;

  --warning: 38 92% 50%;
  --warning-foreground: 222.2 84% 4.9%;

  --success: 142 71% 45%;
  --success-foreground: 222.2 84% 4.9%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 230 78% 60%;
}
```

---

## 2. Typography (خط عربي)

```css
/* Google Font: Cairo (الأنسب لـ UI عربي تعليمي) */
@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap");

body {
  font-family: "Cairo", sans-serif;
  direction: rtl;
  text-align: right;
}

/* Scale */
.text-xs {
  font-size: 0.75rem;
} /* 12px */
.text-sm {
  font-size: 0.875rem;
} /* 14px */
.text-base {
  font-size: 1rem;
} /* 16px */
.text-lg {
  font-size: 1.125rem;
} /* 18px */
.text-xl {
  font-size: 1.25rem;
} /* 20px */
.text-2xl {
  font-size: 1.5rem;
} /* 24px */
.text-3xl {
  font-size: 2rem;
} /* 32px */
```

---

## 3. Layout Concept

```
┌──────────────────────────────────────────────────┐
│  Topbar   [Logo]  [Teacher Switcher]  [🔔][👤][🌙]│
├────────┬─────────────────────────────────────────┤
│        │                                          │
│ Sidebar│          Main Content Area               │
│        │                                          │
│ 📊 لوحة│    ┌────────────────────────────┐        │
│ 📖 محاض│    │  XP Bar ████████░░ L5     │        │
│ 📝 امتح│    └────────────────────────────┘        │
│ ✅ حضور│    ┌──────┐ ┌──────┐ ┌──────┐           │
│ 🏆 أوائ│    │ Card │ │ Card │ │ Card │           │
│ 📢 إخطا│    └──────┘ └──────┘ └──────┘           │
│ ⚙️ إعدا│                                          │
│        │    ┌──────────────────────────────┐      │
│        │    │       DataTable              │      │
│        │    └──────────────────────────────┘      │
└────────┴──────────────────────────────────────────┘
```

### AppShell Components

| Component           | Purpose                                                           | Notes                 |
| ------------------- | ----------------------------------------------------------------- | --------------------- |
| `AppShell`          | Container: Sidebar + Topbar + Content                             | RTL layout            |
| `Sidebar`           | Navigation menu per role                                          | Collapsible on mobile |
| `Topbar`            | Logo + TeacherSwitcher + NotificationBell + ThemeToggle + Profile | Fixed                 |
| `TeacherSwitcher`   | Student/Parent selects active teacher context                     | Dropdown              |
| `NotificationBell`  | Realtime unread count + dropdown                                  | Reverb connected      |
| `ThemeToggle`       | Light ↔ Dark                                                      | `next-themes`         |
| `XpBar`             | Student XP progress bar                                           | Below topbar          |
| `SubscriptionGuard` | Popup for expired/suspended                                       | Blocks content        |

---

## 4. Gamification Visual Elements

### XP Bar

- أسفل الـ Topbar مباشرة
- شريط تقدم أفقي بلون ذهبي `--xp-bar`
- يعرض: Level + XP الحالي / المطلوب
- Micro-animation عند اكتساب XP جديد

### Badges

- Grid عرض 4-6 per row
- Badge فعال: ملون + glow خفيف
- Badge قفل: رمادي + أيقونة قفل
- Tooltip يوضح شروط الفتح

### Leaderboard

- Top 3: ميداليات (ذهب/فضة/برونز)
- العدد يحدده المدرس من settings
- Scope selector: (المدرس / المجموعة / الصف / المنصة)

### Streak

- أيقونة 🔥 مع عدد الأيام
- Animation خاصة عند streak جديد

### Quests

- Cards مع progress bar
- نوع: يومي (countdown) / أسبوعي / milestone
- ✅ عند الإتمام + XP reward animation

---

## 5. Seasonal Themes System

### All Supported Presets

| Key                    | الاسم              | النوع   | Assets المقترحة             |
| ---------------------- | ------------------ | ------- | --------------------------- |
| `ramadan`              | رمضان كريم         | إسلامي  | فانوس، هلال، نجوم، patterns |
| `laylat_al_qadr`       | ليلة القدر         | إسلامي  | نور، مسجد، قرآن             |
| `eid_fitr`             | عيد الفطر          | إسلامي  | كحك، هلال، زينة             |
| `eid_adha`             | عيد الأضحى         | إسلامي  | خروف، كعبة                  |
| `islamic_new_year`     | رأس السنة الهجرية  | إسلامي  | هجرة، هلال                  |
| `mawlid`               | المولد النبوي      | إسلامي  | مسجد، نور                   |
| `isra_miraj`           | الإسراء والمعراج   | إسلامي  | سماء، نجوم                  |
| `sham_el_nessim`       | شم النسيم          | مصري    | ورد، فراشات، بيض ملون       |
| `new_year`             | رأس السنة          | عام     | ألعاب نارية، confetti       |
| `revolution_25_jan`    | 25 يناير           | وطني    | علم مصر                     |
| `revolution_30_jun`    | 30 يونيو           | وطني    | علم مصر                     |
| `october_victory`      | نصر أكتوبر         | وطني    | علم مصر، نسر                |
| `back_to_school`       | العودة للمدرسة     | تعليمي  | كتب، حقيبة، أقلام           |
| `midterm_exams`        | امتحانات نصف العام | تعليمي  | كتاب مفتوح، ساعة            |
| `final_exams`          | امتحانات آخر العام | تعليمي  | تخرج، نجاح                  |
| `results_season`       | موسم النتائج       | تعليمي  | 🎉 confetti، شهادة          |
| `summer_revision`      | المراجعة الصيفية   | تعليمي  | شمس، كتب                    |
| `mothers_day`          | عيد الأم           | اجتماعي | ورد، قلوب                   |
| `national_teacher_day` | يوم المعلم         | تعليمي  | تفاحة، سبورة                |

### Implementation

```tsx
// SeasonalOverlay.tsx — مبسط
"use client";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";

export function SeasonalOverlay() {
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    apiClient.get("/seasonal/active").then((res) => {
      if (res.data) setPreset(res.data);
    });
  }, []);

  if (!preset || !preset.is_active) return null;

  return (
    <div
      className="seasonal-overlay"
      style={
        {
          "--seasonal-overlay-opacity": preset.intensity / 100,
        } as React.CSSProperties
      }
    >
      {/* Background pattern */}
      <div
        className="seasonal-bg"
        style={{ backgroundImage: `url(${preset.assets.background})` }}
      />
      {/* Corner decorations */}
      {preset.assets.corners?.map((src, i) => (
        <img
          key={i}
          src={src}
          className={`seasonal-corner seasonal-corner-${i}`}
        />
      ))}
    </div>
  );
}
```

```css
/* globals.css */
.seasonal-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: var(--seasonal-overlay-opacity, 0);
  transition: opacity 0.5s ease;
}
.seasonal-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  opacity: 0.05;
}
.seasonal-corner {
  position: absolute;
  width: 120px;
  height: 120px;
  opacity: 0.3;
  animation: seasonal-float 6s ease-in-out infinite;
}
.seasonal-corner-0 {
  top: 0;
  right: 0;
}
.seasonal-corner-1 {
  bottom: 0;
  left: 0;
  transform: rotate(180deg);
}

@keyframes seasonal-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .seasonal-corner {
    animation: none;
  }
}
```

---

## 6. RTL + Arabic Numerals

```typescript
// src/lib/rtl/numerals.ts
const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicNumerals(num: number | string): string {
  return String(num).replace(/\d/g, (d) => ARABIC_NUMERALS[parseInt(d)]);
}

export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatArabicCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
}
```

---

## 7. Component Consistency Rules

> [!IMPORTANT]
> قواعد إلزامية لضمان التناسق في كل الصفحات

1. **كل زرار** يستخدم `<Button>` من shadcn — بدون exceptions
2. **كل جدول** يستخدم `<DataTable>` المشترك
3. **كل مودال** يستخدم `<Dialog>` من shadcn
4. **كل toast/الإشعار** يستخدم `<Toast>` الموحد
5. **كل form input** يستخدم shadcn `<Input>` / `<Select>` / `<Textarea>`
6. **ممنوع inline styles** إلا في Seasonal Overlay
7. **كل صفحة** تستخدم `<AppShell>` كـ wrapper
8. **كل loading state** يستخدم `<Skeleton>` الموحد
9. **Colors كلها CSS variables** — ممنوع hardcoded hex/rgb
10. **كل icon** من مكتبة واحدة (Lucide React)

---

## 8. Security UI Patterns

| Pattern                    | Where             | How                             |
| -------------------------- | ----------------- | ------------------------------- |
| Exam watermark             | ExamPlayer        | اسم الطالب شفاف فوق الأسئلة     |
| Tab-switch warning         | ExamPlayer        | Alert + counter                 |
| Session popup              | Auth guard        | "تم تسجيل دخولك من جهاز آخر"    |
| Subscription expired popup | SubscriptionGuard | Blocks all content + CTA        |
| Student suspended popup    | EnrollmentGuard   | "يرجى تجديد الاشتراك مع المدرس" |
| Rate limit feedback        | Announcements     | "تم استنفاد الحد اليومي"        |
