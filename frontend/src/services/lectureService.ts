// Clean base URL - remove trailing /api or / to avoid duplication
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

export interface Lecture {
  id: string;
  title: string;
  description: string | null;
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
  available_dates?: string[];
}

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T;
}

export interface LecturesResponse {
  lectures: Lecture[];
}

export const getLectures = async (
  page = 1, 
  perPage = 10,
  filters?: { search?: string; date_from?: string; date_to?: string; group_id?: string }
): Promise<any> => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
    ...(filters?.group_id && { group_id: filters.group_id }),
  });

  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures?${queryParams}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch lectures';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  const res: ApiResponse<any> = await response.json();
  return res.data;
};

export const createLecture = async (data: CreateLectureData): Promise<Lecture> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create lecture');
  }

  const res: ApiResponse<{ lecture: Lecture }> = await response.json();
  return res.data.lecture;
};

export const updateLecture = async (id: string, data: UpdateLectureData): Promise<Lecture> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update lecture');
  }

  const res: ApiResponse<{ lecture: Lecture }> = await response.json();
  return res.data.lecture;
};

export const deleteLecture = async (id: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete lecture');
  }
};

export const generateQrCode = async (id: string): Promise<{ qr_code_url: string; expires_at: string }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}/qr-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate QR code');
  }

  const res: ApiResponse<{ qr_code_url: string; expires_at: string }> = await response.json();
  return res.data;
};

export const recordAttendance = async (lectureId: string, studentId: string): Promise<{ message: string }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${lectureId}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ student_id: studentId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to record attendance');
  }

  const res: ApiResponse<{ message: string }> = await response.json();
  return res.data;
};

export const markStudentAttendance = async (token: string): Promise<{ message: string; lecture: string }> => {
  const authToken = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/student/attend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to mark attendance');
  }

  const res: ApiResponse<{ message: string; lecture: string }> = await response.json();
  return res.data;
};

export const toggleLectureActive = async (id: string): Promise<{ message: string; is_active: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}/toggle-active`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to toggle lecture activation');
  }

  const res: ApiResponse<{ message: string; is_active: boolean }> = await response.json();
  return res.data;
};

export const endLecture = async (id: string): Promise<{ message: string; lecture: Lecture }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to end lecture');
  }

  const res: ApiResponse<{ message: string; lecture: Lecture }> = await response.json();
  return res.data;
};

export const getAttendees = async (
  lectureId: string, 
  groupId?: string,
  filters?: { date_from?: string; date_to?: string }
): Promise<AttendeesResponse> => {
  const token = localStorage.getItem('token');
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
  
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${lectureId}/attendees?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'فشل جلب بيانات الحضور');
  }

  const res: ApiResponse<AttendeesResponse> = await response.json();
  return res.data;
};

export const exportAttendeesPDF = async (lectureId: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${lectureId}/attendees/export`, {
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

export const cancelSession = async (id: string, date: string): Promise<{ message: string; lecture: Lecture }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/teacher/lectures/${id}/cancel-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ date }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to cancel session');
  }

  const res: ApiResponse<{ message: string; lecture: Lecture }> = await response.json();
  return res.data;
};
