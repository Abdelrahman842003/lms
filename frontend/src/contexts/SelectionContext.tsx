/**
 * Selection Context
 * 
 * Handles teacher, child, and academy selections separately
 * from the main authentication logic for better modularity.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCoreAuth } from './CoreAuthContext';
import { TeacherInfo, ChildInfo, AcademyInfo } from "@/types";
import { isTeacherAccessible, pickPreferredTeacher } from "@/utils/studentTeacherAccess";

interface SelectionContextType {
  // Teacher selection (for students)
  selectedTeacher: TeacherInfo | null;
  selectTeacher: (teacher: TeacherInfo) => void;
  
  // Child selection (for parents)
  selectedChild: ChildInfo | null;
  children: ChildInfo[];
  selectChild: (child: ChildInfo) => void;
  
  // Academy selection (for teachers)
  selectedAcademy: AcademyInfo | null;
  selectAcademy: (academy: AcademyInfo) => void;
  
  // Utility functions
  clearSelections: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useCoreAuth();
  const router = useRouter();
  
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [selectedAcademy, setSelectedAcademy] = useState<AcademyInfo | null>(null);
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);

  // Load selections from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      // Load selected teacher
      const storedTeacher = localStorage.getItem("selectedTeacher");
      if (storedTeacher) {
        setSelectedTeacher(JSON.parse(storedTeacher));
      }

      // Load selected academy
      const storedAcademy = localStorage.getItem("selectedAcademy");
      if (storedAcademy) {
        setSelectedAcademy(JSON.parse(storedAcademy));
      }

      // Load parent children
      const storedChildren = localStorage.getItem("parentChildren");
      if (storedChildren) {
        const childrenData = JSON.parse(storedChildren);
        setChildrenList(childrenData);
      }

      // Load selected child
      const storedChild = localStorage.getItem("selectedChild");
      if (storedChild) {
        setSelectedChild(JSON.parse(storedChild));
      }
    } catch (error) {
      console.error("SelectionContext: Failed to load stored selections:", error);
    }
  }, [isAuthenticated]);

  // Smart teacher selection for students
  useEffect(() => {
    if (user?.userType === "student" && user.teachers && user.teachers.length > 0) {
      const currentSelected = localStorage.getItem("selectedTeacher");
      const bestTeacher = pickPreferredTeacher(user.teachers);

      if (currentSelected) {
        const parsedCurrent = JSON.parse(currentSelected);
        const updatedCurrent = user.teachers.find(
          (t: any) => t.enrollment_id && parsedCurrent.enrollment_id
            ? t.enrollment_id === parsedCurrent.enrollment_id
            : t.teacher_id === parsedCurrent.teacher_id
        );

        // If current is still valid, keep it. Otherwise switch to best.
        if (updatedCurrent && isTeacherAccessible(updatedCurrent)) {
          setSelectedTeacher(updatedCurrent);
          localStorage.setItem("selectedTeacher", JSON.stringify(updatedCurrent));
        } else if (bestTeacher) {
          setSelectedTeacher(bestTeacher);
          localStorage.setItem("selectedTeacher", JSON.stringify(bestTeacher));
        } else {
          setSelectedTeacher(null);
          localStorage.removeItem("selectedTeacher");
        }
      } else if (bestTeacher) {
        setSelectedTeacher(bestTeacher);
        localStorage.setItem("selectedTeacher", JSON.stringify(bestTeacher));
      } else {
        setSelectedTeacher(null);
        localStorage.removeItem("selectedTeacher");
      }
    }
  }, [user]);

  // Auto-select academy for teachers
  useEffect(() => {
    if (user?.userType === 'teacher') {
      const loadAcademies = async () => {
        try {
          const { getTeacherAcademies } = await import('@/services/authService');
          const academyRes = await getTeacherAcademies();
          const academyData = (academyRes as any).data || academyRes;
          const academies = academyData.academies || [];
          
          const currentSelected = localStorage.getItem("selectedAcademy");
          
          if (academies.length > 0 && !currentSelected) {
            const firstAcademy = academies[0];
            setSelectedAcademy(firstAcademy);
            localStorage.setItem("selectedAcademy", JSON.stringify(firstAcademy));
          }
        } catch (e) {
          console.error("Failed to load academies:", e);
        }
      };
      
      loadAcademies();
    }
  }, [user]);

  // Handle parent children - get from localStorage or API call
  useEffect(() => {
    if (user?.userType === "parent") {
      const userChildren = Array.isArray(user.children) ? user.children : [];
      const storedChildren = localStorage.getItem("parentChildren");

      if (userChildren.length > 0) {
        setChildrenList(userChildren);
        localStorage.setItem("parentChildren", JSON.stringify(userChildren));

        if (!selectedChild) {
          setSelectedChild(userChildren[0]);
          localStorage.setItem("selectedChild", JSON.stringify(userChildren[0]));
        }

        return;
      }

      if (storedChildren) {
        try {
          const childrenData = JSON.parse(storedChildren);
          setChildrenList(childrenData);
          
          // Auto-select first child if none selected
          if (childrenData.length > 0 && !selectedChild) {
            setSelectedChild(childrenData[0]);
            localStorage.setItem("selectedChild", JSON.stringify(childrenData[0]));
          }
        } catch (error) {
          console.error("Failed to load children data:", error);
        }
      }
    }
  }, [user, selectedChild]);

  // Clear selections when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedTeacher(null);
      setSelectedChild(null);
      setSelectedAcademy(null);
      setChildrenList([]);
    }
  }, [isAuthenticated]);

  const selectTeacher = (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    localStorage.setItem("selectedTeacher", JSON.stringify(teacher));
  };

  const selectChild = (child: ChildInfo) => {
    setSelectedChild(child);
    localStorage.setItem("selectedChild", JSON.stringify(child));
  };

  const selectAcademy = (academy: AcademyInfo) => {
    setSelectedAcademy(academy);
    localStorage.setItem("selectedAcademy", JSON.stringify(academy));
    // Avoid hard reload (it may drop in-memory auth token and force logout).
    // Most pages listen to selectedAcademy changes and will refetch.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("academy:changed"));
    }
    router.refresh();
  };

  const clearSelections = () => {
    setSelectedTeacher(null);
    setSelectedChild(null);
    setSelectedAcademy(null);
    setChildrenList([]);
    
    localStorage.removeItem("selectedTeacher");
    localStorage.removeItem("selectedChild");
    localStorage.removeItem("selectedAcademy");
    localStorage.removeItem("parentChildren");
  };

  const value = {
    selectedTeacher,
    selectTeacher,
    selectedChild,
    children: childrenList,
    selectChild,
    selectedAcademy,
    selectAcademy,
    clearSelections,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}

export { SelectionContext };
