'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeacherInfo, getStudentTeacherDashboard } from '@/services/authService';

interface StudentTeacherContextType {
  selectedTeacherId: string | null;
  selectedTeacher: TeacherInfo | null;
  teachers: TeacherInfo[];
  dashboardData: any | null;
  isLoading: boolean;
  selectTeacher: (teacherId: string) => void;
  refreshDashboard: () => Promise<void>;
}

const StudentTeacherContext = createContext<StudentTeacherContextType | undefined>(undefined);

export function StudentTeacherProvider({ children }: { children: ReactNode }) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const storedTeachers = localStorage.getItem('studentTeachers');
      const storedTeacherId = localStorage.getItem('selectedTeacherId');
      
      if (storedTeachers) {
        const parsedTeachers = JSON.parse(storedTeachers);
        setTeachers(parsedTeachers);
        
        if (storedTeacherId) {
          setSelectedTeacherId(storedTeacherId);
          const teacher = parsedTeachers.find((t: TeacherInfo) => t.teacher_id === storedTeacherId);
          if (teacher) {
            setSelectedTeacher(teacher);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
    setIsLoading(false);
  }, []);

  // Fetch dashboard data when teacher is selected
  useEffect(() => {
    if (selectedTeacherId) {
      refreshDashboard();
    }
  }, [selectedTeacherId]);

  const selectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    localStorage.setItem('selectedTeacherId', teacherId);
    
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacher);
    }
  };

  const refreshDashboard = async () => {
    if (!selectedTeacherId) return;
    
    setIsLoading(true);
    try {
      const data = await getStudentTeacherDashboard(selectedTeacherId);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: StudentTeacherContextType = {
    selectedTeacherId,
    selectedTeacher,
    teachers,
    dashboardData,
    isLoading,
    selectTeacher,
    refreshDashboard,
  };

  return (
    <StudentTeacherContext.Provider value={value}>
      {children}
    </StudentTeacherContext.Provider>
  );
}

export function useStudentTeacher() {
  const context = useContext(StudentTeacherContext);
  if (context === undefined) {
    throw new Error('useStudentTeacher must be used within a StudentTeacherProvider');
  }
  return context;
}
