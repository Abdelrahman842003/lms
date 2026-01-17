import React, { useState, useEffect } from 'react';
import FormModal from '@/components/ui/FormModal';
import { getAcademies, addToAcademy, removeFromAcademy, enableIndependent, disableIndependent } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface AffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSuccess: () => void;
}

export default function AffiliationModal({ isOpen, onClose, teacher, onSuccess }: AffiliationModalProps) {
  const [academies, setAcademies] = useState<any[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAcademies();
    }
  }, [isOpen]);

  const fetchAcademies = async () => {
    setLoading(true);
    try {
      const response = await getAcademies(1, 100, { status: 'active' });
      console.log('Fetched Academies Response:', response);
      // Handle different response structures
      const data = response.data || response;
      console.log('Processed Academies Data:', data);
      
      let academiesList = [];
      if (Array.isArray(data)) {
        academiesList = data;
      } else if (Array.isArray(data.data)) {
        academiesList = data.data;
      } else if (data.academies && Array.isArray(data.academies.data)) {
        // Handle paginated response inside 'academies' key
        academiesList = data.academies.data;
      } else if (Array.isArray(data.academies)) {
        academiesList = data.academies;
      }
      
      setAcademies(academiesList);
    } catch (error) {
      console.error('Failed to fetch academies', error);
      toast.error('فشل جلب قائمة الأكاديميات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAcademy = async () => {
    if (!selectedAcademyId) return;
    
    setProcessing(true);
    try {
      await addToAcademy(teacher.id, selectedAcademyId);
      toast.success('تم إضافة المدرس للأكاديمية بنجاح');
      setSelectedAcademyId('');
      onSuccess(); // Refresh parent
    } catch (error) {
      console.error('Failed to add academy', error);
      toast.error('فشل إضافة المدرس للأكاديمية');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveAcademy = async (academyId: string) => {
    if (!confirm('هل أنت متأكد من إزالة المدرس من هذه الأكاديمية؟')) return;

    setProcessing(true);
    try {
      await removeFromAcademy(teacher.id, academyId);
      toast.success('تم إزالة المدرس من الأكاديمية بنجاح');
      onSuccess(); // Refresh parent
    } catch (error) {
      console.error('Failed to remove academy', error);
      toast.error('فشل إزالة المدرس من الأكاديمية');
    } finally {
      setProcessing(false);
    }
  };

  const toggleIndependent = async () => {
    setProcessing(true);
    try {
      const isIndependent = teacher.affiliation === 'independent' || teacher.affiliation === 'both';
      if (isIndependent) {
        await disableIndependent(teacher.id);
        toast.success('تم إلغاء حالة المستقل');
      } else {
        await enableIndependent(teacher.id);
        toast.success('تم تفعيل حالة المستقل');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to toggle independent status', error);
      toast.error('فشل تغيير حالة المستقل');
    } finally {
      setProcessing(false);
    }
  };

  const isIndependent = teacher?.affiliation === 'independent' || teacher?.affiliation === 'both';
  const teacherAcademies = teacher?.academies || [];
  
  console.log('All Academies:', academies);
  console.log('Teacher Academies:', teacherAcademies);

  // Filter out academies the teacher is already in
  const availableAcademies = academies.filter(
    a => !teacherAcademies.some((ta: any) => String(ta.id) === String(a.id))
  );
  
  console.log('Available Academies:', availableAcademies);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title="إدارة التبعيات"
      submitText="إغلاق"
      maxWidth="600px"
    >
      <div className="space-y-6">
        {/* Independent Status Section */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium mb-1">حالة المستقل</h4>
            <p className="text-gray-400 text-sm">
              {isIndependent 
                ? 'المدرس يعمل كمستقل حالياً' 
                : 'المدرس لا يعمل كمستقل'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleIndependent}
            disabled={processing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isIndependent
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
            }`}
          >
            {isIndependent ? 'إلغاء المستقل' : 'تفعيل كمستقل'}
          </button>
        </div>

        {/* Current Academies Section */}
        <div>
          <h4 className="text-white font-medium mb-3">الأكاديميات الحالية</h4>
          {teacherAcademies.length > 0 ? (
            <div className="space-y-2">
              {teacherAcademies.map((academy: any) => (
                <div key={academy.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-gray-200">{academy.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAcademy(academy.id)}
                    disabled={processing}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                    title="إزالة من الأكاديمية"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-2">لا يوجد أكاديميات مرتبطة</p>
          )}
        </div>

        {/* Add Academy Section */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-white font-medium mb-3">إضافة لأكاديمية</h4>
          <div className="flex gap-2">
            <select
              value={selectedAcademyId}
              onChange={(e) => setSelectedAcademyId(e.target.value)}
              className="flex-1 bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
              disabled={loading || processing}
            >
              <option value="">اختر أكاديمية...</option>
              {availableAcademies.map((academy) => (
                <option key={academy.id} value={academy.id}>
                  {academy.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddAcademy}
              disabled={!selectedAcademyId || processing}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-plus ml-2"></i>
              إضافة
            </button>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
