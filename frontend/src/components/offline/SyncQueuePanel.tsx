'use client';

import React, { useEffect, useState } from 'react';
import { getDB, SyncQueueItem } from '@/lib/offline/db';
import { syncEngine } from '@/lib/offline/sync-engine';
import { Clock, AlertTriangle, RefreshCw, Trash2, X, AlertCircle, FileText } from 'lucide-react';

interface SyncQueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncQueuePanel({ isOpen, onClose }: SyncQueuePanelProps) {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      const db = await getDB();
      const items = await db.getAll('syncQueue');
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to read sync queue:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const handleRetryAll = async () => {
    setIsLoading(true);
    try {
      await syncEngine.processQueue();
      await fetchQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const db = await getDB();
      await db.delete('syncQueue', id);
      await fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const getEntityName = (type: string) => {
    switch (type) {
      case 'grades': return 'إضافة صف جديد';
      case 'groups': return 'إضافة مجموعة جديدة';
      case 'lectures': return 'إضافة محاضرة جديدة';
      case 'notes': return 'حفظ ملاحظة دراسية';
      case 'students': return 'إضافة طالب جديد';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            معلق
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            جاري الرفع
          </span>
        );
      case 'conflict':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            تعارض
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            فشل
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-arabic text-white select-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 max-w-md w-full bg-[#1b203e] shadow-2xl flex flex-col border-r border-white/10 animate-slideInLeft">
        {/* Panel Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#4263eb]" />
            <h3 className="font-bold text-lg">العمليات المحلية المعلقة</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {queueItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <Clock className="w-10 h-10 text-gray-500" />
              <p className="text-sm">لا توجد عمليات محلية بانتظار المزامنة.</p>
            </div>
          ) : (
            queueItems.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-bold block">{getEntityName(item.entityType)}</span>
                    <span className="text-[10px] text-gray-400 block">
                      {new Date(item.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {item.errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                    {item.errorMessage}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 transition-all flex items-center justify-center gap-1 text-[11px] font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف من القائمة
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Footer */}
        {queueItems.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-white/5">
            <button
              onClick={handleRetryAll}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#4263eb] to-[#3b5bdb] hover:from-[#3b5bdb] hover:to-[#2b4cbe] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              مزامنة كافة المعلقات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
