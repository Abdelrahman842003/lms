'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Icon } from './Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  variant?: 'danger' | 'success' | 'primary' | 'warning';
  showCancel?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  isProcessing = false,
  variant = 'danger',
  showCancel = true,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  const confirmVariant = variant === 'danger' ? 'destructive' : variant === 'success' ? 'secondary' : 'primary';

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content confirmation-modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="modal-close"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="إغلاق"
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>
        
        <div className="modal-body">
          <div>{message}</div>
        </div>

        {(showCancel || confirmText) && (
        <div className="modal-footer">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              {cancelText}
            </Button>
          )}
          {confirmText && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={isProcessing}
              loading={isProcessing}
            >
              {confirmText}
            </Button>
          )}
        </div>
        )}
      </div>
    </div>,
    document.body
  );
}
