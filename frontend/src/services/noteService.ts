import { fetchApi } from '@/services/api/baseApi';

export interface NoteAttachment {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

export interface Note {
  id: string;
  title: string;
  description: string | null;
  grade_id: string;
  teacher_id: string;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
  attachments: NoteAttachment[];
  grade?: { name: string };
  teacher?: { name: string };
  groups?: { id: string; name: string }[];
}

export const noteService = {
  // Teacher / Academy
  getNotes: async (role: 'teacher' | 'academy') => {
    return fetchApi<any>(`/${role}/notes`);
  },

  initiateNote: async (role: 'teacher' | 'academy', data: { title: string; description?: string; grade_id: string; teacher_id?: string; files: { name: string; mime: string }[] }) => {
    return fetchApi<any>(`/${role}/notes/initiate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeNote: async (role: 'teacher' | 'academy', noteId: string, data: { group_ids: string[]; attachments: { name: string; file_path: string; mime_type: string; file_size: number }[] }) => {
    return fetchApi<any>(`/${role}/notes/${noteId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteNote: async (role: 'teacher' | 'academy', noteId: string) => {
    return fetchApi<any>(`/${role}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  // Student
  getStudentNotes: async () => {
    return fetchApi<any>('/student/notes');
  },

  getStudentNote: async (noteId: string) => {
    return fetchApi<any>(`/student/notes/${noteId}`);
  },

  getAttachmentUrl: async (noteId: string, attachmentId: string) => {
    return fetchApi<{ url: string; mime_type: string }>(`/student/notes/${noteId}/attachments/${attachmentId}/url`);
  },
};
