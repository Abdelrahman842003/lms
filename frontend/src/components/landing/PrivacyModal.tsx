'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(180deg, rgba(23, 23, 33, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        <div className="modal-header border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white">سياسة الخصوصية</h3>
          <Button
            variant="ghost"
            size="sm"
            className="modal-close text-gray-400 hover:text-white"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>
        
        <div className="modal-body py-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6 text-gray-300">
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                1. جمع المعلومات
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                نحن نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند استخدامك للمنصة، بما في ذلك الاسم، البريد الإلكتروني، ورقم الهاتف، والبيانات التعليمية اللازمة لتوفير خدماتنا.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                2. استخدام المعلومات
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                نستخدم المعلومات التي نجمعها لتوفير المنصة وصيانتها وتحسينها، وللتواصل معك بشأن تحديثات النظام، ولتخصيص تجربتك التعليمية.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                3. حماية البيانات
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                نحن نتخذ تدابير أمنية تقنية وإدارية متقدمة لحماية معلوماتك من الوصول غير المصرح به أو الفقدان أو السرقة. يتم تشفير البيانات الحساسة لضمان أقصى درجات الأمان.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                4. خصوصية الطلاب
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                نحن نولي أهمية قصوى لخصوصية الطلاب. لا نقوم ببيع أو مشاركة بيانات الطلاب الشخصية أو التعليمية مع أي أطراف ثالثة لأغراض تسويقية أو تجارية.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                5. حقوق المستخدم
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                لك الحق في الوصول إلى معلوماتك الشخصية وتصحيحها أو طلب حذفها. يمكنك القيام بذلك من خلال إعدادات حسابك أو التواصل مع فريق الدعم الفني.
              </p>
            </section>

            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                6. التغييرات في سياسة الخصوصية
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لمواكبة التطورات التقنية أو القانونية. سنقوم بإخطارك بأي تغييرات جوهرية عبر المنصة.
              </p>
            </section>
          </div>
        </div>

        <div className="modal-footer border-t border-white/10 pt-4 mt-2 flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="px-8"
          >
            فهمت ذلك
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
