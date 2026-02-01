import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated user', async ({ page }) => {
    // Check if we're redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Check Arabic text
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=البريد الإلكتروني غير صحيح')).toBeVisible();
    await expect(page.locator('text=كلمة المرور قصيرة جداً')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill valid credentials
    await page.fill('input[type="email"]', 'teacher@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'teacher@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'teacher@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display students list', async ({ page }) => {
    await page.goto('/students');
    
    // Check page elements
    await expect(page.locator('h1:has-text("الطلاب")')).toBeVisible();
    await expect(page.locator('[data-testid="add-student-button"]')).toBeVisible();
    
    // Check if students table is visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should add new student', async ({ page }) => {
    await page.goto('/students');
    
    // Click add student button
    await page.click('[data-testid="add-student-button"]');
    
    // Fill student form
    await page.fill('input[name="name"]', 'محمد أحمد');
    await page.fill('input[name="email"]', 'mohamed@example.com');
    await page.fill('input[name="phone"]', '+201234567890');
    await page.selectOption('select[name="grade"]', 'الصف الثالث');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check success message
    await expect(page.locator('text=تم إضافة الطالب بنجاح')).toBeVisible();
    
    // Check if student appears in list
    await expect(page.locator('text=محمد أحمد')).toBeVisible();
  });

  test('should edit student information', async ({ page }) => {
    await page.goto('/students');
    
    // Click edit button for first student
    await page.click('[data-testid="edit-student-1"]');
    
    // Update student name
    await page.fill('input[name="name"]', 'محمد أحمد المحدث');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check success message
    await expect(page.locator('text=تم تحديث بيانات الطالب')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth/login');
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Login
    await page.fill('input[type="email"]', 'teacher@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check mobile dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check tablet-specific layout
    // Add tablet-specific tests here
  });
});

test.describe('RTL Support', () => {
  test('should display content in RTL direction', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check RTL direction
    const body = await page.locator('body');
    const direction = await body.getAttribute('dir');
    expect(direction).toBe('rtl');
    
    // Check Arabic font loading
    const computedStyle = await page.evaluate(() => {
      const element = document.querySelector('body');
      return window.getComputedStyle(element).fontFamily;
    });
    
    expect(computedStyle).toContain('Cairo');
  });

  test('should handle form inputs in RTL', async ({ page }) => {
    await page.goto('/auth/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check RTL text alignment
    await expect(emailInput).toHaveCSS('text-align', 'right');
    await expect(passwordInput).toHaveCSS('text-align', 'right');
  });
});