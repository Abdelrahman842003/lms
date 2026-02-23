/**
 * Tests for Report Schema Validation
 * 
 * Comprehensive tests for Zod schemas including subscription_fee validation.
 */

import {
  ReportTypeSchema,
  PeriodPresetSchema,
  DateRangeSchema,
  GenerateReportRequestSchema,
  TeacherReportSummarySchema,
  AcademyReportSummarySchema,
  AdminReportSummarySchema,
  FinancialDetailsSchema,
  MonthlyBreakdownItemSchema,
  SubscriptionBreakdownItemSchema,
  TeacherInfoSchema,
  AcademyInfoSchema,
  TeacherReportResponseSchema,
  AcademyReportResponseSchema,
  AdminReportResponseSchema,
  TeacherListItemSchema,
  AcademyListItemSchema,
  TeachersListResponseSchema,
  AcademiesListResponseSchema,
  periodPresets,
  reportTypes,
  calculateSummaryTotals,
  calculateFinancialTotals,
  formatCurrency,
  formatNumber,
} from '../report.schema';
import { z } from 'zod';

describe('Report Schemas', () => {
  describe('ReportTypeSchema', () => {
    it('should validate valid report types', () => {
      expect(ReportTypeSchema.parse('teacher')).toBe('teacher');
      expect(ReportTypeSchema.parse('academy')).toBe('academy');
      expect(ReportTypeSchema.parse('admin')).toBe('admin');
    });

    it('should reject invalid report types', () => {
      expect(() => ReportTypeSchema.parse('invalid')).toThrow();
      expect(() => ReportTypeSchema.parse('')).toThrow();
    });
  });

  describe('PeriodPresetSchema', () => {
    it('should validate all period presets', () => {
      periodPresets.forEach(preset => {
        expect(PeriodPresetSchema.parse(preset.value)).toBe(preset.value);
      });
    });

    it('should reject invalid period presets', () => {
      expect(() => PeriodPresetSchema.parse('invalid_period')).toThrow();
    });
  });

  describe('DateRangeSchema', () => {
    it('should validate correct date range', () => {
      const validRange = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      expect(DateRangeSchema.parse(validRange)).toEqual(validRange);
    });

    it('should reject invalid date formats', () => {
      const invalidRange = {
        start_date: '01-01-2024',
        end_date: '2024-01-31',
      };
      expect(() => DateRangeSchema.parse(invalidRange)).toThrow('تاريخ البداية يجب أن يكون بتنسيق YYYY-MM-DD');
    });
  });

  describe('TeacherReportSummarySchema', () => {
    it('should validate valid teacher report summary with subscription_fee', () => {
      const validSummary = {
        total_students: 100,
        active_students: 80,
        new_enrollments: 20,
        total_secretaries: 5,
        subscription_fee: 4800, // 80 × 60 EGP
        total_paid: 3000,
        pending_payments: 1800,
        paying_students_count: 70,
        not_paying_students_count: 10,
        price_per_student: 60,
      };
      expect(TeacherReportSummarySchema.parse(validSummary)).toEqual(validSummary);
    });

    it('should reject negative subscription_fee', () => {
      const invalidSummary = {
        total_students: 100,
        active_students: 80,
        new_enrollments: 20,
        total_secretaries: 5,
        subscription_fee: -100,
        total_paid: 3000,
        pending_payments: 1800,
        paying_students_count: 70,
        not_paying_students_count: 10,
        price_per_student: 60,
      };
      expect(() => TeacherReportSummarySchema.parse(invalidSummary)).toThrow();
    });

    it('should reject negative student counts', () => {
      const invalidSummary = {
        total_students: -10,
        active_students: 80,
        new_enrollments: 20,
        total_secretaries: 5,
        subscription_fee: 4800,
        total_paid: 3000,
        pending_payments: 1800,
        paying_students_count: 70,
        not_paying_students_count: 10,
        price_per_student: 60,
      };
      expect(() => TeacherReportSummarySchema.parse(invalidSummary)).toThrow();
    });
  });

  describe('AcademyReportSummarySchema', () => {
    it('should validate valid academy report summary with subscription_fee', () => {
      const validSummary = {
        total_teachers: 10,
        active_teachers: 8,
        total_academy_students: 500,
        total_enrollments: 600,
        active_enrollments: 550,
        total_subscriptions: 550,
        total_payment_transactions: 1200,
        subscription_fee: 22000, // 550 × 40 EGP
        total_paid: 15000,
        pending_payments: 7000,
        paying_students_count: 450,
        not_paying_students_count: 100,
        price_per_student: 40,
      };
      expect(AcademyReportSummarySchema.parse(validSummary)).toEqual(validSummary);
    });

    it('should calculate correct subscription_fee for academy', () => {
      const studentCount = 100;
      const pricePerStudent = 40;
      const expectedFee = studentCount * pricePerStudent;
      
      const summary = {
        total_teachers: 5,
        active_teachers: 5,
        total_academy_students: studentCount,
        total_enrollments: 100,
        active_enrollments: studentCount,
        total_subscriptions: studentCount,
        total_payment_transactions: 200,
        subscription_fee: expectedFee,
        total_paid: expectedFee * 0.7,
        pending_payments: expectedFee * 0.3,
        paying_students_count: 80,
        not_paying_students_count: 20,
        price_per_student: pricePerStudent,
      };
      
      const parsed = AcademyReportSummarySchema.parse(summary);
      expect(parsed.subscription_fee).toBe(4000); // 100 × 40
    });
  });

  describe('AdminReportSummarySchema', () => {
    it('should validate valid admin report summary with total_subscription_fees', () => {
      const validSummary = {
        total_academies: 20,
        independent_teachers_count: 50,
        total_teachers: 150,
        active_teachers: 130,
        suspended_teachers: 10,
        new_teachers: 20,
        total_students: 5000,
        new_students: 500,
        total_secretaries: 75,
        total_enrollments: 5500,
        active_enrollments: 5200,
        new_enrollments: 800,
        total_subscriptions: 5200,
        academy_subscriptions: 3200,
        independent_subscriptions: 2000,
        total_subscription_fees: 312000, // (3200 × 40) + (2000 × 60)
        total_paid: 250000,
        pending_payments: 62000,
        platform_net_profit: 250000,
      };
      expect(AdminReportSummarySchema.parse(validSummary)).toEqual(validSummary);
    });
  });

  describe('FinancialDetailsSchema', () => {
    it('should validate financial details', () => {
      const validDetails = {
        total_revenue: 10000,
        total_expenses: 3000,
        net_profit: 7000,
        total_collected: 8000,
        total_outstanding: 2000,
        collection_rate: 80,
      };
      expect(FinancialDetailsSchema.parse(validDetails)).toEqual(validDetails);
    });
  });

  describe('SubscriptionBreakdownItemSchema', () => {
    it('should validate subscription breakdown with proper calculations', () => {
      const validItem = {
        month: '2024-01',
        month_name: 'يناير 2024',
        student_count: 50,
        amount_due: 3000, // 50 × 60
        amount_paid: 2000,
        amount_remaining: 1000,
        payment_rate: 66.67,
      };
      expect(SubscriptionBreakdownItemSchema.parse(validItem)).toEqual(validItem);
    });
  });

  describe('TeacherInfoSchema', () => {
    it('should validate teacher info', () => {
      const validTeacher = {
        id: '1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        subject: 'الرياضيات',
        status: 'active',
        subscription_fee: 60,
      };
      expect(TeacherInfoSchema.parse(validTeacher)).toEqual(validTeacher);
    });
  });

  describe('AcademyInfoSchema', () => {
    it('should validate academy info', () => {
      const validAcademy = {
        id: '1',
        name: 'أكاديمية التفوق',
        email: 'info@academy.com',
        phone: '01012345678',
        address: 'القاهرة، مصر',
        status: 'active',
        subscription_fee: 40,
      };
      expect(AcademyInfoSchema.parse(validAcademy)).toEqual(validAcademy);
    });
  });

  describe('TeacherReportResponseSchema', () => {
    it('should validate complete teacher report response', () => {
      const validResponse = {
        teacher: {
          id: '1',
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '01012345678',
          subject: 'الرياضيات',
          status: 'active',
          subscription_fee: 60,
        },
        summary: {
          total_students: 100,
          active_students: 80,
          new_enrollments: 20,
          total_secretaries: 5,
          subscription_fee: 4800,
          total_paid: 3000,
          pending_payments: 1800,
          paying_students_count: 70,
          not_paying_students_count: 10,
          price_per_student: 60,
        },
        financial_details: {
          total_revenue: 5000,
          total_expenses: 2000,
          net_profit: 3000,
          total_collected: 4000,
          total_outstanding: 1000,
          collection_rate: 80,
        },
        monthly_breakdown: [
          {
            month: '2024-01',
            month_name: 'يناير 2024',
            new_enrollments: 10,
            confirmed_payments: 5,
          },
        ],
        subscription_breakdown: [
          {
            month: '2024-01',
            month_name: 'يناير 2024',
            student_count: 80,
            amount_due: 4800,
            amount_paid: 3000,
            amount_remaining: 1800,
            payment_rate: 62.5,
          },
        ],
      };
      expect(TeacherReportResponseSchema.parse(validResponse)).toEqual(validResponse);
    });
  });

  describe('AcademyReportResponseSchema', () => {
    it('should validate complete academy report response', () => {
      const validResponse = {
        academy: {
          id: '1',
          name: 'أكاديمية التفوق',
          email: 'info@academy.com',
          phone: '01012345678',
          address: 'القاهرة، مصر',
          status: 'active',
          subscription_fee: 40,
        },
        summary: {
          total_teachers: 10,
          active_teachers: 8,
          total_academy_students: 500,
          total_enrollments: 600,
          active_enrollments: 550,
          total_subscriptions: 550,
          total_payment_transactions: 1200,
          subscription_fee: 22000,
          total_paid: 15000,
          pending_payments: 7000,
          paying_students_count: 450,
          not_paying_students_count: 100,
          price_per_student: 40,
        },
        financial_details: {
          total_revenue: 25000,
          total_expenses: 10000,
          net_profit: 15000,
          total_collected: 20000,
          total_outstanding: 5000,
          collection_rate: 80,
        },
        monthly_breakdown: [],
        subscription_breakdown: [],
        teachers_breakdown: [
          {
            id: '1',
            name: 'أحمد محمد',
            email: 'ahmed@example.com',
            phone: '01012345678',
            status: 'active',
            total_students: 50,
            active_students: 45,
            secretaries: 2,
            subscriptions: 45,
            subscription_fee: 2700,
            total_paid: 2000,
            pending_payments: 700,
          },
        ],
      };
      expect(AcademyReportResponseSchema.parse(validResponse)).toEqual(validResponse);
    });
  });

  describe('AdminReportResponseSchema', () => {
    it('should validate complete admin report response', () => {
      const validResponse = {
        summary: {
          total_academies: 20,
          independent_teachers_count: 50,
          total_teachers: 150,
          active_teachers: 130,
          suspended_teachers: 10,
          new_teachers: 20,
          total_students: 5000,
          new_students: 500,
          total_secretaries: 75,
          total_enrollments: 5500,
          active_enrollments: 5200,
          new_enrollments: 800,
          total_subscriptions: 5200,
          academy_subscriptions: 3200,
          independent_subscriptions: 2000,
          total_subscription_fees: 312000,
          total_paid: 250000,
          pending_payments: 62000,
          platform_net_profit: 250000,
        },
        financial_details: {
          total_revenue: 350000,
          total_expenses: 100000,
          net_profit: 250000,
          total_collected: 300000,
          total_outstanding: 50000,
          collection_rate: 85.71,
        },
        monthly_breakdown: [],
        subscription_breakdown: [],
        teachers_breakdown: [],
      };
      expect(AdminReportResponseSchema.parse(validResponse)).toEqual(validResponse);
    });
  });

  describe('TeacherListItemSchema', () => {
    it('should validate teacher list item with subscription_fee', () => {
      const validItem = {
        id: '1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        status: 'active',
        students_count: 100,
        secretaries_count: 5,
        joined: '2024-01-01',
        subscription_fee: 60,
      };
      expect(TeacherListItemSchema.parse(validItem)).toEqual(validItem);
    });

    it('should use default value of 0 for missing subscription_fee', () => {
      const itemWithoutFee = {
        id: '1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        status: 'active',
        students_count: 100,
        secretaries_count: 5,
        joined: '2024-01-01',
        // subscription_fee is missing
      };
      const parsed = TeacherListItemSchema.parse(itemWithoutFee);
      expect(parsed.subscription_fee).toBe(0);
    });
  });

  describe('AcademyListItemSchema', () => {
    it('should validate academy list item with subscription_fee', () => {
      const validItem = {
        id: '1',
        name: 'أكاديمية التفوق',
        email: 'info@academy.com',
        phone: '01012345678',
        status: 'active',
        teachers_count: 10,
        students_count: 500,
        joined: '2024-01-01',
        subscription_fee: 40,
        plan_max_students: 1000,
        plan_expires_at: '2025-01-01',
      };
      expect(AcademyListItemSchema.parse(validItem)).toEqual(validItem);
    });
  });

  describe('TeachersListResponseSchema', () => {
    it('should validate teachers list response', () => {
      const validResponse = {
        teachers: [
          {
            id: '1',
            name: 'أحمد محمد',
            email: 'ahmed@example.com',
            phone: '01012345678',
            status: 'active',
            students_count: 100,
            secretaries_count: 5,
            joined: '2024-01-01',
            subscription_fee: 60,
          },
        ],
        count: 1,
      };
      expect(TeachersListResponseSchema.parse(validResponse)).toEqual(validResponse);
    });
  });

  describe('AcademiesListResponseSchema', () => {
    it('should validate academies list response', () => {
      const validResponse = {
        academies: [
          {
            id: '1',
            name: 'أكاديمية التفوق',
            email: 'info@academy.com',
            phone: '01012345678',
            status: 'active',
            teachers_count: 10,
            students_count: 500,
            joined: '2024-01-01',
            subscription_fee: 40,
            plan_max_students: 1000,
          },
        ],
        count: 1,
      };
      expect(AcademiesListResponseSchema.parse(validResponse)).toEqual(validResponse);
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateSummaryTotals', () => {
    it('should calculate totals from multiple summaries', () => {
      const summaries = [
        { total_students: 100, active_students: 80, new_enrollments: 20 },
        { total_students: 150, active_students: 120, new_enrollments: 30 },
      ];
      
      const totals = calculateSummaryTotals(summaries);
      expect(totals).toEqual({
        total_students: 250,
        active_students: 200,
        new_enrollments: 50,
      });
    });
  });

  describe('calculateFinancialTotals', () => {
    it('should calculate financial totals correctly', () => {
      const financialDetails = {
        total_revenue: 10000,
        total_expenses: 3000,
        net_profit: 7000,
        total_collected: 8000,
        total_outstanding: 2000,
        collection_rate: 80,
      };
      
      const totals = calculateFinancialTotals([financialDetails, financialDetails]);
      expect(totals).toEqual({
        total_revenue: 20000,
        total_expenses: 6000,
        net_profit: 14000,
        total_collected: 16000,
        total_outstanding: 4000,
        collection_rate: 80, // Averaged
      });
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in Arabic locale', () => {
      expect(formatCurrency(1000)).toContain('ج.م');
      expect(formatCurrency(1000)).toContain('1,000');
    });

    it('should format currency in English locale', () => {
      expect(formatCurrency(1000, 'en')).toContain('EGP');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with proper separators', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });
});
