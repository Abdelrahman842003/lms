'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getLectures, 
  createLecture, 
  updateLecture, 
  deleteLecture, 
  Lecture, 
  CreateLectureData,
  generateQrCode,
  recordAttendance,
  toggleLectureActive,
  endLecture
} from '@/services/lectureService';
import { getGrades } from '@/services/gradeService';
import QRCodeModal from '@/components/dashboard/QRCodeModal';
import QRScannerModal from '@/components/dashboard/QRScannerModal';
import toast from 'react-hot-toast';

export default function TeacherLecturesPage() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateLectureData & { date: string }>({
    title: '',
    description: '',
    grade_id: '',
    date: '',
  });
  const [grades, setGrades] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await getGrades(1, 100); // Fetch all grades
        setGrades(response.data);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      }
    };
    fetchGrades();
  }, []);
  
  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeExpiresAt, setQrCodeExpiresAt] = useState<string | null>(null);
  const [selectedLectureForQR, setSelectedLectureForQR] = useState<Lecture | null>(null);

  // Scanner State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedLectureForScan, setSelectedLectureForScan] = useState<Lecture | null>(null);

  // Activation State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedLectureForActivation, setSelectedLectureForActivation] = useState<Lecture | null>(null);

  // End Lecture State
  const [showEndLectureModal, setShowEndLectureModal] = useState(false);
  const [selectedLectureForEnd, setSelectedLectureForEnd] = useState<Lecture | null>(null);

  // Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLectures(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLectures = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getLectures(page, itemsPerPage, { search: searchQuery });
      setLectures(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      grade_id: '',
      date: '',
    });
    setShowModal(true);
  };

  const handleEditClick = (lecture: Lecture) => {
    setIsEditing(true);
    setSelectedLecture(lecture);
    // Convert API date format to datetime-local input format (YYYY-MM-DDTHH:mm)


    setFormData({
      title: lecture.title,
      description: lecture.description || '',
      grade_id: lecture.grade_id || '',
      date: lecture.start_time.split(' ')[0], // Extract YYYY-MM-DD
    });
    setShowModal(true);
  };

  const handleDeleteClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && selectedLecture) {
        await updateLecture(selectedLecture.id, formData);
      } else {
        await createLecture(formData);
      }
      setShowModal(false);
      fetchLectures(currentPage);
    } catch (error) {
      console.error('Failed to save lecture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedLecture) return;

    setIsSubmitting(true);
    try {
      await deleteLecture(selectedLecture.id);
      setShowDeleteModal(false);
      fetchLectures(currentPage);
    } catch (error) {
      console.error('Failed to delete lecture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRCodeClick = async (lecture: Lecture) => {
    try {
      setSelectedLectureForQR(lecture);
      // If lecture already has a valid QR code, use it (optimization)
      // But for now, let's always generate a new one or fetch the existing one to ensure validity
      const response = await generateQrCode(lecture.id);
      setQrCodeUrl(response.qr_code_url);
      setQrCodeExpiresAt(response.expires_at);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  const handleScanClick = (lecture: Lecture) => {
    setSelectedLectureForScan(lecture);
    setShowScannerModal(true);
  };

  const [isScanningProcessing, setIsScanningProcessing] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedLectureForScan || isScanningProcessing) return;

    setIsScanningProcessing(true);
    try {
      // Parse student ID from QR code (format: "student:UUID")
      let studentId = decodedText;
      if (decodedText.startsWith('student:')) {
        studentId = decodedText.replace('student:', '');
      }

      await recordAttendance(selectedLectureForScan.id, studentId);
      toast.success('تم تسجيل الحضور بنجاح');
      setShowScannerModal(false); 
    } catch (error: any) {
      console.error('Failed to record attendance:', error);
      // Don't close modal on error, just show toast
      toast.error(error.message || 'فشل تسجيل الحضور');
      
      // Add a small delay before allowing next scan to prevent spamming
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsScanningProcessing(false);
    }
  };



  const handleActivateClick = (lecture: Lecture) => {
    setSelectedLectureForActivation(lecture);
    setShowActivationModal(true);
  };

  const confirmActivation = async () => {
    if (!selectedLectureForActivation) return;

    try {
      const response = await toggleLectureActive(selectedLectureForActivation.id);
      
      // Update local state to reflect change
      setLectures(prev => prev.map(l => 
        l.id === selectedLectureForActivation.id 
          ? { ...l, is_active: response.is_active } 
          : l
      ));

      setShowActivationModal(false);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Failed to toggle activation:', error);
      toast.error(error.message || 'فشل تغيير حالة المحاضرة');
    }
  };

  const handleEndLectureClick = (lecture: Lecture) => {
    setSelectedLectureForEnd(lecture);
    setShowEndLectureModal(true);
  };

  const confirmEndLecture = async () => {
    if (!selectedLectureForEnd) return;

    try {
      const response = await endLecture(selectedLectureForEnd.id);
      
      // Update local state
      setLectures(prev => prev.map(l => 
        l.id === selectedLectureForEnd.id 
          ? { ...l, is_active: false, status: 'منتهية' } 
          : l
      ));

      setShowEndLectureModal(false);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Failed to end lecture:', error);
      toast.error(error.message || 'فشل إنهاء المحاضرة');
    }
  };

  // Stats
  const totalLectures = totalItems;
  const upcomingLectures = lectures.filter(l => l.status === 'قادمة').length;
  const totalEnrolled = lectures.reduce((sum, l) => sum + l.enrolled, 0);

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي المحاضرات"
          value={totalLectures}
          icon="fas fa-book-open"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="محاضرات قادمة"
          value={upcomingLectures}
          icon="fas fa-calendar-check"
          color="success"
          variant="centered"
        />
        <StatCard
          title="إجمالي المسجلين"
          value={totalEnrolled}
          icon="fas fa-users"
          color="warning"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      <div className="header-section flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
        <div className="header-title flex items-center gap-3 max-md:w-full max-md:justify-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(66,99,235,0.1)] flex items-center justify-center text-primary text-2xl">
            <i className="fas fa-video"></i>
          </div>
          <h2 className="text-2xl font-bold text-white m-0">إدارة المحاضرات</h2>
        </div>
        <div className="header-actions max-md:w-full">
          <button onClick={handleAddClick} className="btn btn-primary max-md:w-full max-md:justify-center">
            <i className="fas fa-plus"></i>
            <span>محاضرة جديدة</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="بحث عن محاضرة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
        />
      </div>

      {/* Lectures Grid */}
      {isLoading ? (
        <div className="lectures-grid grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 max-md:grid-cols-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl shadow-lg border border-white/5 h-[280px] flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="skeleton-item w-[60%] h-6"></div>
                <div className="skeleton-item w-[20%] h-6 rounded-xl"></div>
              </div>
              <div className="skeleton-item w-full h-10"></div>
              <div className="flex flex-col gap-3 mt-auto">
                <div className="skeleton-item w-[40%] h-4"></div>
                <div className="skeleton-item w-[50%] h-4"></div>
                <div className="skeleton-item w-[30%] h-4"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lectures.length === 0 ? (
        <div className="text-center p-12 bg-white/2 rounded-2xl">
          <i className="fas fa-video-slash text-5xl text-gray-light mb-4 opacity-50"></i>
          <p className="text-gray-light text-lg">لا توجد محاضرات</p>
          <button onClick={handleAddClick} className="btn btn-primary mt-4">
            <i className="fas fa-plus"></i>
            <span>إضافة محاضرة جديدة</span>
          </button>
        </div>
      ) : (
        <div className="lectures-grid grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 max-md:grid-cols-1">
          {lectures.map((lecture) => {
            const isActive = lecture.is_active;
            return (
            <div 
              key={lecture.id} 
              className={`dashboard-card transition-all duration-300 ease-in-out ${isActive ? 'lecture-card-active col-span-2 border-2 border-success bg-[rgba(46,204,113,0.05)] max-md:col-auto' : 'border border-white/10'}`}
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white flex-1">
                    {lecture.title}
                  </h3>
                  <span className={lecture.status === 'اليوم' ? 'badge badge-warning' : lecture.status === 'جاري الآن' ? 'badge badge-success' : lecture.status === 'منتهية' ? 'badge badge-secondary' : 'badge badge-primary'}>
                    {lecture.status}
                  </span>
                  <button 
                    className="btn-icon-danger mr-2 px-2 py-1 rounded-md bg-[rgba(231,76,60,0.1)] text-danger border-none cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(lecture);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <p className="text-sm text-gray-light mb-4">
                  {lecture.description}
                </p>
              </div>

              <div className="grid gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-light">
                  <i className="fas fa-calendar w-5 text-primary"></i>
                  <span>{lecture.date}</span>
                </div>
                {lecture.grade && (
                  <div className="flex items-center gap-2 text-sm text-light">
                    <i className="fas fa-graduation-cap w-5 text-primary"></i>
                    <span>{lecture.grade.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-light">
                  <i className="fas fa-clock w-5 text-primary"></i>
                  <span>{lecture.time} ({lecture.duration})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-light">
                  <i className="fas fa-users w-5 text-primary"></i>
                  <span>{lecture.enrolled} طالب مسجل</span>
                </div>
              </div>

              {lecture.status !== 'منتهية' && (
                <div className="lecture-actions flex gap-2 max-md:flex-wrap">
                  <button 
                    className="btn btn-primary btn-sm flex-1" 
                    onClick={() => handleEditClick(lecture)}
                  >
                    <i className="fas fa-edit"></i>
                    <span>تعديل</span>
                  </button>

                  {!isActive ? (
                    <button 
                      className="btn btn-success btn-sm flex-[2]" 
                      onClick={() => handleActivateClick(lecture)}
                    >
                      <i className="fas fa-power-off"></i>
                      <span>تفعيل المحاضرة</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        className="btn btn-outline btn-sm flex-1" 
                        onClick={() => handleQRCodeClick(lecture)}
                      >
                        <i className="fas fa-qrcode"></i>
                        <span>QR Code</span>
                      </button>

                      <button 
                        className="btn btn-outline btn-sm flex-1" 
                        onClick={() => handleScanClick(lecture)}
                      >
                        <i className="fas fa-camera"></i>
                        <span>Scan</span>
                      </button>

                      <button 
                        className="btn btn-danger btn-sm flex-1" 
                        onClick={() => handleEndLectureClick(lecture)}
                      >
                        <i className="fas fa-stop-circle"></i>
                        <span>إنهاء</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button 
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => fetchLectures(currentPage - 1)}
          >
            السابق
          </button>
          <span className="flex items-center text-gray-light">
            صفحة {currentPage} من {totalPages}
          </span>
          <button 
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => fetchLectures(currentPage + 1)}
          >
            التالي
          </button>
        </div>
      )}

      {/* Menu Backdrop */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'تعديل المحاضرة' : 'محاضرة جديدة'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">عنوان المحاضرة</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="مثال: مراجعة الفصل الأول"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="grade">الصف الدراسي</label>
                  <select
                    id="grade"
                    className="form-input"
                    value={formData.grade_id || ''}
                    onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                    required
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="description">الوصف (اختياري)</label>
                  <textarea
                    id="description"
                    className="form-input"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للمحاضرة..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">تاريخ المحاضرة</label>
                  <input
                    type="date"
                    id="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-light mt-1">
                    ستبدأ المحاضرة في بداية هذا اليوم وتستمر لمدة 24 ساعة.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLecture && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تأكيد الحذف</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من حذف المحاضرة "{selectedLecture.title}"؟</p>
              <p className="text-danger mt-2">
                سيتم حذف جميع بيانات الحضور المرتبطة بهذه المحاضرة.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={qrCodeUrl}
        expiresAt={qrCodeExpiresAt}
        lectureTitle={selectedLectureForQR?.title || ''}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleScanSuccess}
        lectureTitle={selectedLectureForScan?.title || ''}
      />

      {/* Activation Confirmation Modal */}
      {showActivationModal && selectedLectureForActivation && (
        <div className="modal-overlay" onClick={() => setShowActivationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفعيل المحاضرة</h3>
              <button className="modal-close" onClick={() => setShowActivationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من {selectedLectureForActivation.is_active ? 'إلغاء تفعيل' : 'تفعيل'} المحاضرة "{selectedLectureForActivation.title}"؟</p>
              <p className={`mt-2 ${selectedLectureForActivation.is_active ? 'text-warning' : 'text-success'}`}>
                {selectedLectureForActivation.is_active 
                  ? 'سيتم إخفاء خيارات QR Code والمسح الضوئي.' 
                  : 'سيتم إظهار خيارات QR Code والمسح الضوئي.'}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowActivationModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className={`btn ${selectedLectureForActivation.is_active ? 'btn-warning' : 'btn-success'}`}
                onClick={confirmActivation}
              >
                {selectedLectureForActivation.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End Lecture Confirmation Modal */}
      {showEndLectureModal && selectedLectureForEnd && (
        <div className="modal-overlay" onClick={() => setShowEndLectureModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إنهاء المحاضرة</h3>
              <button className="modal-close" onClick={() => setShowEndLectureModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من إنهاء المحاضرة "{selectedLectureForEnd.title}"؟</p>
              <div className="alert alert-warning mt-4">
                <i className="fas fa-exclamation-triangle"></i>
                <span>تنبيه: سيتم تسجيل جميع الطلاب الذين لم يحضروا كـ "غائب" وإرسال إشعارات لهم فوراً.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEndLectureModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmEndLecture}
              >
                تأكيد الإنهاء
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
