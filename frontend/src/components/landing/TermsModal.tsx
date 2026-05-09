'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
          <h3 className="text-xl font-bold text-white">شروط الاستخدام</h3>
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
                1. قبول الشروط
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                باستخدامك لمنصة نيتاق، فإنك توافق على الالتزام بشروط الاستخدام هذه وكافة القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                2. ترخيص الاستخدام
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                يُمنح المستخدم ترخيصاً محدوداً وغير حصري للوصول إلى المحتوى التعليمي المتاح عبر المنصة وفقاً لنوع الاشتراك. يمنع منعاً باتاً تحميل المحتوى أو إعادة توزيعه أو استخدامه لأغراض تجارية خارج إطار المنصة.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                3. حساب المستخدم
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يتحمل المستخدم المسؤولية الكاملة عن كافة الأنشطة التي تتم من خلال حسابه. يمنع مشاركة الحساب مع أشخاص آخرين.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                4. السلوك المحظور
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                يُحظر استخدام المنصة لأي غرض غير قانوني، أو محاولة تعطيل أمن المنصة، أو نشر محتوى مسيء، أو محاولة الوصول غير المصرح به إلى بيانات المستخدمين الآخرين.
              </p>
            </section>
            
            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                5. حقوق الملكية الفكرية
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                كافة المحتويات المتاحة على المنصة (بما في ذلك الفيديوهات، النصوص، التصاميم، والشعارات) هي ملكية فكرية محمية للمنصة أو لمقدمي المحتوى، ولا يجوز استخدامها دون إذن كتابي مسبق.
              </p>
            </section>

            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                6. إنهاء الخدمة
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                تحتفظ المنصة بالحق في تعليق أو إنهاء وصولك إلى الخدمات في أي وقت، دون إشعار مسبق، في حال مخالفة أي من شروط الاستخدام المذكورة.
              </p>
            </section>

            <section>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9]"></span>
                7. إخلاء المسؤولية
              </h4>
              <p className="leading-relaxed text-sm pr-4">
                تُقدم الخدمات "كما هي" دون أي ضمانات صريحة أو ضمنية. نحن لا نضمن أن تكون المنصة خالية من الأخطاء أو الانقطاعات الفنية، لكننا نعمل باستمرار على تحسين جودة الخدمة.
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
            أوافق على الشروط
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
