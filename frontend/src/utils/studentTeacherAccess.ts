import { TeacherInfo } from "@/types/auth.types";

const ACCESSIBLE_STATUSES = new Set(["active", "grace_period", "trial"]);

export function isTeacherAccessible(teacher: TeacherInfo | null | undefined): boolean {
  if (!teacher) {
    return false;
  }

  const status = teacher.status ?? "";
  if (!ACCESSIBLE_STATUSES.has(status)) {
    return false;
  }

  const hasFineGrainedFlags =
    typeof teacher.is_teacher_suspended === "boolean" ||
    typeof teacher.is_subscription_blocked === "boolean";

  // Backward compatibility for older API payloads.
  if (!hasFineGrainedFlags) {
    if (status === "trial") {
      return true;
    }

    return !teacher.is_suspended;
  }

  if (teacher.is_teacher_suspended) {
    return false;
  }

  if (status === "trial" || status === "active" || status === "grace_period") {
    return true;
  }

  return !teacher.is_subscription_blocked;
}

export function pickPreferredTeacher(teachers: TeacherInfo[] | null | undefined): TeacherInfo | null {
  if (!teachers?.length) {
    return null;
  }

  const preferredOrder = ["active", "grace_period", "trial"] as const;

  for (const status of preferredOrder) {
    const match = teachers.find((teacher) => teacher.status === status && isTeacherAccessible(teacher));
    if (match) {
      return match;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTeacherItem(value: unknown): TeacherInfo | null {
  if (!isRecord(value)) {
    return null;
  }

  const teacherId = value.teacher_id ?? value.id;
  if (teacherId === undefined || teacherId === null) {
    return null;
  }

  return {
    ...value,
    teacher_id: String(teacherId),
  } as TeacherInfo;
}

/**
 * Accepts both the current array contract and legacy/grouped shapes,
 * then always returns a flat teacher list.
 */
export function normalizeStudentTeachers(teachers: unknown): TeacherInfo[] {
  if (!teachers) {
    return [];
  }

  if (Array.isArray(teachers)) {
    return teachers
      .map(normalizeTeacherItem)
      .filter((teacher): teacher is TeacherInfo => !!teacher);
  }

  if (!isRecord(teachers)) {
    return [];
  }

  const groupedAcademies = Array.isArray(teachers.academies) ? teachers.academies : [];
  const independentTeachers = Array.isArray(teachers.independent) ? teachers.independent : [];

  const fromAcademies = groupedAcademies.flatMap((academy: unknown) => {
    if (!isRecord(academy) || !Array.isArray(academy.teachers)) {
      return [];
    }

    const academyId = academy.academy_id ?? academy.id ?? null;
    const academyName = academy.academy_name ?? academy.name ?? null;

    return academy.teachers
      .map((teacher: unknown) => normalizeTeacherItem(teacher))
      .filter((teacher): teacher is TeacherInfo => !!teacher)
      .map((teacher) => ({
        ...teacher,
        academy_id: teacher.academy_id ?? (academyId !== null ? String(academyId) : null),
        academy_name: teacher.academy_name ?? (academyName !== null ? String(academyName) : null),
      }));
  });

  const fromIndependent = independentTeachers
    .map(normalizeTeacherItem)
    .filter((teacher): teacher is TeacherInfo => !!teacher);

  return [...fromAcademies, ...fromIndependent];
}
