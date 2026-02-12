# Frontend Constitution Compliance Report

**Audit Date**: YYYY-MM-DD  
**Scope**: frontend/src/app/, frontend/src/components/, frontend/src/services/, frontend/src/hooks/  
**Audited Against**: CLAUDE.md v1.1.0

---

## Compliance Score: X%

**Breakdown**:
- ✅ **Compliant Rules**: X
- ❌ **Violations**: X
- ⚠️ **Partial Compliance**: X

---

## Module: src/app/ (App Router)

### ✅ Compliant Rules
- [Section 5.0] Uses App Router (app/ directory)
- Server Components are default
- ...

### ❌ Violations

#### 1. Pages Directory Still Exists (High)
**Rule**: [Section 5.0] ONLY App Router (`app/` directory) — `pages/` directory is forbidden.

**Files**: `frontend/pages/**` (if exists)

**Why it violates**:
- Constitution mandates App Router only
- Mixing patterns causes confusion and routing conflicts
- `pages/` is legacy Next.js pattern

**Fix Proposal**:
```bash
# 1) Migrate all pages to app/ directory
# Example: pages/dashboard.tsx → app/dashboard/page.tsx

# 2) Remove pages/ directory
rm -rf frontend/pages/

# 3) Update next.config.js if needed
```

**Severity**: High (Architecture)  
**Effort**: 2-4 days (depends on pages count)  
**Impact**: Architecture consistency, future maintenance

---

#### 2. Client Component at Root Level (Medium)
**Rule**: [Section 5.1] Keep client components as leaf nodes (push interactivity down the tree).

**File**: `app/dashboard/layout.tsx`  
**Lines**: 1-50

**Code**:
```tsx
'use client'; // ❌ Root layout is client component

import { useUser } from '@/hooks/useUser';

export default function DashboardLayout({ children }) {
  const user = useUser(); // ❌ Could be Server Component
  
  return (
    <div>
      <Sidebar user={user} />
      {children}
    </div>
  );
}
```

**Why it violates**:
- Entire layout tree becomes client-side
- Loses benefits of Server Components
- Unnecessary client bundle size

**Fix Proposal**:
```tsx
// ✅ Keep layout as Server Component
import { auth } from '@/lib/auth';
import { ClientSidebar } from './ClientSidebar';

export default async function DashboardLayout({ children }) {
  const user = await auth.getUser(); // ✅ Server-side fetch
  
  return (
    <div>
      <ClientSidebar user={user} /> {/* ✅ Only sidebar is client */}
      {children}
    </div>
  );
}

// ClientSidebar.tsx
'use client';

export function ClientSidebar({ user }) {
  // Interactive sidebar logic
  return <aside>...</aside>;
}
```

**Severity**: Medium (Performance)  
**Effort**: 2-3 hours  
**Impact**: Bundle size, Performance

---

#### 3. No 'use client' Directive on Interactive Component (Medium)
**Rule**: [Section 5.1] Client Components must have `'use client'` directive.

**File**: `app/exams/ExamCard.tsx`  
**Lines**: 1-35

**Code**:
```tsx
// ❌ Missing 'use client' but uses hooks
import { useState } from 'react';

export default function ExamCard({ exam }) {
  const [expanded, setExpanded] = useState(false); // ❌ Hook without 'use client'
  
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {/* ... */}
    </div>
  );
}
```

**Why it violates**:
- Will cause hydration errors
- Component implicitly becomes client component
- Not explicit about client boundary

**Fix Proposal**:
```tsx
'use client'; // ✅ Add directive

import { useState } from 'react';

export default function ExamCard({ exam }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {/* ... */}
    </div>
  );
}
```

**Severity**: Medium  
**Effort**: 5 minutes per file  
**Impact**: Clarity, Hydration safety

---

## Module: src/services/ (API Client)

### ❌ Violations

#### 4. Untyped API Responses (High)
**Rule**: [Section 5.2] Data Fetching must be typed. Use Zod for critical API boundaries.

**File**: `services/api/examService.ts`  
**Lines**: 23-30

**Code**:
```typescript
export async function getExams(filters?: any) { // ❌ 'any' type
  const response = await apiClient.get('/exams', { params: filters });
  return response.data; // ❌ Untyped response
}
```

**Why it violates**:
- No type safety
- Runtime errors not caught at compile time
- API changes break silently

**Fix Proposal**:
```typescript
import { z } from 'zod';

// 1) Define Zod schemas
const ExamSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.number(),
  created_at: z.string(),
  // ... all fields
});

const ExamListResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  data: z.array(ExamSchema),
  meta: z.object({
    current_page: z.number(),
    total: z.number(),
    // ...
  }),
});

// 2) Export types
export type Exam = z.infer<typeof ExamSchema>;
export type ExamListResponse = z.infer<typeof ExamListResponseSchema>;

// 3) Type-safe API call
interface GetExamsFilters {
  'filter[status]'?: string;
  'sort'?: string;
  'page[number]'?: number;
  'page[size]'?: number;
}

export async function getExams(filters?: GetExamsFilters): Promise<Exam[]> {
  const response = await apiClient.get('/exams', { params: filters });
  
  // Validate response at runtime
  const parsed = ExamListResponseSchema.parse(response.data);
  
  return parsed.data;
}
```

**Suggested Tests**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { getExams } from './examService';

describe('examService', () => {
  it('returns typed exam list', async () => {
    const exams = await getExams();
    
    expect(exams).toBeInstanceOf(Array);
    expect(exams[0]).toHaveProperty('id');
    expect(exams[0]).toHaveProperty('title');
  });
  
  it('throws on invalid API response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { invalid: 'response' }
    });
    
    await expect(getExams()).rejects.toThrow();
  });
});
```

**Severity**: High (Type Safety)  
**Effort**: 4-6 hours for all services  
**Impact**: Type safety, Runtime errors prevention

---

#### 5. Missing Credentials in API Client (High - Security)
**Rule**: [Section 5.2] API Client: `withCredentials: true` (Sanctum cookie auth).

**File**: `services/api/client.ts`  
**Lines**: 10-15

**Code**:
```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ❌ Missing withCredentials
});
```

**Why it violates**:
- Cookies not sent with requests
- Sanctum auth will fail
- CSRF protection broken

**Fix Proposal**:
```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // ✅ Send cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add CSRF token interceptor
apiClient.interceptors.request.use(async (config) => {
  // Get CSRF token from cookie or endpoint
  const token = getCsrfToken();
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});
```

**Severity**: High (Security - Auth broken)  
**Effort**: 30 minutes  
**Impact**: Authentication, Security

---

## Module: src/components/

### ❌ Violations

#### 6. Hardcoded UI Strings (Medium)
**Rule**: [Section 5.5] No hardcoded UI strings. Use translation keys.

**File**: `components/ExamCard.tsx`  
**Lines**: 45-60

**Code**:
```tsx
export function ExamCard({ exam }) {
  return (
    <Card>
      <h3>{exam.title}</h3>
      <p>Duration: {exam.duration} minutes</p> {/* ❌ Hardcoded */}
      <button>Start Exam</button> {/* ❌ Hardcoded */}
    </Card>
  );
}
```

**Why it violates**:
- Not translatable
- RTL support issues
- Inconsistent UX across locales

**Fix Proposal**:
```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function ExamCard({ exam }) {
  const { t } = useTranslation('exams');
  
  return (
    <Card>
      <h3>{exam.title}</h3>
      <p>{t('duration', { minutes: exam.duration })}</p> {/* ✅ Translated */}
      <button>{t('start_exam')}</button> {/* ✅ Translated */}
    </Card>
  );
}
```

**Translation file** (`locales/ar/exams.json`):
```json
{
  "duration": "المدة: {{minutes}} دقيقة",
  "start_exam": "ابدأ الاختبار"
}
```

**Severity**: Medium (i18n)  
**Effort**: 1-2 days for all components  
**Impact**: Internationalization, RTL support

---

#### 7. Dangerous HTML Rendering (High - Security)
**Rule**: [Section 5.6] Avoid `dangerouslySetInnerHTML` unless sanitized and justified.

**File**: `components/NotificationCard.tsx`  
**Lines**: 34-38

**Code**:
```tsx
export function NotificationCard({ notification }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: notification.body }} // ❌ Unsanitized
    />
  );
}
```

**Why it violates**:
- XSS vulnerability
- User-generated content not sanitized
- No justification in code comments

**Fix Proposal**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function NotificationCard({ notification }) {
  // Sanitize HTML before rendering
  const sanitized = DOMPurify.sanitize(notification.body, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitized }} // ✅ Sanitized
    />
  );
}

// Alternative: Use markdown instead of HTML
import ReactMarkdown from 'react-markdown';

export function NotificationCard({ notification }) {
  return <ReactMarkdown>{notification.body}</ReactMarkdown>;
}
```

**Severity**: High (Security - XSS)  
**Effort**: 2-3 hours  
**Impact**: Security

---

## Module: Filters/Search

### ❌ Violations

#### 8. Filter State Not in URL (High)
**Rule**: [Section 5.4] Filtering state MUST live in URL query params.

**File**: `app/students/page.tsx`  
**Lines**: 15-50

**Code**:
```tsx
'use client';

export default function StudentsPage() {
  const [filters, setFilters] = useState({ status: 'active' }); // ❌ Local state
  
  const { data } = useSWR(`/api/students`, fetcher); // ❌ No filters
  
  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />
      <StudentList students={data} />
    </>
  );
}
```

**Why it violates**:
- Cannot share filtered view via URL
- No bookmarking support
- Back/forward breaks filters
- Not SSR-friendly

**Fix Proposal**:
```tsx
// ✅ Server Component (default)
import { StudentList } from '@/components/StudentList';
import { FilterBar } from '@/components/FilterBar';
import { getStudents } from '@/services/studentService';

interface SearchParams {
  'filter[status]'?: string;
  'sort'?: string;
  'page[number]'?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Filters from URL
  const students = await getStudents(searchParams);
  
  return (
    <>
      <FilterBar currentFilters={searchParams} />
      <StudentList students={students} />
    </>
  );
}

// FilterBar.tsx (Client Component)
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function FilterBar({ currentFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    
    router.replace(`/students?${params.toString()}`); // ✅ Update URL
  };
  
  return (
    <div>
      <select 
        value={currentFilters['filter[status]'] || 'all'}
        onChange={(e) => updateFilter('filter[status]', e.target.value)}
      >
        <option value="all">الكل</option>
        <option value="active">نشط</option>
        <option value="inactive">غير نشط</option>
      </select>
    </div>
  );
}
```

**Severity**: High (Architecture, UX)  
**Effort**: 3-4 hours per page  
**Impact**: Shareability, SEO, UX

---

## Module: TypeScript Configuration

### ❌ Violations

#### 9. TypeScript Not in Strict Mode (High)
**Rule**: [Section 5.0] TypeScript (strict).

**File**: `tsconfig.json`  
**Lines**: 5-10

**Code**:
```json
{
  "compilerOptions": {
    "strict": false, // ❌ Not strict
    "noImplicitAny": false, // ❌
    // ...
  }
}
```

**Why it violates**:
- Misses type errors at compile time
- Runtime errors increase
- Constitution mandates strict mode

**Fix Proposal**:
```json
{
  "compilerOptions": {
    "strict": true, // ✅ Enable strict mode
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    // ... other settings
  }
}
```

**Migration Steps**:
1. Enable strict mode
2. Fix all type errors (may be 100s)
3. Add `// @ts-expect-error` with justification for legacy code
4. Gradually remove @ts-expect-error

**Severity**: High (Code Quality)  
**Effort**: 3-5 days (initial migration)  
**Impact**: Type safety, Bug prevention

---

## Summary by Severity

| Severity | Count | Estimated Effort |
|----------|-------|------------------|
| High     | X     | X days           |
| Medium   | X     | X days           |
| Low      | X     | X days           |

**Total**: X violations, X days effort

---

## Recommendations

### Immediate Actions (This Sprint)
1. Fix API client credentials (breaks auth)
2. Enable TypeScript strict mode
3. Sanitize all `dangerouslySetInnerHTML`
4. Add Zod validation to API services

### Next Sprint
1. Move filters to URL (all pages)
2. Fix client component boundaries
3. Add i18n to all hardcoded strings
4. Migrate pages/ to app/ (if exists)

### Backlog
1. Full type coverage
2. E2E tests for critical flows
3. Performance optimization (bundle size)

---

**Next**: See [Infrastructure Compliance Report](./INFRA_COMPLIANCE.md)
