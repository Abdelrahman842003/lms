'use client';

import React, { useEffect, useState } from 'react';
import { conflictResolver, ConflictData, ConflictResolution } from '@/lib/offline/conflict-resolver';
import { AlertTriangle, Database, Smartphone, Check, X } from 'lucide-react';

export default function ConflictResolutionModal() {
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [resolverPromise, setResolverPromise] = useState<{
    resolve: (value: ConflictResolution) => void;
  } | null>(null);

  useEffect(() => {
    // Register the manual conflict handler
    conflictResolver.registerConflictListener((conflict) => {
      setCurrentConflict(conflict);
      
      return new Promise<ConflictResolution>((resolve) => {
        setResolverPromise({ resolve });
      });
    });

    return () => {
      conflictResolver.unregisterConflictListener();
    };
  }, []);

  if (!currentConflict || !resolverPromise) return null;

  const handleResolve = (choice: ConflictResolution) => {
    resolverPromise.resolve(choice);
    setCurrentConflict(null);
    setResolverPromise(null);
  };

  const getEntityDisplayName = (type: string) => {
    switch (type) {
      case 'grades': return 'الصف الدراسي';
      case 'groups': return 'المجموعة';
      case 'lectures': return 'المحاضرة';
      case 'notes': return 'الملاحظة الدراسية';
      case 'students': return 'بيانات الطالب';
      default: return type;
    }
  };

  // Convert payload values into readable key-value list
  const renderDataDiff = (local: any, server: any) => {
    const keys = Array.from(new Set([...Object.keys(local || {}), ...Object.keys(server || {})]));
    const ignoreKeys = ['id', 'created_at', 'updated_at', 'teacher_id', 'academy_id', 'version'];

    return (
      <div className="max-h-[300px] overflow-y-auto space-y-2.5 px-1 pr-2">
        {keys.map((key) => {
          if (ignoreKeys.includes(key)) return null;
          
          const localVal = local?.[key];
          const serverVal = server?.[key];
          const hasDiff = JSON.stringify(localVal) !== JSON.stringify(serverVal);

          return (
            <div 
              key={key} 
              className={`p-3 rounded-lg border text-sm font-arabic flex flex-col gap-1 transition-all ${
                hasDiff 
                  ? 'border-amber-500/30 bg-amber-500/5' 
                  : 'border-white/5 bg-white/5 opacity-60'
              }`}
            >
              <span className="font-bold text-gray-400 capitalize">{key.replace('_', ' ')}</span>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-blue-400 block mb-1">نسختك المحلية:</span>
                  <span className="text-white break-all font-medium">{String(localVal ?? '—')}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-400 block mb-1">نسخة السيرفر:</span>
                  <span className="text-white break-all font-medium">{String(serverVal ?? '—')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#1d2446] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn text-white flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold font-arabic">تعارض في مزامنة البيانات</h3>
            <p className="text-xs text-gray-400 font-arabic">
              تم تعديل {getEntityDisplayName(currentConflict.entityType)} محلياً وأونلاين في نفس الوقت.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1">
          <p className="text-sm font-arabic text-gray-300 leading-relaxed">
            الرجاء اختيار أي من النسختين ترغب في اعتمادها لحل التعارض ومتابعة المزامنة:
          </p>

          {renderDataDiff(currentConflict.localData, currentConflict.serverData)}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5 grid grid-cols-2 gap-4">
          <button
            onClick={() => handleResolve('local')}
            className="py-3 px-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold font-arabic transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Smartphone className="w-5 h-5" />
            اعتماد نسختي المحلية
          </button>

          <button
            onClick={() => handleResolve('server')}
            className="py-3 px-4 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold font-arabic transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            الحفاظ على نسخة السيرفر
          </button>
        </div>
      </div>
    </div>
  );
}
