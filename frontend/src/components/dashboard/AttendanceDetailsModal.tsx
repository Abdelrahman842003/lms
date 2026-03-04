import React from 'react';
import { Button, Icon } from '@/components/ui';

interface AttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: {
    teacher?: {
      name: string;
    };
    date: string;
    checked_in_at: string;
    checked_out_at: string;
    duration_formatted: string;
  } | null;
}

export default function AttendanceDetailsModal({
  isOpen,
  onClose,
  attendance
}: AttendanceDetailsModalProps) {
  if (!isOpen || !attendance) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content attendance-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>تفاصيل الحضور</h3>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            <Icon name="times" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body attendance-details-body">
          {/* Teacher Name */}
          <div className="attendance-details-row">
            <span className="attendance-details-label">المدرس</span>
            <span className="attendance-details-value strong">{attendance.teacher?.name || '-'}</span>
          </div>

          {/* Date */}
          <div className="attendance-details-row">
            <span className="attendance-details-label">التاريخ</span>
            <span className="attendance-details-value">{attendance.date || '-'}</span>
          </div>

          {/* Check In */}
          <div className="attendance-details-row">
            <span className="attendance-details-label">وقت الحضور</span>
            <span className="attendance-details-value">
              {attendance.checked_in_at 
                ? new Date(attendance.checked_in_at).toLocaleTimeString('ar-EG')
                : '-'}
            </span>
          </div>

          {/* Check Out */}
          <div className="attendance-details-row">
            <span className="attendance-details-label">وقت الانصراف</span>
            <span className="attendance-details-value">
              {attendance.checked_out_at 
                ? new Date(attendance.checked_out_at).toLocaleTimeString('ar-EG')
                : '-'}
            </span>
          </div>

          {/* Duration */}
          <div className="attendance-details-row">
            <span className="attendance-details-label">المدة الإجمالية</span>
            <span className="attendance-details-value duration">
              {attendance.duration_formatted || '0h 0m'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button
            variant="outline"
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
