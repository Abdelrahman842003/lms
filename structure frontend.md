# 🎨 Frontend Feature Implementation Template

> استخدم هذا القالب لبناء أي Feature جديدة في واجهة المستخدم (Frontend)

---

## 📁 بنية الملفات المطلوبة

```
frontend/src/
├── app/
│   └── {role}/
│       └── {feature}/
│           ├── page.tsx
│           ├── layout.tsx (if needed)
│           ├── loading.tsx (if needed)
│           └── error.tsx (if needed)
├── components/
│   ├── {category}/
│   │   ├── {Feature}Component.tsx
│   │   └── index.ts
│   └── {role}/
│       └── {feature}/
│           ├── {SubComponent}.tsx
│           └── index.ts
├── services/
│   ├── {module}/
│   │   └── {feature}Service.ts
│   └── index.ts
├── hooks/
│   └── use{Feature}.ts
├── types/
│   └── {feature}.types.ts
└── utils/
    └── {feature}Utils.ts (if needed)
```

---

## ✅ Checklist للـ Feature الجديدة

### 1. 📝 Types (TypeScript)

- [ ] إنشاء ملف types في `types/{feature}.types.ts`
- [ ] تعريف جميع الـ interfaces المطلوبة
- [ ] استخدام `export interface` للأنواع العامة
- [ ] استخدام `export type` للـ union types
- [ ] إضافة JSDoc للأنواع المعقدة

```typescript
// types/{feature}.types.ts
export interface FeatureData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type FeatureStatus = 'active' | 'inactive' | 'pending';

export interface CreateFeatureRequest {
  name: string;
  description?: string;
}
```

### 2. 🌐 Service (API Layer)

- [ ] إنشاء ملف service في `services/{module}/{feature}Service.ts`
- [ ] استخدام axios instance من `lib/axios.ts`
- [ ] تعريف types للـ request/response
- [ ] معالجة الأخطاء بشكل مناسب
- [ ] إضافة TypeScript types للدوال

```typescript
// services/{module}/{feature}Service.ts
import api from '@/lib/axios';
import type { FeatureData, CreateFeatureRequest } from '@/types/{feature}.types';

export const featureService = {
  async getAll(): Promise<FeatureData[]> {
    const response = await api.get<FeatureData[]>('/api/features');
    return response.data;
  },

  async getById(id: string): Promise<FeatureData> {
    const response = await api.get<FeatureData>(`/api/features/${id}`);
    return response.data;
  },

  async create(data: CreateFeatureRequest): Promise<FeatureData> {
    const response = await api.post<FeatureData>('/api/features', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateFeatureRequest>): Promise<FeatureData> {
    const response = await api.put<FeatureData>(`/api/features/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/features/${id}`);
  },
};
```

### 3. 🎣 Custom Hook

- [ ] إنشاء custom hook في `hooks/use{Feature}.ts`
- [ ] استخدام React hooks بشكل صحيح
- [ ] معالجة loading و error states
- [ ] إضافة TypeScript types
- [ ] إعادة البيانات والدوال المطلوبة

```typescript
// hooks/use{Feature}.ts
import { useState, useEffect } from 'react';
import { featureService } from '@/services/{module}/{feature}Service';
import type { FeatureData, CreateFeatureRequest } from '@/types/{feature}.types';

export function useFeature(id?: string) {
  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeature = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await featureService.getById(id);
      setData(result);
    } catch (err) {
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeature();
  }, [id]);

  const createFeature = async (data: CreateFeatureRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await featureService.create(data);
      return result;
    } catch (err) {
      setError('فشل في إنشاء العنصر');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    createFeature,
    refetch: fetchFeature,
  };
}
```

### 4. 🎨 Components

- [ ] إنشاء components في `components/{category}/` أو `components/{role}/{feature}/`
- [ ] استخدام TypeScript props interfaces
- [ ] إضافة prop validation
- [ ] معالجة loading و error states
- [ ] استخدام proper accessibility attributes
- [ ] إضافة RTL support للعربية

```typescript
// components/{category}/{Feature}Component.tsx
'use client';

import React from 'react';
import type { FeatureData } from '@/types/{feature}.types';

interface FeatureComponentProps {
  feature: FeatureData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FeatureComponent({ feature, onEdit, onDelete }: FeatureComponentProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">{feature.name}</h3>
      {feature.description && (
        <p className="text-gray-600 mt-2">{feature.description}</p>
      )}
      <div className="flex gap-2 mt-4">
        {onEdit && (
          <button
            onClick={() => onEdit(feature.id)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            تعديل
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(feature.id)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            حذف
          </button>
        )}
      </div>
    </div>
  );
}
```

### 5. 📄 Page (Next.js App Router)

- [ ] إنشاء page في `app/{role}/{feature}/page.tsx`
- [ ] استخدام `'use client'` إذا لزم
- [ ] معالجة loading state
- [ ] معالجة error state
- [ ] استخدام proper metadata
- [ ] إضافة proper SEO tags

```typescript
// app/{role}/{feature}/page.tsx
'use client';

import React from 'react';
import { useFeature } from '@/hooks/use{Feature}';
import { FeatureComponent } from '@/components/{category}/{Feature}Component';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function FeaturePage({ params }: { params: { id: string } }) {
  const { data, loading, error } = useFeature(params.id);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 text-center py-8">
        لا توجد بيانات
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">تفاصيل الميزة</h1>
        <FeatureComponent feature={data} />
      </div>
    </ErrorBoundary>
  );
}
```

### 6. 🧪 Tests

- [ ] كتابة unit tests للـ components
- [ ] كتابة unit tests للـ hooks
- [ ] كتابة integration tests للـ services
- [ ] استخدام React Testing Library
- [ ] استخدام Jest
- [ ] تغطية ≥ 70%

```typescript
// components/{category}/{Feature}Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeatureComponent } from './{Feature}Component';
import type { FeatureData } from '@/types/{feature}.types';

describe('FeatureComponent', () => {
  const mockFeature: FeatureData = {
    id: '1',
    name: 'Test Feature',
    description: 'Test Description',
    createdAt: '2024-01-01',
  };

  it('renders feature name', () => {
    render(<FeatureComponent feature={mockFeature} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<FeatureComponent feature={mockFeature} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('تعديل'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

---

## 🔒 Standards

| المعيار            | الوصف                                           |
| ------------------ | ----------------------------------------------- |
| TypeScript         | Strict mode enabled, no implicit any           |
| ESLint             | Airbnb style guide with custom rules            |
| Prettier           | Consistent code formatting                      |
| React Hooks        | Follow React Hooks rules strictly               |
| Error Boundaries   | Wrap components with error boundaries            |
| Loading States     | Show loading indicators during async operations |
| Error Handling     | User-friendly error messages in Arabic          |
| RTL Support        | Proper RTL layout for Arabic                    |
| Accessibility      | WCAG 2.1 AA compliance                           |
| Performance        | Code splitting, lazy loading, optimization      |

---

## 📊 مثال Route Structure

```
app/
├── admin/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── students/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── teachers/
│       └── page.tsx
├── academy/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── students/
│   │   └── page.tsx
│   └── teachers/
│       └── page.tsx
├── student/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── lectures/
│   │   └── page.tsx
│   └── exams/
│       └── page.tsx
├── teacher/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── students/
│   │   └── page.tsx
│   └── lectures/
│       └── page.tsx
└── parent/
    ├── children/
    │   └── page.tsx
    └── [childId]/
        └── summary/
            └── page.tsx
```

---

## 🎯 Component Categories

### UI Components (`components/ui/`)

Reusable UI components:
- Button, Input, Select, Modal, etc.
- Should be framework-agnostic
- Proper accessibility attributes
- Storybook stories for documentation

### Dashboard Components (`components/dashboard/`)

Dashboard-specific components:
- DashboardCard, StatCard, DataTable, etc.
- Shared across different roles
- Consistent design system

### Role-Specific Components (`components/{role}/`)

Components specific to a user role:
- `components/admin/` - Admin-specific components
- `components/academy/` - Academy-specific components
- `components/student/` - Student-specific components
- `components/teacher/` - Teacher-specific components
- `components/parent/` - Parent-specific components

---

## 🔧 Context Providers

### Available Contexts

- `AuthContext` - Authentication state and methods
- `NotificationContext` - Notification management
- `SettingsContext` - Application settings
- `PerformanceContext` - Performance monitoring

### Creating New Context

```typescript
// contexts/{Feature}Context.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';

interface FeatureContextType {
  value: string;
  setValue: (value: string) => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('');

  return (
    <FeatureContext.Provider value={{ value, setValue }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider');
  }
  return context;
}
```

---

## 📦 State Management

### Local State

Use `useState` for component-local state:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

### Global State

Use Context API for global state:
```typescript
const { user, setUser } = useAuth();
```

### Server State

Use React Query for server state (if needed):
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['feature', id],
  queryFn: () => featureService.getById(id),
});
```

---

## 🎨 Styling Guidelines

### Tailwind CSS

- Use utility classes for styling
- Follow mobile-first approach
- Use responsive prefixes (`md:`, `lg:`)
- Use dark mode variants if needed

### Custom Styles

- Keep custom CSS minimal
- Use CSS modules for component-specific styles
- Follow BEM naming convention

### RTL Support

- Use `dir="rtl"` for Arabic content
- Use logical properties (`margin-inline-start` instead of `margin-left`)
- Test in both LTR and RTL modes

---

## ♿ Accessibility Guidelines

### ARIA Attributes

- Use proper ARIA labels
- Use `aria-label` for icon-only buttons
- Use `aria-describedby` for form help text
- Use `role` attributes when necessary

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use proper focus management
- Provide visible focus indicators

### Screen Reader Support

- Use semantic HTML elements
- Provide alt text for images
- Use proper heading hierarchy

---

## 🚀 Performance Guidelines

### Code Splitting

- Use dynamic imports for large components
- Use `React.lazy()` for route-based code splitting
- Use `next/dynamic` for Next.js components

### Image Optimization

- Use Next.js Image component
- Use WebP format
- Provide responsive images

### Bundle Optimization

- Use bundle analyzer to identify large bundles
- Remove unused dependencies
- Use tree shaking

---

## 🔐 Security Guidelines

### Input Validation

- Validate all user inputs
- Use Zod for runtime validation
- Sanitize user-generated content

### XSS Prevention

- Use React's built-in XSS protection
- Avoid `dangerouslySetInnerHTML`
- Use DOMPurify if necessary

### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate tokens on the server

---

## 📝 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StudentDashboard`, `ExamCard` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useNotifications` |
| Services | camelCase with `Service` suffix | `studentService`, `examService` |
| Types | PascalCase | `StudentData`, `ExamConfig` |
| Interfaces | PascalCase with `I` prefix | `IStudentService` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Files | camelCase or PascalCase | `useAuth.ts`, `StudentDashboard.tsx` |
