/**
 * Modal Component Stories
 * Example stories for modal components
 */

import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

export default {
  title: 'UI/ConfirmationModal',
  component: ConfirmationModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'مكون نافذة التأكيد للإجراءات المهمة مثل الحذف والتعديل.',
      },
    },
  },
};

// Basic confirmation modal
export const Default = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
      >
        حذف العنصر
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          alert('تم الحذف!');
          setIsOpen(false);
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
};

// Success confirmation
export const Success = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        حفظ البيانات
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          alert('تم الحفظ!');
          setIsOpen(false);
        }}
        title="حفظ البيانات"
        message="هل تريد حفظ التغييرات التي أجريتها؟"
        confirmText="حفظ"
        cancelText="إلغاء"
        variant="success"
      />
    </div>
  );
};

// Warning confirmation
export const Warning = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
      >
        تعديل الإعدادات
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          alert('تم التعديل!');
          setIsOpen(false);
        }}
        title="تعديل الإعدادات"
        message="تعديل هذه الإعدادات قد يؤثر على عمل النظام. هل تريد المتابعة؟"
        confirmText="متابعة"
        cancelText="إلغاء"
        variant="warning"
      />
    </div>
  );
};

// Multiple modals example
export const MultipleModals = () => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="p-8 space-y-4" dir="rtl">
      <h3 className="text-lg font-semibold mb-4">أمثلة متعددة</h3>
      
      <div className="flex gap-4">
        <button
          onClick={() => setDeleteOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          حذف
        </button>

        <button
          onClick={() => setSaveOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          حفظ
        </button>

        <button
          onClick={() => setEditOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          تعديل
        </button>
      </div>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          alert('تم الحذف!');
          setDeleteOpen(false);
        }}
        title="حذف الطالب"
        message="هل أنت متأكد من حذف بيانات هذا الطالب؟ سيتم حذف جميع الدرجات والحضور المرتبط به."
        confirmText="حذف نهائياً"
        cancelText="إلغاء"
        variant="danger"
      />

      {/* Save Modal */}
      <ConfirmationModal
        isOpen={saveOpen}
        onCancel={() => setSaveOpen(false)}
        onConfirm={() => {
          alert('تم الحفظ!');
          setSaveOpen(false);
        }}
        title="حفظ الدرجات"
        message="هل تريد حفظ درجات جميع الطلاب؟ لن تتمكن من تعديلها بعد الحفظ."
        confirmText="حفظ"
        cancelText="مراجعة"
        variant="success"
      />

      {/* Edit Modal */}
      <ConfirmationModal
        isOpen={editOpen}
        onCancel={() => setEditOpen(false)}
        onConfirm={() => {
          alert('تم التعديل!');
          setEditOpen(false);
        }}
        title="تعديل جدول الحصص"
        message="تعديل الجدول سيؤثر على مواعيد جميع الطلاب المسجلين. هل تريد المتابعة؟"
        confirmText="تعديل الجدول"
        cancelText="إلغاء"
        variant="warning"
      />
    </div>
  );
};