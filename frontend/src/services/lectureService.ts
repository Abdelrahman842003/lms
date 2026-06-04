// Clean base URL - remove trailing /api or / to avoid duplication
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

export interface Lecture {
  id: string;
  title: string;
  description: string | null;
  display_title?: string;
  display_description?: string | null;
  next_session_date?: string | null;
  next_session_title?: string | null;
  next_session_description?: string | null;
  start_time: string;
  end_time: string;
  date: string;
  time: string;
  duration: string;
  enrolled: number;
  present_count?: number;
  status: string;
  created_at: string;
  qr_code?: string;
  qr_code_expires_at?: string;
  is_active?: boolean;
  teacher?: {
    id: string;
    name: string;
  } | null;
  grade_id?: string | null;
  grade?: {
    id: string;
    name: string;
  } | null;
  group_id?: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
  is_recurring?: boolean;
  recurrence_days?: string[] | null;
  recurrence_time?: string | null;
  duration_minutes?: number | null;
  cancelled_dates?: string[];
  current_session_end_time?: string;
  current_session?: {
    description?: string;
  };
}

export interface CreateLectureData {
  title: string;
  description?: string;
  grade_id?: string;
  group_id?: string;
  date?: string;
  is_recurring?: boolean;
  recurrence_days?: string[];
  recurrence_time?: string;
  duration_minutes?: number;
}

export interface UpdateLectureData {
  title?: string;
  description?: string;
  grade_id?: string;
  group_id?: string;
  date?: string;
}

export interface Attendee {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  status: 'present' | 'absent';
  attended_at: string;
}

export interface AttendeesResponse {
  lecture: {
    id: string;
    title: string;
    is_recurring?: boolean;
    recurrence_days?: string[] | null;
    group_name?: string;
  };
  attendees: Attendee[];
  total_present: number;
  total_absent: number;
  available_dates?: { date: string; status: string }[];
}



export interface LecturesResponse {
  lectures: Lecture[];
}

import { fetchApi, getAuthToken } from './authService';

export const getLectures = async (
  page = 1, 
  perPage = 10,
  filters?: { search?: string; date_from?: string; date_to?: string; group_id?: string; status?: string }
): Promise<{ data: { lectures: Lecture[] }; meta?: { current_page: number; last_page: number; total: number } }> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
    ...(filters?.group_id && { group_id: filters.group_id }),
    ...(filters?.status && { status: filters.status }),
  });

  const response = await fetchApi<any>(`/api/teacher/lectures?${queryParams}`);

  // fetchApi returns `res.data` directly.
  // Normalize all known payload variants safely:
  // 1) { lectures: [...], meta: {...} }
  // 2) { data: [...], meta: {...} } (Laravel paginated resource)
  // 3) { data: { lectures: [...] } } (legacy wrapper)
  const root = response ?? {};
  const lectures = Array.isArray(root?.lectures)
    ? root.lectures
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.data?.lectures)
        ? root.data.lectures
        : [];

  const meta = root?.meta ?? root?.data?.meta;

  return {
    data: { lectures },
    meta,
  };
};

export const createLecture = async (data: CreateLectureData): Promise<Lecture> => {
  const res = await fetchApi<{ lecture: Lecture }>('/teacher/lectures', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.lecture;
};

export const updateLecture = async (id: string, data: UpdateLectureData): Promise<Lecture> => {
  const res = await fetchApi<{ lecture: Lecture }>(`/teacher/lectures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.lecture;
};

export const deleteLecture = async (id: string): Promise<void> => {
  await fetchApi(`/api/teacher/lectures/${id}`, {
    method: 'DELETE',
  });
};

export const generateAttendanceCode = async (id: string): Promise<{ code: string; expires_at: string }> => {
  // Check if offline — generate code locally
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit random
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store in IndexedDB for later sync
    try {
      const { syncEngine } = await import('@/lib/offline/sync-engine');
      await syncEngine.enqueue(
        `${API_BASE_URL}/api/v1/teacher/lectures/${id}/attendance-code`,
        'POST',
        { offline_generated_code: code, lecture_id: id, expires_at: expiresAt },
        'attendance',
        id
      );
    } catch (e) {
      console.warn('[generateAttendanceCode] Failed to enqueue for sync:', e);
    }

    return { code, expires_at: expiresAt };
  }

  return await fetchApi(`/api/teacher/lectures/${id}/attendance-code`, {
    method: 'POST',
  });
};

export const invalidateAttendanceCode = async (id: string): Promise<{ message: string }> => {
  // If offline, just return success — code was generated locally anyway
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[invalidateAttendanceCode] Offline: code invalidated locally');
    return { message: 'تم إلغاء الكود محلياً' };
  }

  return await fetchApi(`/api/teacher/lectures/${id}/attendance-code`, {
    method: 'DELETE',
  });
};

export const recordAttendance = async (lectureId: string, studentId: string): Promise<{ message: string }> => {
  return await fetchApi(`/api/teacher/lectures/${lectureId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
};

export const markStudentAttendance = async (code: string): Promise<{ message: string; lecture: string }> => {
  return await fetchApi('/student/attend', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

export const toggleLectureActive = async (id: string, is_active?: boolean): Promise<{ message: string; is_active: boolean }> => {
  // Offline: return optimistic result + queue for sync
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const newState = typeof is_active === 'boolean' ? is_active : true;
    try {
      const { syncEngine } = await import('@/lib/offline/sync-engine');
      await syncEngine.enqueue(
        `${API_BASE_URL}/api/v1/teacher/lectures/${id}/toggle-active`,
        'PUT',
        typeof is_active === 'boolean' ? { is_active } : {},
        'lectureActivation',
        id,
      );
    } catch (e) {
      console.warn('[toggleLectureActive] Failed to enqueue:', e);
    }
    return {
      message: newState ? 'تم تفعيل المحاضرة محلياً' : 'تم إيقاف المحاضرة محلياً',
      is_active: newState,
    };
  }

  return await fetchApi(`/api/teacher/lectures/${id}/toggle-active`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof is_active === 'boolean' ? JSON.stringify({ is_active }) : undefined
  });
};

export const endLecture = async (id: string): Promise<Lecture> => {
  // Offline: return optimistic result + queue for sync
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const { syncEngine } = await import('@/lib/offline/sync-engine');
      await syncEngine.enqueue(
        `${API_BASE_URL}/api/v1/teacher/lectures/${id}/end`,
        'POST',
        {},
        'lectureEnd',
        id,
      );
    } catch (e) {
      console.warn('[endLecture] Failed to enqueue:', e);
    }
    return { id, is_active: false, status: 'منتهية' } as unknown as Lecture;
  }

  const res = await fetchApi<{ lecture: Lecture }>(`/api/teacher/lectures/${id}/end`, {
    method: 'POST',
  });
  return res.lecture;
};

export const getAttendees = async (
  lectureId: string, 
  groupId?: string,
  filters?: { date_from?: string; date_to?: string }
): Promise<AttendeesResponse> => {
  const queryParams = new URLSearchParams();
  if (groupId) {
    queryParams.append('group_id', groupId);
  }
  if (filters?.date_from) {
    queryParams.append('date_from', filters.date_from);
  }
  if (filters?.date_to) {
    queryParams.append('date_to', filters.date_to);
  }
  
  return await fetchApi(`/api/teacher/lectures/${lectureId}/attendees?${queryParams.toString()}`);
};

export const exportAttendeesPDF = async (lectureId: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lectures/${lectureId}/attendees/export`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('فشل تحميل ملف التقرير');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_report_${lectureId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const cancelSession = async (id: string, date: string): Promise<Lecture> => {
  const res = await fetchApi<{ lecture: Lecture }>(`/api/teacher/lectures/${id}/cancel-session`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
  return res.lecture;
};

export interface LectureSession {
  id: string;
  lecture_id: string;
  date: string;
  title?: string;
  description?: string;
  is_cancelled: boolean;
}

export const getLectureSessions = async (lectureId: string, params?: { date_from?: string; date_to?: string }): Promise<LectureSession[]> => {
  const queryParams = new URLSearchParams(params as Record<string, string>);
  return await fetchApi(`/api/teacher/lectures/${lectureId}/sessions?${queryParams}`);
};

export const updateLectureSession = async (lectureId: string, data: { date: string; title?: string; description?: string; is_cancelled?: boolean }): Promise<LectureSession> => {
  return await fetchApi(`/api/teacher/lectures/${lectureId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
