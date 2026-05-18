'use client';

import React from 'react';
import QuestionsPage from '@/app/teacher/questions/page';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

// We reuse the teacher questions page logic
// For now, it shows the same content as the teacher bank
export default function AcademyQuestionsPage() {
  return (
    <QuestionsPage role="academy" />
  );
}
