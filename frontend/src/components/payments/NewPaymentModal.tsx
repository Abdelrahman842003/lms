'use client';

import React, { useState, useEffect } from 'react';
import { createPayment } from '@/services/paymentService';
import { fetchApi } from '@/services/authService';
import toast from 'react-hot-toast';

import { Button, Icon, LoadingSpinner, Input } from '@/components/ui';

interface Student {
  id: string;
  name: string;
  phone?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: (code: string, amount: number, studentName: string) => void;
}

export default function NewPaymentModal({ onClose, onSuccess }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response: any = await fetchApi('/api/teacher/students?per_page=100');
        const enrollments = response.data.students?.data || response.data.students || [];
        const studentList = enrollments.map((e: any) => ({
          id: e.student?.id || e.id,
          name: e.student?.name || e.name,
          phone: e.student?.phone || e.phone,
        }));
        setStudents(studentList);
      } catch {
        toast.error('فشل في تحميل الطلاب');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
  );

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('اختر طالب');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPayment({
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        amount: parseFloat(amount),
        notes: notes || undefined,
      });

      toast.success('تم تسجيل الدفعة بنجاح');
      onSuccess(result.confirmation_code, parseFloat(amount), selectedStudent.name);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تسجيل الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-modal">
        {/* Header */}
        <div className="modal-header">
          <h3>تسجيل دفعة جديدة</h3>
          <Button variant="ghost" onClick={onClose} className="modal-close" aria-label="إغلاق">
            <Icon name="times" size="xl" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body payment-form">
          {/* Student Selection */}
          <div className="form-group ui-form-group">
            <label>اختر الطالب</label>
            
            {/* Search */}
            <Input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="payment-search-input"
            />

            {/* Student List */}
            <div className="payment-student-list">
              {isLoading ? (
                <div className="payment-list-loading">
                  <LoadingSpinner size="md" color="primary" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="payment-empty">لا يوجد طلاب</p>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className={`payment-student-item ${
                      selectedStudent?.id === student.id ? 'selected' : ''
                    }`}
                  >
                    <p className="payment-student-name">{student.name}</p>
                    <p className="payment-student-phone">{student.phone || 'بدون هاتف'}</p>
                  </button>
                ))
              )}
            </div>

            {selectedStudent && (
              <div className="payment-selected-note">
                <p>
                  <Icon name="check-circle" />
                  تم اختيار: {selectedStudent.name}
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="form-group ui-form-group">
            <label>المبلغ (ج.م)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
              className="payment-amount-input"
            />
          </div>

          {/* Notes */}
          <div className="form-group ui-form-group">
            <label>ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
              className="form-input ui-textarea w-full"
            />
          </div>

          {/* Submit */}
          <div className="modal-footer">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !selectedStudent || !amount}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <Icon name="check" />
                  تسجيل الدفعة
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
