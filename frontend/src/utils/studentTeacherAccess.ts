import { TeacherInfo } from "@/types/auth.types";

const ACCESSIBLE_STATUSES = new Set(["active", "grace_period", "trial"]);

export function isTeacherAccessible(teacher: TeacherInfo | null | undefined): boolean {
  if (!teacher) {
    return false;
  }

  return !teacher.is_suspended && ACCESSIBLE_STATUSES.has(teacher.status ?? "");
}

export function pickPreferredTeacher(teachers: TeacherInfo[] | null | undefined): TeacherInfo | null {
  if (!teachers?.length) {
    return null;
  }

  const preferredOrder = ["active", "grace_period", "trial"] as const;

  for (const status of preferredOrder) {
    const match = teachers.find((teacher) => teacher.status === status && !teacher.is_suspended);
    if (match) {
      return match;
    }
  }

  return null;
}
