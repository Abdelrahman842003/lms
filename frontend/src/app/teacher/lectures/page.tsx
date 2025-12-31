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
  endLecture,
  getAttendees,
  Attendee,
  exportAttendeesPDF
} from '@/services/lectureService';
import { getGrades } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
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
    group_id: '',
    date: '',
  });
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesResponse, groupsResponse] = await Promise.all([
          getGrades(1, 100),
          getGroups(1, 100)
        ]);
        setGrades(gradesResponse.data);
        setGroups(groupsResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
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
  // Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Attendees Modal State
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [selectedLectureForAttendees, setSelectedLectureForAttendees] = useState<string | null>(null);
  const [attendeesData, setAttendeesData] = useState<{ attendees: Attendee[], total_present: number, total_absent: number } | null>(null);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const handleViewAttendees = async (lectureId: string) => {
    setSelectedLectureForAttendees(lectureId);
    setIsLoadingAttendees(true);
    setShowAttendeesModal(true);
    try {
      const data = await getAttendees(lectureId);
      setAttendeesData({
        attendees: data.attendees,
        total_present: data.total_present,
        total_absent: data.total_absent
      });
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
      toast.error('فشل جلب بيانات الحضور');
      setShowAttendeesModal(false);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLectures(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGroupId]);

  const fetchLectures = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getLectures(page, itemsPerPage, { 
        search: searchQuery,
        group_id: selectedGroupId || undefined
      });
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
      group_id: lecture.group_id || '',
      date: lecture.start_time.split(' ')[0], // Extract YYYY-MM-DD
    });
    setShowModal(true);
  };

  const handleCopyClick = (lecture: Lecture) => {
    setIsEditing(false); // This will be a new lecture, so not editing
    setSelectedLecture(null); // No selected lecture for a new copy
    setFormData({
      title: `${lecture.title} (نسخة)`,
      description: lecture.description || '',
      grade_id: lecture.grade_id || '', // Ensure it's a string
      group_id: lecture.group_id || '', // Ensure it's a string
      date: '', // Reset date for a new lecture
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
      toast.error('Failed to generate QR code');
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

      {/* Filters */}
      <div className="flex gap-4 mb-6 max-md:flex-col">
        <div className="flex-1">
          <input
            type="text"
            placeholder="بحث عن محاضرة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
          />
        </div>
        <div className="w-64 max-md:w-full">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="form-select w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="" className="bg-[#1a1f37]">كل المجموعات</option>
            {groups.map(group => (
              <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lectures Grid */}
      {isLoading ? (
        <div className="lectures-grid grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 max-md:grid-cols-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl shadow-lg border border-white/5 h-[280px] flex flex-col gap-4 p-4">
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
<div className="lectures-grid grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6 max-md:grid-cols-1">
          {lectures.map((lecture) => {
            const isActive = lecture.is_active;
            const isMenuOpen = openMenuId === lecture.id;
            return (
            <div 
              key={lecture.id} 
              className={`relative rounded-2xl p-6 transition-all duration-300 ease-in-out flex flex-col ${
                isActive 
                  ? 'bg-gradient-to-br from-[rgba(46,204,113,0.15)] to-[rgba(46,204,113,0.05)] border-2 border-[#2ecc71] shadow-[0_0_30px_rgba(46,204,113,0.3)]' 
                  : 'bg-[rgba(16,20,38,0.6)] border border-white/10 hover:border-white/20 hover:shadow-xl'
              }`}
            >
              {/* Top Section: Menu and Delete buttons */}
              <div className="flex justify-between items-start mb-6">
                {/* Three-dot Menu */}
                <div className="relative">
                  <button 
                    className="w-10 h-10 rounded-xl bg-[rgba(16,20,38,0.8)] hover:bg-[rgba(66,99,235,0.2)] border border-white/10 hover:border-primary/50 flex items-center justify-center transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : lecture.id);
                    }}
                  >
                    <i className="fas fa-ellipsis-v text-white"></i>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1f35] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden backdrop-blur-xl">
                      <button
                        className="w-full px-4 py-3 text-right text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                        onClick={() => {
                          handleViewAttendees(lecture.id);
                          setOpenMenuId(null);
                        }}
                      >
                        <i className="fas fa-eye w-5 text-primary"></i>
                        <span>عرض التفاصيل</span>
                      </button>
                      <button
                        className="w-full px-4 py-3 text-right text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                        onClick={() => {
                          handleEditClick(lecture);
                          setOpenMenuId(null);
                        }}
                      >
                        <i className="fas fa-edit w-5 text-primary"></i>
                        <span>تعديل</span>
                      </button>
                      <button
                        className="w-full px-4 py-3 text-right text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                        onClick={() => {
                          handleCopyClick(lecture);
                          setOpenMenuId(null);
                        }}
                      >
                        <i className="fas fa-copy w-5 text-primary"></i>
                        <span>نسخ المحاضرة</span>
                      </button>
                      <button
                        className="w-full px-4 py-3 text-right text-danger hover:bg-danger/10 transition-colors flex items-center gap-3 border-t border-white/10"
                        onClick={() => {
                          handleDeleteClick(lecture);
                          setOpenMenuId(null);
                        }}
                      >
                        <i className="fas fa-trash w-5"></i>
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badge and Delete Button */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    lecture.status === 'جاري الآن' ? 'bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30' : 
                    lecture.status === 'اليوم' ? 'bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30' : 
                    lecture.status === 'منتهية' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 
                    'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {lecture.status}
                  </span>
                  <button 
                    className="w-10 h-10 rounded-xl bg-[rgba(231,76,60,0.15)] hover:bg-[rgba(231,76,60,0.25)] text-danger border border-danger/20 hover:border-danger/40 flex items-center justify-center transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(lecture);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                {lecture.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-light/80 mb-6 line-clamp-2 min-h-[40px]">
                {lecture.description || 'New topic'}
              </p>

              {/* Lecture Info */}
              <div className="grid gap-3.5 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-light">
                  <i className="fas fa-calendar w-5 text-primary text-base"></i>
                  <span>{lecture.date}</span>
                </div>
                {lecture.grade && (
                  <div className="flex items-center gap-3 text-sm text-gray-light">
                    <i className="fas fa-graduation-cap w-5 text-primary text-base"></i>
                    <span>{lecture.grade.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-light">
                  <i className="fas fa-clock w-5 text-primary text-base"></i>
                  <span>{lecture.time} ({lecture.duration})</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-light">
                  <i className="fas fa-users w-5 text-primary text-base"></i>
                  <span>{lecture.enrolled} طالب مسجل</span>
                </div>
              </div>

              {/* Action Buttons */}
              {lecture.status !== 'منتهية' && (
                <div className="mt-auto grid gap-3">
                  {!isActive ? (
                    <button 
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ee5a6f] hover:from-[#ff5252] hover:to-[#e94560] text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]" 
                      onClick={() => handleActivateClick(lecture)}
                    >
                      <i className="fas fa-play-circle text-lg"></i>
                      <span>إنعاش</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        className="py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-sm flex flex-col items-center justify-center gap-1.5 transition-all" 
                        onClick={() => handleScanClick(lecture)}
                      >
                        <i className="fas fa-qrcode text-base"></i>
                        <span className="text-xs">مسح<br/>QR طالب</span>
                      </button>
                      <button 
                        className="py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-sm flex flex-col items-center justify-center gap-1.5 transition-all" 
                        onClick={() => handleQRCodeClick(lecture)}
                      >
                        <i className="fas fa-qrcode text-base"></i>
                        <span className="text-xs">QR Code</span>
                      </button>
                      <button 
                        className="py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-sm flex flex-col items-center justify-center gap-1.5 transition-all" 
                        onClick={() => handleEndLectureClick(lecture)}
                      >
                        <i className="fas fa-check-circle text-base"></i>
                        <span className="text-xs">تعديل</span>
                      </button>
                    </div>
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
                    className="form-select w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.grade_id || ''}
                    onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                  >
                    <option value="" className="bg-[#1a1f37]">اختر الصف</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="group">المجموعة (اختياري)</label>
                  <select
                    id="group"
                    className="form-select w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.group_id || ''}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  >
                    <option value="" className="bg-[#1a1f37]">كل المجموعات</option>
                    {groups
                      .filter(g => !formData.grade_id || g.grade_id?.toString() === formData.grade_id.toString())
                      .map((group) => (
                        <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                          {group.name}
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
      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="modal-overlay" onClick={() => setShowAttendeesModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>سجل الحضور</h3>
              <div className="flex gap-2">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    if (!selectedLectureForAttendees) return;
                    try {
                      await exportAttendeesPDF(selectedLectureForAttendees);
                      toast.success('تم تحميل التقرير بنجاح');
                    } catch (error) {
                      console.error('Failed to export PDF:', error);
                      toast.error('فشل تحميل التقرير');
                    }
                  }}
                >
                  <i className="fas fa-file-pdf ml-2"></i>
                  تصدير PDF
                </button>
                <button className="modal-close" onClick={() => setShowAttendeesModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="modal-body">
              {isLoadingAttendees ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : attendeesData ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{attendeesData.total_present}</div>
                      <div className="text-sm text-gray-600">حاضر</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{attendeesData.total_absent}</div>
                      <div className="text-sm text-gray-600">غائب</div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-2 text-right">الطالب</th>
                          <th className="px-4 py-2 text-right">رقم الهاتف</th>
                          <th className="px-4 py-2 text-center">الحالة</th>
                          <th className="px-4 py-2 text-right">وقت الحضور</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendeesData.attendees.map((attendee) => (
                          <tr key={attendee.id} className="border-b">
                            <td className="px-4 py-2">{attendee.student_name}</td>
                            <td className="px-4 py-2">{attendee.student_phone}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                attendee.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attendee.status === 'present' ? 'حاضر' : 'غائب'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {attendee.attended_at || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
