import { fetchApi } from './authService';

interface ScanAttendanceResponse {
  status: boolean;
  data: {
    log: {
      id: number;
      teacher_id: number;
      academy_id: number;
      date: string;
      checked_in_at: string | null;
      checked_out_at: string | null;
      status: 'checked_in' | 'checked_out';
      duration_formatted?: string;
    };
    academy: {
      id: number;
      name: string;
    };
    message: string;
  };
}

interface QRCodeData {
  academy_id: number;
  type: 'check_in' | 'check_out';
  timestamp: number;
  valid_until: number;
}

/**
 * Scan QR code for attendance check-in or check-out
 */
export const scanAttendance = async (qrCodeString: string): Promise<ScanAttendanceResponse> => {
  try {
    // Parse QR code JSON
    const qrData: QRCodeData = JSON.parse(qrCodeString);
    
    // Validate QR code expiration
    const now = Date.now();
    if (qrData.valid_until && now > qrData.valid_until) {
      throw new Error('رمز QR منتهي الصلاحية. يرجى مسح رمز جديد.');
    }
    
    // Determine endpoint based on type
    const endpoint = qrData.type === 'check_in' 
      ? '/teacher/scan/checkin' 
      : '/teacher/scan/checkout';
    
    // Make API call
    const response = await fetchApi(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        qr_code: qrCodeString
      })
    });
    
    return {
      status: true,
      data: response
    };
  } catch (error: any) {
    // If JSON parse fails
    if (error instanceof SyntaxError) {
      throw new Error('رمز QR غير صالح');
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Get today's attendance status for the teacher
 */
export const getTodayAttendanceStatus = async () => {
  const response = await fetchApi('/teacher/scan/today-status');
  return {
    status: true,
    data: response
  };
};

export const getGrades = async () => {
  return await fetchApi('/teacher/grades?per_page=100');
};

export const getGroups = async (gradeId?: string) => {
  const query = gradeId ? `?grade_id=${gradeId}&per_page=100` : '?per_page=100';
  return await fetchApi(`/teacher/groups${query}`);
};
