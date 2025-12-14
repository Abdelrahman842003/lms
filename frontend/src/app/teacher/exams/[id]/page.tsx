'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getExam } from '@/services/authService';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  date: string;
  duration: number;
  max_score: number;
  questions: Question[];
}

export default function ExamDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchExamDetails(params.id as string);
    }
  }, [params.id]);

  const fetchExamDetails = async (id: string) => {
    try {
      const data = await getExam(id);
      setExam(data);
    } catch (error) {
      console.error('Error fetching exam details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-white">
        Exam not found
      </div>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      headerActions={null}
    >
      {/* Exam Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard 
          title="عنوان الامتحان" 
          value={exam.title} 
          icon="fas fa-file-alt" 
          color="primary" 
        />
        <StatCard 
          title="المادة" 
          value={exam.subject} 
          icon="fas fa-book" 
          color="secondary" 
        />
        <StatCard 
          title="الصف الدراسي" 
          value={exam.grade?.name || '-'} 
          icon="fas fa-graduation-cap" 
          color="warning" 
        />
        <StatCard 
          title="الدرجة الكلية" 
          value={exam.max_score} 
          icon="fas fa-star" 
          color="danger" 
        />
      </div>

      {/* Questions List */}
      <DashboardCard
        title={`أسئلة الامتحان (${exam.questions.length})`}
        icon="fas fa-question-circle"
        action={
          <button onClick={() => router.back()} className="btn btn-secondary">
            <i className="fas fa-arrow-right ml-2"></i>
            رجوع
          </button>
        }
      >
        <div className="space-y-6">
          {exam.questions.map((question, index) => (
            <div key={question.id} className="bg-[#1a1f37] p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-white">
                  <span className="text-primary ml-2">س {index + 1}:</span>
                  {question.text}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, oIndex) => (
                  <div 
                    key={oIndex} 
                    className={`p-3 rounded-lg border ${
                      option === question.correct_answer 
                        ? 'border-green-500 bg-green-500/10 text-green-500' 
                        : 'border-white/10 text-gray-400'
                    }`}
                  >
                    {option}
                    {option === question.correct_answer && (
                      <i className="fas fa-check float-left mt-1"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
