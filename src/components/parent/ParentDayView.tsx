import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  AlertTriangle,
  Award,
  ChevronDown,
  User,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame,
  Check,
  Printer,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Eye,
  X,
  Share2,
  Download,
  Info,
  CheckCheck,
} from 'lucide-react';
import { User as UserType, Homework } from '../../types';
import { storageService } from '../../services/storageService';
import {
  ParentDayViewData,
  ParentSafeStudent,
  ParentSchedulePeriodView,
} from '../../services/parentService';
import {
  getCairoCurrentDate,
  getEgyptianDayName,
  formatEgyptianDate,
} from '../../utils/egyptianTime';

interface ParentDayViewProps {
  currentUser: UserType | null;
  onNavigateToFullPortal?: () => void;
  onNavigateToNotifications?: () => void;
}

export const ParentDayView: React.FC<ParentDayViewProps> = ({
  currentUser,
  onNavigateToFullPortal,
  onNavigateToNotifications,
}) => {
  const [linkedStudents, setLinkedStudents] = useState<ParentSafeStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => getCairoCurrentDate());
  const [dayViewData, setDayViewData] = useState<ParentDayViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonModal, setSelectedLessonModal] = useState<ParentSchedulePeriodView | null>(null);
  const [homeworkTab, setHomeworkTab] = useState<'dueToday' | 'upcoming' | 'pastDue'>('dueToday');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Fetch parent's linked students
  useEffect(() => {
    const students = storageService.getParentLinkedStudents(currentUser);
    setLinkedStudents(students);
    if (students.length > 0) {
      if (!selectedStudentId || !students.some(s => s.id === selectedStudentId)) {
        setSelectedStudentId(students[0].id);
      }
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Fetch Day View Data whenever selected student or date changes
  const loadDayView = () => {
    if (!selectedStudentId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = storageService.getParentDayView(selectedStudentId, selectedDate, currentUser);
      if (res.success && res.data) {
        setDayViewData(res.data);
        setLastSyncTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setError(res.error || 'تعذر تحميل بيانات اليوم الدراسي');
        setDayViewData(null);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDayView();
  }, [selectedStudentId, selectedDate, currentUser]);

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getCairoCurrentDate());
  };

  const handlePrint = () => {
    window.print();
  };

  if (linkedStudents.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#008e8b] flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">بوابة ولي الأمر</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          لم يتم العثور على طلاب مرتبطين بحساب ولي الأمر الحالي. يرجى مراجعة إدارة شؤون الطلاب بالمدرسة لربط كود الطالب بحسابكم.
        </p>
      </div>
    );
  }

  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId) || linkedStudents[0];
  const isToday = selectedDate === getCairoCurrentDate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300" id="parent-day-view-container">
      {/* 1. Header & Child Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center shrink-0 border border-teal-100 shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ماذا حدث لابني اليوم؟</h1>
              {dayViewData?.isAdminPreview && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  معاينة إدارة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة مباشرة للحضور، الحصص المشروحة، الواجبات والسلوك المدرسي
            </p>
          </div>
        </div>

        {/* Right Action Bar: Student Switcher & Print */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
          {/* Child Switcher Dropdown */}
          {linkedStudents.length > 1 ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-3">
              <User className="w-4 h-4 text-[#008e8b]" />
              <select
                id="parent-child-switcher"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {linkedStudents.map(std => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.grade} - فصل {std.classroom})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            selectedStudent && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800">
                <User className="w-4 h-4 text-[#008e8b]" />
                <span>
                  {selectedStudent.name} ({selectedStudent.grade} - {selectedStudent.classroom})
                </span>
              </div>
            )
          )}

          {/* Print Day Report */}
          <button
            id="btn-print-parent-day"
            onClick={handlePrint}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="طباعة تقرير اليوم الدراسي"
          >
            <Printer className="w-4 h-4 text-[#008e8b]" />
            <span className="hidden sm:inline">طباعة اليوم</span>
          </button>
        </div>
      </div>

      {/* 2. Date Navigator Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-2">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
          title="اليوم السابق"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="hidden sm:inline">اليوم السابق</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#008e8b]" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008e8b]"
          />
          <span className="text-xs font-black text-slate-700 hidden md:inline">
            ({getEgyptianDayName(selectedDate)})
          </span>
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-50 text-[#008e8b] border border-teal-200 hover:bg-[#008e8b] hover:text-white transition-all cursor-pointer"
            >
              العودة لليوم
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDayView}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#008e8b] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="اليوم التالي"
          >
            <span className="hidden sm:inline">اليوم التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#008e8b] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">جاري تجميع سجلات اليوم الدراسي للطالب...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold">{error}</h3>
          <p className="text-xs text-rose-600 mt-1">يرجى التأكد من صلاحيات الحساب أو المحاولة مرة أخرى.</p>
        </div>
      ) : dayViewData ? (
        <>
          {/* 3. Hero Attendance Status Card */}
          <div
            id="parent-attendance-card"
            className={`rounded-3xl p-5 sm:p-6 border transition-all ${
              dayViewData.attendance.status === 'حاضر'
                ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200'
                : dayViewData.attendance.status === 'متأخر'
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-200'
                : dayViewData.attendance.status === 'غائب'
                ? 'bg-gradient-to-br from-rose-500/10 to-red-500/5 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    dayViewData.attendance.status === 'حاضر'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : dayViewData.attendance.status === 'متأخر'
                      ? 'bg-amber-500 text-white border-amber-400'
                      : dayViewData.attendance.status === 'غائب'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-slate-300 text-slate-700 border-slate-300'
                  }`}
                >
                  {dayViewData.attendance.status === 'حاضر' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : dayViewData.attendance.status === 'متأخر' ? (
                    <Clock className="w-8 h-8" />
                  ) : dayViewData.attendance.status === 'غائب' ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : (
                    <HelpCircle className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">حالة الحضور المدرسي:</span>
                    <span
                      className={`text-sm font-black px-3 py-0.5 rounded-full ${
                        dayViewData.attendance.status === 'حاضر'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : dayViewData.attendance.status === 'متأخر'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : dayViewData.attendance.status === 'غائب'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {dayViewData.attendance.statusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 flex-wrap">
                    {dayViewData.attendance.checkInTime && (
                      <span className="flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#008e8b]" />
                        وقت الحضور: {dayViewData.attendance.checkInTime}
                      </span>
                    )}

                    {dayViewData.attendance.lateMinutes ? (
                      <span className="flex items-center gap-1 font-bold text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        تأخير: {dayViewData.attendance.lateMinutes} دقيقة
                      </span>
                    ) : null}

                    {dayViewData.attendance.checkOutTime && (
                      <span className="flex items-center gap-1 font-bold">
                        <ArrowRight className="w-3.5 h-3.5 text-[#008e8b]" />
                        الانصراف: {dayViewData.attendance.checkOutTime}
                      </span>
                    )}

                    {dayViewData.attendance.excuseReason && (
                      <span className="font-semibold text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
                        السبب: {dayViewData.attendance.excuseReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Behavior Score Mini Pill */}
              {dayViewData.behavior.currentScore !== undefined && (
                <div className="bg-white/90 backdrop-blur-xs p-3 px-4 rounded-2xl border border-slate-200 flex items-center gap-3 self-start md:self-auto shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500">رصيد الانضباط السلوكي</div>
                    <div className="text-base font-black text-slate-900">
                      {dayViewData.behavior.currentScore} / 100
                      <span className="mr-1.5 text-xs font-bold text-emerald-700">({dayViewData.behavior.scoreLevel})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Class Attendance Mismatch Warning Banner */}
            {dayViewData.classAttendanceMismatch.hasMismatch && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">تنبيه انضباط الحصص: </span>
                  <span>{dayViewData.classAttendanceMismatch.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Today's Schedule & Lesson Delivery Timeline */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs" id="parent-schedule-timeline">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#008e8b]" />
                <h2 className="text-sm font-black text-slate-900">جدول الحصص والدروس المشروحة اليوم</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {dayViewData.schedule.length} حصص مقررة
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {dayViewData.schedule.length > 0 ? (
                dayViewData.schedule.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-2xl border transition-all text-right ${
                      item.deliveryStatus === 'Delivered'
                        ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                        : item.deliveryStatus === 'Substituted'
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Period Info */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 font-bold text-[#008e8b] shadow-2xs">
                          <span className="text-[9px] text-slate-400">حصة</span>
                          <span className="text-sm font-black -mt-1">{item.periodNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900">{item.subject}</h3>

                            {/* Delivery Status Badge */}
                            {item.deliveryStatus === 'Delivered' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                تم الشرح وتوثيق المحتوى
                              </span>
                            ) : item.deliveryStatus === 'Substituted' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 text-amber-700" />
                                حصة احتياط ({item.substituteTeacherName || 'معلم بديل'})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                مجدولة
                              </span>
                            )}

                            {/* Class Attendance Badge for this period */}
                            {item.classAttendanceStatus && item.classAttendanceStatus !== 'لم يرصد' && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.classAttendanceStatus === 'حاضر'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.classAttendanceStatus === 'حاضر' ? 'حاضر بالحصة' : 'غائب عن الحصة'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                            {item.teacherName && (
                              <span>المعلم: <strong className="text-slate-700">{item.teacherName}</strong></span>
                            )}
                            {item.startTime && (
                              <span className="text-slate-400 font-mono">
                                ({item.startTime} - {item.endTime})
                              </span>
                            )}
                            {item.room && <span>القاعة: {item.room}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Lesson Content or Homework Trigger */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {item.lessonContent && (
                          <button
                            onClick={() => setSelectedLessonModal(item)}
                            className="px-3 py-1.5 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>محتوى الدرس المشروح</span>
                          </button>
                        )}

                        {item.homework && (
                          <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                            <span>واجب: {item.homework.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Lesson Snippet if present */}
                    {item.lessonContent && (
                      <div className="mt-3 pt-2.5 border-t border-emerald-100/80 text-xs text-slate-700 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#008e8b] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{item.lessonContent.title}: </strong>
                          <span className="text-slate-600">
                            {item.lessonContent.summary
                              ? item.lessonContent.summary.slice(0, 140) + '...'
                              : 'تم استيفاء الشرح وتدريبات الفصل.'}
                          </span>
                          {item.lessonContent.bookPages && (
                            <span className="mr-2 text-[11px] font-bold text-[#008e8b] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                              صفحات الكتاب: {item.lessonContent.bookPages}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  لا توجد حصص مجدولة لهذا اليوم ({getEgyptianDayName(selectedDate)}).
                </div>
              )}
            </div>
          </div>

          {/* 5. Homeworks & Behavior Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Homework Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs" id="parent-homework-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#008e8b]" />
                  <h2 className="text-sm font-black text-slate-900">الواجبات والتكليفات المنزلية</h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {dayViewData.homeworks.totalCount} واجب
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mt-4 text-xs font-bold">
                <button
                  onClick={() => setHomeworkTab('dueToday')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer ${
                    homeworkTab === 'dueToday'
                      ? 'bg-[#008e8b] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  تسليم اليوم ({dayViewData.homeworks.dueToday.length})
                </button>
                <button
                  onClick={() => setHomeworkTab('upcoming')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer ${
                    homeworkTab === 'upcoming'
                      ? 'bg-[#008e8b] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  القادمة ({dayViewData.homeworks.upcoming.length})
                </button>
                <button
                  onClick={() => setHomeworkTab('pastDue')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer ${
                    homeworkTab === 'pastDue'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  المتأخرة ({dayViewData.homeworks.pastDue.length})
                </button>
              </div>

              {/* Homeworks List */}
              <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                {dayViewData.homeworks[homeworkTab].length > 0 ? (
                  dayViewData.homeworks[homeworkTab].map(hw => (
                    <div
                      key={hw.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all text-right"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-900">{hw.title}</span>
                          <span className="mr-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-[#008e8b] border border-teal-100">
                            {hw.subject}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          الموعد: {hw.dueDate}
                        </span>
                      </div>

                      {hw.description && (
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                          {hw.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
                    لا توجد واجبات مدرجة في هذا التبويب.
                  </div>
                )}
              </div>
            </div>

            {/* Behavior & Positive Discipline Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs" id="parent-behavior-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-black text-slate-900">الانضباط والسلوك والتميز</h2>
                </div>
                {dayViewData.behavior.currentScore !== undefined && (
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {dayViewData.behavior.currentScore} نقطة
                  </span>
                )}
              </div>

              {/* Social Specialist Case Alert */}
              {dayViewData.behavior.hasOpenCase && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{dayViewData.behavior.caseStatusMessage}</span>
                </div>
              )}

              {/* Positive Behavior Awards */}
              <div className="mt-4">
                <h4 className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>⭐ شكر وتقدير وشهادات التميز:</span>
                </h4>
                {dayViewData.behavior.recentPositiveAwards.length > 0 ? (
                  <div className="space-y-2">
                    {dayViewData.behavior.recentPositiveAwards.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-right text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950">{item.reason || item.title || 'سلوك إيجابي متميز'}</span>
                          <span className="font-bold text-emerald-700">+{item.points || 5} نقاط</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {item.date || item.createdAt?.split('T')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl text-center">
                    لا توجد شهادات تميز مسجلة حديثاً.
                  </p>
                )}
              </div>

              {/* Confirmed Violations */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-black text-rose-800 flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>المخالفات السلوكية المرصودة:</span>
                </h4>
                {dayViewData.behavior.recentViolations.length > 0 ? (
                  <div className="space-y-2">
                    {dayViewData.behavior.recentViolations.map((vio, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-rose-50/50 border border-rose-200 rounded-2xl text-right text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950">{vio.violationName}</span>
                          <span className="font-bold text-rose-700">-{vio.pointsDeducted} نقاط</span>
                        </div>
                        {vio.notes && <p className="text-[11px] text-slate-600 mt-1">{vio.notes}</p>}
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {vio.date || vio.createdAt?.split('T')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl text-center font-bold">
                    سجل الانضباط نظيف تماماً بدون أي مخالفات اليوم!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 6. Footer Last Sync Info */}
          <div className="text-center pt-4 text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>آخر تحديث للبيانات: اليوم الساعة {lastSyncTime || 'الآن'}</span>
          </div>
        </>
      ) : null}

      {/* 7. Lesson Content Modal (Drawer / Popup) */}
      {selectedLessonModal && selectedLessonModal.lessonContent && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLessonModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLessonModal(null)}
              className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center border border-teal-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedLessonModal.periodName} - {selectedLessonModal.subject}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedLessonModal.lessonContent.title}
                </h3>
              </div>
            </div>

            {selectedLessonModal.lessonContent.bookPages && (
              <div className="mb-4 inline-block bg-teal-50 text-[#008e8b] px-3 py-1 rounded-xl text-xs font-bold border border-teal-100">
                صفحات الكتاب المدرسي: {selectedLessonModal.lessonContent.bookPages}
              </div>
            )}

            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">ملخص ما تم شرحه:</h4>
                <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  {selectedLessonModal.lessonContent.summary || 'تم استيفاء شرح أهداف الدرس وحل تدريبات الفصل.'}
                </p>
              </div>

              {selectedLessonModal.lessonContent.learningObjectives &&
                selectedLessonModal.lessonContent.learningObjectives.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">أهداف التعلم المحققة:</h4>
                    <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-slate-600">
                      {selectedLessonModal.lessonContent.learningObjectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedLessonModal.lessonContent.resources &&
                selectedLessonModal.lessonContent.resources.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">المصادر وروابط التعلم الرقمية:</h4>
                    <div className="space-y-1.5">
                      {selectedLessonModal.lessonContent.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-teal-50/50 hover:bg-teal-50 text-[#008e8b] rounded-xl border border-teal-100 flex items-center justify-between font-bold transition-all text-xs"
                        >
                          <span className="flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {res.title}
                          </span>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-teal-200">
                            {res.type}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLessonModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
