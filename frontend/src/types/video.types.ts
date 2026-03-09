export type VideoStatus =
  | 'draft'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'deleted';

export interface VideoGroup {
  id: string;
  name: string;
}

export interface VideoAttachment {
  id: string;
  title?: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
}

export interface VideoWatchProgress {
  status: 'not_started' | 'started' | 'in_progress' | 'completed';
  started_at?: string | null;
  last_watched_at?: string | null;
  completed_at?: string | null;
  watched_seconds: number;
  watched_percentage: number;
  last_position_seconds: number;
}

export interface VideoComment {
  id: string;
  video_id: string;
  parent_id?: string | null;
  body: string;
  is_hidden: boolean;
  created_at: string;
  author: {
    type: string;
    id: string;
    name?: string;
  };
  replies?: VideoComment[];
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  owner_type: 'independent_teacher' | 'academy';
  owner_id: string;
  academy_id?: string | null;
  teacher_reference?: {
    id?: string | null;
    name?: string | null;
  };
  grade_id: string;
  grade?: {
    id: string;
    name: string;
  };
  groups?: VideoGroup[];
  status: VideoStatus;
  processing_status: 'pending' | 'running' | 'succeeded' | 'failed';
  scheduled_at?: string | null;
  published_at?: string | null;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  codec?: string | null;
  frame_rate?: number | null;
  thumbnail_url?: string | null;
  processing_error?: string | null;
  likes_count?: number;
  liked_by_me?: boolean | null;
  comments_count?: number;
  attachments_count?: number;
  attachments?: VideoAttachment[];
  created_at?: string;
  updated_at?: string;
}

export interface PlaybackTokenPayload {
  token: string;
  expires_at: string;
  stream_url: string;
  stream_endpoint?: string;
  watermark: {
    enabled: boolean;
    rotation_interval_seconds: number;
    note: string;
  };
}

export interface CreateVideoPayload {
  title: string;
  description?: string;
  grade_id: string;
  group_ids: string[];
  lecture_id?: string;
  lesson_id?: string;
  scheduled_at?: string;
  available_from?: string;
  available_until?: string;
  teacher_reference_id?: string;
  teacher_reference_name?: string;
  video_file: File;
  attachments?: File[];
}

// ─── Direct-to-R2 multipart upload types ────────────────────────────────────

/** Metadata sent to /initiate-upload — no video bytes. */
export interface InitiateUploadPayload {
  title: string;
  description?: string;
  grade_id: string;
  group_ids: string[];
  lecture_id?: string;
  lesson_id?: string;
  scheduled_at?: string;
  available_from?: string;
  available_until?: string;
  teacher_reference_id?: string;
  teacher_reference_name?: string;
  /** Original filename e.g. "lecture1.mp4" */
  file_name: string;
  /** Byte count of the local file */
  file_size: number;
  /** MIME type e.g. "video/mp4" */
  file_mime: string;
  /** How many parts the client intends to upload */
  total_parts: number;
  attachments?: File[];
}

/** Presigned URL for a single part */
export interface PresignedPart {
  part_number: number;
  url: string;
}

/** Server response from /initiate-upload */
export interface InitiateUploadResponse {
  session_id: string;
  video_id: string;
  presigned_parts: PresignedPart[];
  chunk_size_bytes: number;
}

/** Part number collected after each PUT (ETag fetched server-side via listParts) */
export interface PartResult {
  part_number: number;
}

/** Server response from /complete-upload */
export interface CompleteUploadResponse {
  video_id: string;
  status: string;
}

/** Server response from /upload-status/:sessionId */
export interface UploadSessionStatus {
  session_id: string;
  status: 'pending_upload' | 'uploading' | 'completing' | 'completed' | 'aborted' | 'failed';
  video_id: string;
  initiated_at: string;
  completed_at?: string | null;
}
