'use client';

import React, { useState, useEffect } from 'react';
import { createPayment } from '@/services/paymentService';
import { fetchApi } from '@/services/authService';
import toast from 'react-hot-toast';

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
        const response = await fetchApi('/api/teacher/students?per_page=100');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-lighter rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">تسجيل دفعة جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Student Selection */}
          <div className="mb-6">
            <label className="block text-gray-light mb-2">اختر الطالب</label>
            
            {/* Search */}
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 mb-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary outline-none"
            />

            {/* Student List */}
            <div className="max-h-48 overflow-y-auto bg-white/5 rounded-lg border border-white/10">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-center text-gray-400 py-4">لا يوجد طلاب</p>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-3 text-right hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                      selectedStudent?.id === student.id ? 'bg-primary/20' : ''
                    }`}
                  >
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-gray-400 text-sm">{student.phone || 'بدون هاتف'}</p>
                  </button>
                ))
              )}
            </div>

            {selectedStudent && (
              <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary text-sm">
                  <i className="fas fa-check-circle ml-2"></i>
                  تم اختيار: {selectedStudent.name}
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-gray-light mb-2">المبلغ (ج.م)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-xl text-center focus:border-primary outline-none"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-gray-light mb-2">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudent || !amount}
              className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري التسجيل...
                </span>
              ) : (
                <span>
                  <i className="fas fa-check ml-2"></i>
                  تسجيل الدفعة
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
