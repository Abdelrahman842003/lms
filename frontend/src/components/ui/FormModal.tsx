import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  maxWidth?: string;
}

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  isLoading = false,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  maxWidth = '600px'
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="modal-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Body */}
          <div className="modal-body">
            {children}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {cancelText && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isLoading}
            >
              {submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
