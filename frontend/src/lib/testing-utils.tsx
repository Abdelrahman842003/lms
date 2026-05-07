import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoreAuthProvider } from '../contexts/CoreAuthContext';

// Create a test query client with proper error handling
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: {
    user?: any;
    isAuthenticated?: boolean;
  };
}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialState, ...renderOptions } = options;
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CoreAuthProvider>
          {children}
        </CoreAuthProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock data for testing
export const mockUser = {
  id: '1',
  name: 'أحمد محمد',
  email: 'ahmed@test.com',
  role: 'teacher',
  avatar: '/avatars/default.png',
  permissions: ['read:students', 'write:grades'],
  lastLogin: new Date().toISOString(),
};

export const mockStudent = {
  id: '1',
  name: 'فاطمة علي',
  email: 'fatima@test.com',
  grade: 'الصف الثالث',
  parent: {
    name: 'علي أحمد',
    phone: '+201234567890',
  },
  enrolledCourses: ['الرياضيات', 'العلوم'],
};

export const mockCourse = {
  id: '1',
  title: 'الرياضيات - الصف الثالث',
  description: 'منهج الرياضيات للصف الثالث الابتدائي',
  teacher: mockUser,
  students: [mockStudent],
  lessons: 24,
  duration: '6 أشهر',
  status: 'active' as const,
};

// Test utilities for authentication
export const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  refreshUser: jest.fn(),
  hasPermission: jest.fn((permission: string) => 
    mockUser.permissions.includes(permission)
  ),
};

// API mocking utilities
export const mockApiResponse = function<T>(data: T, delay = 100) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message = 'خطأ في الخادم', status = 500) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`API Error: ${status} - ${message}`));
    }, 100);
  });
};

// Performance testing utilities
export const measureComponentRender = (component: ReactElement) => {
  const start = performance.now();
  const result = customRender(component);
  const end = performance.now();
  
  return {
    ...result,
    renderTime: end - start,
  };
};

// Accessibility testing helpers
export const axeConfig = {
  rules: {
    // Disable color-contrast rule for testing
    'color-contrast': { enabled: false },
    // Focus management for Arabic RTL
    'focus-order-semantics': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa'],
};

// RTL testing utilities for Arabic
export const renderWithRTL = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(
    <div dir="rtl" lang="ar">
      {ui}
    </div>,
    options
  );
};

// Form testing utilities
export const mockFormData = {
  studentRegistration: {
    name: 'محمد أحمد',
    email: 'mohamed@test.com',
    phone: '+201234567890',
    grade: 'الصف الأول',
    parentName: 'أحمد محمد',
  },
  courseCreation: {
    title: 'دورة الرياضيات',
    description: 'دورة شاملة في الرياضيات',
    duration: '3 أشهر',
    price: '500',
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };