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

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="close-btn"
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
              variant={variant === 'danger' ? 'destructive' : 'primary'}
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

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483646;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: #1e1e2d;
          border-radius: 16px;
          width: 90%;
          max-width: 400px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 2147483647;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--gray-light);
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: white;
        }

        .modal-body {
          padding: 24px;
          color: var(--gray-light);
          line-height: 1.6;
          font-size: 1rem;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          font-size: 0.95rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-danger {
          background: #ef4444;
          border: none;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .btn-success {
          background: #10b981;
          border: none;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-primary {
          background: #3b82f6;
          border: none;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-warning {
          background: #f59e0b;
          border: none;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
