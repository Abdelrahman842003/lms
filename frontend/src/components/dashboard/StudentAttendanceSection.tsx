'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/StatCard';
import { LectureCard } from '@/components/dashboard/LectureCard';
import { Filter } from '@/components/Filter';
import { Lecture } from '@/services/lectureService';
import { AcademyLectureSessionsModal } from '@/components/dashboard/AcademyLectureSessionsModal';
import * as academyService from '@/services/academyService';
import { Group } from '@/services/groupService';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { Button, Icon } from '@/components/ui';

export default function StudentAttendanceSection() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedLectureForSessions, setSelectedLectureForSessions] = useState<Lecture | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeExpiresAt, setQrCodeExpiresAt] = useState<string | null>(null);
  const [selectedLectureForQR, setSelectedLectureForQR] = useState<Lecture | null>(null);

  // Activation and End States
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedLectureForActivation, setSelectedLectureForActivation] = useState<Lecture | null>(null);
  const [showEndLectureModal, setShowEndLectureModal] = useState(false);
  const [selectedLectureForEnd, setSelectedLectureForEnd] = useState<Lecture | null>(null);

  // Form Data
  const [formData, setFormData] = useState<academyService.CreateLectureData>({
    teacher_id: '',
    title: '',
    description: '',
    grade_id: '',
    group_id: '',
    date: '',
    is_recurring: false,
    recurrence_days: [],
    recurrence_time: '',
    duration_minutes: 120,
  });

  // Fetch teachers, grades, and groups for the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, gradesResponse, groupsResponse] = await Promise.all([
          academyService.getLectureTeachers(),
          academyService.getGrades(1, 1000),
          academyService.getGroups(1, 1000)
        ]);
        setTeachers(teachersResponse.data?.teachers || []);
        setGrades(gradesResponse.data?.data || []);
        setGroups(groupsResponse.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch lectures
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLectures(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedTeacherId]);

  const fetchLectures = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await academyService.getLectures(page, 12, {
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
        teacher_id: selectedTeacherId || undefined,
      });
      
      setLectures(response.data?.data || []);
      setTotalPages(response.data?.meta?.last_page || 1);
      setTotalItems(response.data?.meta?.total || 0);
      setCurrentPage(response.data?.meta?.current_page || 1);
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
      toast.error('فشل تحميل المحاضرات');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleAddClick = () => {
    router.push('/academy/lectures/create');
  };

  const handleEditClick = (lecture: Lecture) => {
    setIsEditing(true);
    setSelectedLecture(lecture);
    
    // Extract time from start_time if available
    let time = '';
    if (lecture.start_time) {
      const date = new Date(lecture.start_time);
      // Format to HH:mm
      time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Calculate duration if start and end time are available
    let duration = 120;
    if (lecture.start_time && lecture.end_time) {
      const start = new Date(lecture.start_time);
      const end = new Date(lecture.end_time);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    setFormData({
      teacher_id: lecture.teacher?.id || '',
      title: lecture.title,
      description: lecture.description || '',
      grade_id: lecture.grade?.id || '',
      group_id: lecture.group?.id || '',
      date: lecture.date || '',
      is_recurring: lecture.is_recurring || false,
      recurrence_days: lecture.recurrence_days || [],
      recurrence_time: time,
      duration_minutes: duration,
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

    // Prepare payload (convert empty strings to null for optional fields)
    const payload: any = {
      ...formData,
      group_id: formData.group_id || null, // data validation expects uuid or null
      description: formData.description || null,
    };

    // Remove date field if empty (for recurring lectures)
    if (!formData.date) {
      delete payload.date;
    }

    console.log('Payload being sent:', payload);

    try {
      if (isEditing && selectedLecture) {
        await academyService.updateLecture(selectedLecture.id, payload);
        toast.success('تم تحديث المحاضرة بنجاح');
      } else {
        await academyService.createLecture(payload);
        toast.success('تم إضافة المحاضرة بنجاح');
      }
      setShowModal(false);
      fetchLectures(currentPage);
    } catch (error: any) {
      console.error('Failed to save lecture:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'فشل حفظ المحاضرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedLecture) return;

    setIsSubmitting(true);
    try {
      await academyService.deleteLecture(selectedLecture.id);
      toast.success('تم حذف المحاضرة بنجاح');
      setShowDeleteModal(false);
      fetchLectures(currentPage);
    } catch (error) {
      console.error('Failed to delete lecture:', error);
      toast.error('فشل حذف المحاضرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateClick = (lecture: Lecture) => {
    setSelectedLectureForActivation(lecture);
    setShowActivationModal(true);
  };

  const confirmActivation = async () => {
    if (!selectedLectureForActivation) return;

    try {
      const response = await academyService.toggleLectureActive(selectedLectureForActivation.id);
      setLectures(prev => prev.map(l =>
        l.id === selectedLectureForActivation.id
          ? { ...l, is_active: response.data?.is_active }
          : l
      ));
      setShowActivationModal(false);
      toast.success(response.data?.message || 'تم تغيير حالة المحاضرة');
    } catch (error: any) {
      console.error('Failed to toggle activation:', error);
      toast.error(error.response?.data?.message || 'فشل تغيير حالة المحاضرة');
    }
  };

  const handleEndLectureClick = (lecture: Lecture) => {
    setSelectedLectureForEnd(lecture);
    setShowEndLectureModal(true);
  };

  const confirmEndLecture = async () => {
    if (!selectedLectureForEnd) return;

    try {
      await academyService.endLecture(selectedLectureForEnd.id);
      setLectures(prev => prev.map(l =>
        l.id === selectedLectureForEnd.id
          ? { ...l, is_active: false, status: 'منتهية' }
          : l
      ));
      setShowEndLectureModal(false);
      toast.success('تم إنهاء المحاضرة');
    } catch (error: any) {
      console.error('Failed to end lecture:', error);
      toast.error(error.response?.data?.message || 'فشل إنهاء المحاضرة');
    }
  };

  const confirmCancelSession = async () => {
    if (!selectedLecture) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await academyService.cancelLectureSession(selectedLecture.id, today);
      setShowCancelSessionModal(false);
      toast.success('تم إلغاء محاضرة اليوم');
      fetchLectures(currentPage);
    } catch (error: any) {
      console.error('Failed to cancel session:', error);
      toast.error(error.response?.data?.message || 'فشل إلغاء المحاضرة');
    }
  };

  const handleQRCodeClick = async (lecture: Lecture) => {
    try {
      setSelectedLectureForQR(lecture);
      const response = await academyService.generateLectureQrCode(lecture.id);
      setQrCodeUrl(response.data?.qr_code_url);
      setQrCodeExpiresAt(response.data?.expires_at);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('فشل إنشاء رمز QR');
    }
  };

  // Stats
  const totalLectures = totalItems;
  const upcomingLectures = lectures.filter(l => l.status === 'قادمة').length;
  const totalEnrolled = lectures.reduce((sum, l) => sum + (l.enrolled || 0), 0);

  return (
    <div>
      {/* Stats Grid */}
      <div className="ux-grid ux-grid-cols-repeat-auto-fit-minmax-260px-1fr ux-gap-6 ux-mb-8">
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
      <div className="ux-flex ux-justify-between ux-items-center ux-mb-6 ux-max-md-flex-col ux-max-md-items-stretch ux-max-md-gap-4">
        <div className="ux-flex ux-items-center ux-gap-3 ux-max-md-w-full ux-max-md-justify-center">
          <div className="ux-w-12 ux-h-12 ux-rounded-xl ux-bg-rgba-66-99-235-0dot1 ux-flex ux-items-center ux-justify-center ux-text-primary ux-text-2xl">
            <Icon name="video" />
          </div>
          <h2 className="ux-text-2xl ux-font-bold ux-text-white ux-m-0">إدارة المحاضرات</h2>
        </div>
        <div className="ux-max-md-w-full">
          <Button variant="primary" onClick={handleAddClick} className="btn btn-primary ux-max-md-w-full ux-max-md-justify-center">
            <Icon name="plus" />
            <span>محاضرة جديدة</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="ux-flex ux-gap-4 ux-mb-6 ux-max-md-flex-col">
        <div className="ux-flex-1">
          <input
            type="text"
            placeholder="بحث عن محاضرة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input ux-w-full ux-p-3 ux-bg-white-5 ux-border ux-border-white-10 ux-rounded-lg ux-text-white"
          />
        </div>
        <div className="ux-w-64 ux-max-md-w-full">
          <Filter
            options={[
              { value: '', label: 'كل المدرسين' },
              ...teachers.map(t => ({ value: t.id, label: t.name }))
            ]}
            value={selectedTeacherId}
            onChange={(value) => setSelectedTeacherId(value)}
            placeholder="كل المدرسين"
            className="ux-w-full"
          />
        </div>
        <div className="ux-w-48 ux-max-md-w-full">
          <Filter
            options={[
              { value: '', label: 'كل الحالات' },
              { value: 'today', label: 'اليوم' },
              { value: 'upcoming', label: 'قادمة' },
              { value: 'ongoing', label: 'جارية' },
              { value: 'finished', label: 'منتهية' },
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            placeholder="الحالة"
            className="ux-w-full"
          />
        </div>
      </div>

      {/* Lectures Grid */}
      {isLoading ? (
        <div className="ux-grid ux-grid-cols-1 ux-md-grid-cols-2 ux-lg-grid-cols-3 ux-xl-grid-cols-4 ux-gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ux-rounded-2xl ux-bg-101426-15 ux-border ux-border-white-10 ux-h-280px ux-flex ux-flex-col ux-gap-4 ux-p-6 ux-animate-pulse">
              <div className="ux-flex ux-justify-between ux-items-start">
                <div className="ux-bg-white-10 ux-w-60 ux-h-6 ux-rounded"></div>
                <div className="ux-bg-white-10 ux-w-20 ux-h-6 ux-rounded-xl"></div>
              </div>
              <div className="ux-bg-white-10 ux-w-full ux-h-10 ux-rounded"></div>
              <div className="ux-flex ux-flex-col ux-gap-3 ux-mt-auto">
                <div className="ux-bg-white-10 ux-w-40 ux-h-4 ux-rounded"></div>
                <div className="ux-bg-white-10 ux-w-50 ux-h-4 ux-rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lectures.length === 0 ? (
        <div className="ux-text-center ux-p-12 ux-bg-white-2 ux-rounded-2xl">
          <Icon name="video-slash" className="ux-text-5xl ux-text-gray-light ux-mb-4 ux-opacity-50" />
          <p className="ux-text-gray-light ux-text-lg">لا توجد محاضرات</p>
          <Button variant="primary" onClick={handleAddClick} className="btn btn-primary ux-mt-4">
            <Icon name="plus" />
            <span>إضافة محاضرة جديدة</span>
          </Button>
        </div>
      ) : (
        <div className="ux-grid ux-grid-cols-1 ux-md-grid-cols-2 ux-lg-grid-cols-3 ux-xl-grid-cols-4 ux-gap-6">
          {lectures.map((lecture) => {
            const isMenuOpen = openMenuId === lecture.id;
            return (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                isMenuOpen={isMenuOpen}
                onMenuToggle={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : lecture.id);
                }}
                onViewAttendees={() => {
                  router.push(`/academy/lectures/${lecture.id}/attendees`);
                  setOpenMenuId(null);
                }}
                onEdit={() => {
                  handleEditClick(lecture);
                  setOpenMenuId(null);
                }}
                onCopy={() => {
                  // Extract time from start_time if available
                  let time = '';
                  if (lecture.start_time) {
                    const date = new Date(lecture.start_time);
                    time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                  }

                  // Calculate duration
                  let duration = 120;
                  if (lecture.start_time && lecture.end_time) {
                    const start = new Date(lecture.start_time);
                    const end = new Date(lecture.end_time);
                    duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                  }

                  setFormData({
                    teacher_id: lecture.teacher?.id || '',
                    title: `${lecture.title} (نسخة)`,
                    description: lecture.description || '',
                    grade_id: lecture.grade?.id || '',
                    group_id: lecture.group?.id || '',
                    date: lecture.is_recurring ? '' : (lecture.date || ''),
                    is_recurring: lecture.is_recurring || false,
                    recurrence_days: lecture.recurrence_days || [],
                    recurrence_time: time,
                    duration_minutes: duration,
                  });
                  setIsEditing(false);
                  setShowModal(true);
                  setOpenMenuId(null);
                }}
                onDelete={() => {
                  handleDeleteClick(lecture);
                  setOpenMenuId(null);
                }}
                onActivate={() => handleActivateClick(lecture)}
                onScan={() => {/* Scanner handled by teacher */}}
                onQRCode={() => handleQRCodeClick(lecture)}
                onEnd={() => handleEndLectureClick(lecture)}
                onManualAttendance={() => {
                  router.push(`/academy/lectures/${lecture.id}/manual-attendance`);
                  setOpenMenuId(null);
                }}
                onCancelSession={() => {
                  setSelectedLecture(lecture);
                  setShowCancelSessionModal(true);
                  setOpenMenuId(null);
                }}
                onManageSessions={() => {
                  setSelectedLectureForSessions(lecture);
                  setShowSessionsModal(true);
                  setOpenMenuId(null);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ux-flex ux-justify-center ux-mt-6 ux-gap-2">
          <Button
            variant="outline"
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => fetchLectures(currentPage - 1)}
          >
            السابق
          </Button>
          <span className="ux-flex ux-items-center ux-text-gray-light">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => fetchLectures(currentPage + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Menu Backdrop */}
      {openMenuId && (
        <div
          className="ux-fixed ux-inset-0 ux-z-5"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'تعديل المحاضرة' : 'محاضرة جديدة'}</h3>
              <Button variant="ghost" className="modal-close" onClick={() => setShowModal(false)}>
                <Icon name="times" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="teacher">المدرس</label>
                  <Filter
                    options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                    value={formData.teacher_id}
                    onChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    placeholder="اختر المدرس"
                    className="ux-w-full"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">عنوان المحاضرة</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input w-full"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="مثال: مراجعة الفصل الأول"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="grade">الصف الدراسي</label>
                  <Filter
                    options={grades.map((grade) => ({ value: String(grade.id), label: grade.name }))}
                    value={String(formData.grade_id || '')}
                    onChange={(value) => setFormData({ ...formData, grade_id: value })}
                    placeholder="اختر الصف"
                    className="ux-w-full"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="group">المجموعة (اختياري)</label>
                  <Filter
                    options={[
                      { value: '', label: 'كل المجموعات' },
                      ...groups
                        .filter(g => !formData.grade_id || String(g.grade_id) === String(formData.grade_id))
                        .map((group) => ({ value: String(group.id), label: group.name }))
                    ]}
                    value={String(formData.group_id || '')}
                    onChange={(value) => setFormData({ ...formData, group_id: value })}
                    placeholder="كل المجموعات"
                    className="ux-w-full"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">الوصف (اختياري)</label>
                  <textarea
                    id="description"
                    className="form-input w-full"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للمحاضرة..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lecture_type">نوع المحاضرة</label>
                  <Filter
                    options={[
                      { value: 'extra', label: 'محاضرة إضافية' },
                      { value: 'basic', label: 'محاضرة أساسية' }
                    ]}
                    value={formData.is_recurring ? 'basic' : 'extra'}
                    onChange={(value) => {
                      const isBasic = value === 'basic';
                      setFormData({ 
                        ...formData, 
                        is_recurring: isBasic,
                        date: isBasic ? '' : formData.date,
                        recurrence_days: isBasic ? formData.recurrence_days : [],
                      });
                    }}
                    placeholder="اختر نوع المحاضرة"
                    className="ux-w-full"
                  />
                </div>

                {formData.is_recurring ? (
                  <>
                    <div className="form-group">
                      <label>أيام التكرار</label>
                      <div className="ux-flex ux-flex-wrap ux-gap-2">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                          const dayLabels: Record<string, string> = {
                            'Sunday': 'الأحد',
                            'Monday': 'الاثنين',
                            'Tuesday': 'الثلاثاء',
                            'Wednesday': 'الأربعاء',
                            'Thursday': 'الخميس',
                            'Friday': 'الجمعة',
                            'Saturday': 'السبت',
                          };
                          return (
                            <label key={day} className={`ux-px-3 ux-py-1 ux-rounded-lg ux-border ux-cursor-pointer ${
                              formData.recurrence_days?.includes(day) 
                                ? 'ux-bg-primary ux-text-white ux-border-primary'
                                : 'ux-bg-white-5 ux-border-white-10'
                            }`}>
                              <input
                                type="checkbox"
                                className="ux-hidden"
                                checked={formData.recurrence_days?.includes(day)}
                                onChange={(e) => {
                                  const newDays = e.target.checked
                                    ? [...(formData.recurrence_days || []), day]
                                    : (formData.recurrence_days || []).filter(d => d !== day);
                                  setFormData({ ...formData, recurrence_days: newDays });
                                }}
                              />
                              {dayLabels[day]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurrence_time">وقت المحاضرة</label>
                      <input
                        type="time"
                        id="recurrence_time"
                        className="form-input w-full"
                        value={formData.recurrence_time}
                        onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                        required={formData.is_recurring}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="duration_minutes">مدة المحاضرة (دقيقة)</label>
                      <input
                        type="number"
                        id="duration_minutes"
                        className="form-input w-full"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        min="1"
                        required={formData.is_recurring}
                      />
                    </div>
                  </>
                ) : (
                  <>

                    <div className="form-group">
                      <label htmlFor="date">تاريخ المحاضرة</label>
                      <input
                        type="date"
                        id="date"
                        className="form-input w-full"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required={!formData.is_recurring}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurrence_time">وقت المحاضرة</label>
                      <input
                        type="time"
                        id="recurrence_time"
                        className="form-input w-full"
                        value={formData.recurrence_time}
                        onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                        required={!formData.is_recurring}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="duration_minutes">مدة المحاضرة (دقيقة)</label>
                      <input
                        type="number"
                        id="duration_minutes"
                        className="form-input w-full"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        min="1"
                        required={!formData.is_recurring}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>حذف المحاضرة</h3>
            </div>
            <div className="modal-body">
              <p className="ux-text-gray-300">هل أنت متأكد من حذف المحاضرة "{selectedLecture?.title}"؟</p>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" className="btn btn-danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحذف...' : 'حذف'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="modal-overlay" onClick={() => setShowActivationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedLectureForActivation?.is_active ? 'إيقاف المحاضرة' : 'تفعيل المحاضرة'}</h3>
            </div>
            <div className="modal-body">
              <p className="ux-text-gray-300">
                هل تريد {selectedLectureForActivation?.is_active ? 'إيقاف' : 'تفعيل'} المحاضرة "{selectedLectureForActivation?.title}"؟
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" className="btn btn-ghost" onClick={() => setShowActivationModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" className="btn btn-primary" onClick={confirmActivation}>
                تأكيد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End Lecture Modal */}
      {showEndLectureModal && (
        <div className="modal-overlay" onClick={() => setShowEndLectureModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إنهاء المحاضرة</h3>
            </div>
            <div className="modal-body">
              <p className="ux-text-gray-300">
                هل تريد إنهاء المحاضرة "{selectedLectureForEnd?.title}"؟ سيتم تسجيل الغياب للطلاب المتغيبين.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" className="btn btn-ghost" onClick={() => setShowEndLectureModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" className="btn btn-danger" onClick={confirmEndLecture}>
                إنهاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedLectureForQR && (
        <div className="ux-fixed ux-inset-0 ux-z-50 ux-flex ux-items-center ux-justify-center ux-bg-black-50 ux-backdrop-blur-sm">
          <div className="ux-w-full ux-max-w-md ux-bg-gray-900 ux-border ux-border-gray-800 ux-rounded-xl ux-shadow-2xl ux-overflow-hidden">
            <div className="ux-p-6 ux-text-center">
              <h3 className="ux-text-xl ux-font-bold ux-text-white ux-mb-2">{selectedLectureForQR.title}</h3>
              <p className="ux-text-gray-400 ux-mb-6">امسح الرمز لتسجيل الحضور</p>

              <div className="ux-bg-white ux-p-4 ux-rounded-xl ux-inline-block ux-mb-6">
                <QRCode value={qrCodeUrl} size={256} />
              </div>

              {qrCodeExpiresAt && (
                <div className={`ux-mb-6 ux-text-sm ${new Date(qrCodeExpiresAt) < new Date() ? 'ux-text-red-400' : 'ux-text-emerald-400'}`}>
                  {new Date(qrCodeExpiresAt) < new Date() 
                    ? 'انتهت صلاحية الرمز' 
                    : `ينتهي في: ${new Date(qrCodeExpiresAt).toLocaleTimeString('ar-EG')}`}
                </div>
              )}

              <Button
                variant="primary"
                onClick={() => setShowQRModal(false)}
                className="ux-w-full ux-py-3 ux-px-4 ux-bg-gray-800 ux-hover-bg-gray-700 ux-text-white ux-rounded-lg ux-transition-colors ux-font-medium"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {showCancelSessionModal && selectedLecture && (
        <div className="modal-overlay" onClick={() => setShowCancelSessionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إلغاء محاضرة اليوم</h3>
            </div>
            <div className="modal-body">
              <p className="ux-text-gray-300">
                هل تريد إلغاء محاضرة اليوم من "{selectedLecture.title}"؟
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" className="btn btn-ghost" onClick={() => setShowCancelSessionModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" className="btn btn-danger" onClick={confirmCancelSession}>
                تأكيد الإلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && selectedLectureForSessions && (
        <AcademyLectureSessionsModal
          lecture={selectedLectureForSessions}
          onClose={() => setShowSessionsModal(false)}
        />
      )}
    </div>
  );
}
