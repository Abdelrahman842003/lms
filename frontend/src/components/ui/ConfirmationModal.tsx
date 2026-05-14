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

  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return { icon: 'exclamation-triangle', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', btn: 'destructive' as const };
      case 'success':
        return { icon: 'check-circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', btn: 'secondary' as const };
      case 'warning':
        return { icon: 'exclamation-circle', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', btn: 'primary' as const };
      default:
        return { icon: 'info-circle', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', btn: 'primary' as const };
    }
  };

  const config = getVariantConfig();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md premium-glass premium-border rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Top Accent Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${variant === 'danger' ? 'from-rose-600 to-rose-400' : 'from-primary to-purple-600'}`}></div>

        <div className="p-8 md:p-10 space-y-6 text-center">
          {/* Large Animated Icon */}
          <div className={`w-20 h-20 mx-auto rounded-full ${config.bg} ${config.border} border flex items-center justify-center animate-in zoom-in-75 duration-500`}>
            <Icon name={config.icon as any} className={`${config.color} text-4xl`} />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
            <div className="text-gray-light/60 font-medium leading-relaxed">
              {message}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {showCancel && (
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-2xl py-4 font-black text-gray-light/40 border-white/10 hover:bg-white/5 hover:text-white"
                onClick={onCancel}
                disabled={isProcessing}
              >
                {cancelText}
              </Button>
            )}
            {confirmText && (
              <Button
                variant={config.btn}
                size="lg"
                className={`w-full rounded-2xl py-4 font-black shadow-xl relative overflow-hidden group/btn ${variant === 'primary' ? 'bg-primary' : ''}`}
                onClick={onConfirm}
                disabled={isProcessing}
                loading={isProcessing}
              >
                 <div className="relative flex items-center justify-center gap-2">
                    <span>{confirmText}</span>
                    <Icon name="arrow-left" className="animate-bounce-x" />
                 </div>
              </Button>
            )}
          </div>
        </div>

        {/* Close Button (Ghost) */}
        <button
          className="absolute top-6 right-6 text-gray-light/20 hover:text-white transition-colors"
          onClick={onCancel}
          disabled={isProcessing}
        >
          <Icon name="times" className="text-xl" />
        </button>
      </div>
    </div>,
    document.body
  );
}
