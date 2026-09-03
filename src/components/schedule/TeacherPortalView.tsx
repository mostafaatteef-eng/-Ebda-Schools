import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Homework,
  LessonContent,
  LessonDeliveryStatus,
  ScheduleItem,
  ScheduleSubstitution,
  User,
} from '../../types';
import { storageService } from '../../services/storageService';
import { ScheduleService, TeacherDayContext } from '../../services/scheduleService';
import {
  formatEgyptianDate,
  getCairoCurrentDate,
  getEgyptianDayName,
} from '../../utils/egyptianTime';
import { LessonDeliveryWorkspaceModal } from './LessonDeliveryWorkspaceModal';
import { ScheduleMatrixView } from './ScheduleMatrixView';
import { ScheduleSubstitutionManager } from './ScheduleSubstitutionManager';

export const TeacherPortalView: React.FC = () => {
  const currentUser = storageService.getCurrentUser();
  const isAdminOrSupervisor =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Supervisor' ||
    currentUser?.role === 'TeacherAffairs';

  const employees = storageService.getEmployees();
  const teachers = employees.filter(
    e => (e.department?.includes('تعليم') || e.department?.includes('تدريس') || e.jobTitle?.includes('معلم') || e.isTeacher) && e.status === 'Active'
  );

  // Selected Teacher (defaults to current logged-in user if they are a teacher, or first teacher)
  const defaultTeacherId = useMemo(() => {
    if (currentUser?.employeeId && teachers.some(t => t.id === currentUser.employeeId)) {
      return currentUser.employeeId;
    }
    if (currentUser?.id && teachers.some(t => t.id === currentUser.id)) {
      return currentUser.id;
    }
    return teachers[0]?.id || '';
  }, [currentUser, teachers]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacherId);
  const [selectedDate, setSelectedDate] = useState<string>(getCairoCurrentDate());
  const [mainTab, setMainTab] = useState<'today' | 'matrix' | 'substitutions' | 'homework'>('today');

  // Modal State for Lesson Delivery
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeWorkspacePeriod, setActiveWorkspacePeriod] = useState<{
    periodNumber: number;
    scheduleItem?: ScheduleItem;
    substitution?: ScheduleSubstitution;
  } | null>(null);

  // Selected Teacher Profile
  const activeTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // Daily Context for selected teacher and date
  const dayContext: TeacherDayContext = useMemo(() => {
    if (!activeTeacher) {
      return {
        date: selectedDate,
        dayName: getEgyptianDayName(selectedDate),
        teacherId: '',
        teacherName: '',
        periods: [],
      };
    }
    return ScheduleService.getTeacherDayContext(activeTeacher.id, selectedDate);
  }, [activeTeacher, selectedDate]);

  // Homework list for this teacher
  const [allHomeworks, setAllHomeworks] = useState<Homework[]>(() => storageService.getHomeworks());
  const [hwFilterSearch, setHwFilterSearch] = useState('');

  const teacherHomeworks = useMemo(() => {
    return allHomeworks.filter(h => {
      const matchTeacher = !activeTeacher || h.teacherId === activeTeacher.id;
      const matchSearch =
        !hwFilterSearch ||
        h.title.toLowerCase().includes(hwFilterSearch.toLowerCase()) ||
        h.subject.toLowerCase().includes(hwFilterSearch.toLowerCase()) ||
        h.classroom.includes(hwFilterSearch);
      return matchTeacher && matchSearch;
    });
  }, [allHomeworks, activeTeacher, hwFilterSearch]);

  const reloadData = () => {
    setAllHomeworks(storageService.getHomeworks());
  };

  const handleOpenWorkspace = (period: TeacherDayContext['periods'][0]) => {
    setActiveWorkspacePeriod({
      periodNumber: period.periodNumber,
      scheduleItem: period.scheduleItem,
      substitution: period.substitution,
    });
    setIsWorkspaceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Profile & Context Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            {activeTeacher?.name ? activeTeacher.name.charAt(0) : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {activeTeacher?.name || 'بوابة المعلم والجدول التشغيلي'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {activeTeacher?.jobTitle || 'معلم'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTeacher?.department || 'قسم المواد الدراسية'} • الكود الوظيفي: {activeTeacher?.employeeNumber || 'TCH'}
            </p>
          </div>
        </div>

        {/* Date Selector & Teacher Switcher (for Admins) */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {isAdminOrSupervisor && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
              <span className="text-xs font-bold text-slate-500">عرض جدول:</span>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none max-w-[180px]"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setMainTab('today')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mainTab === 'today'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>اليوم الدراسي والحصص ({dayContext.dayName})</span>
        </button>

        <button
          onClick={() => setMainTab('matrix')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mainTab === 'matrix'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الجدول الأسبوعي والمصفوفة العامة</span>
        </button>

        <button
          onClick={() => setMainTab('substitutions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mainTab === 'substitutions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>حصص الاحتياطي والبدلاء</span>
        </button>

        <button
          onClick={() => setMainTab('homework')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mainTab === 'homework'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>سجل الواجبات والدروس ({teacherHomeworks.length})</span>
        </button>
      </div>

      {/* TAB 1: TODAY'S OPERATIONAL TIMELINE */}
      {mainTab === 'today' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Daily Quick Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">إجمالي حصص اليوم</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {dayContext.periods.filter(p => p.effectiveSubject !== 'حصة فراغ / إشراف').length} حصة
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">الحصص المكتملة</p>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {dayContext.periods.filter(p => p.deliveryStatus === 'Delivered').length} منجزة
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">حصص الاحتياطي المكلف بها</p>
              <p className="text-xl font-black text-amber-700 mt-1">
                {dayContext.periods.filter(p => p.isSubstitutionForOther).length} احتياطي
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">حصص الفراغ / الراحة</p>
              <p className="text-xl font-black text-blue-700 mt-1">
                {dayContext.periods.filter(p => p.effectiveSubject === 'حصة فراغ / إشراف').length} فترات
              </p>
            </div>
          </div>

          {/* Today's Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayContext.periods.map(period => {
              const isFree = period.effectiveSubject === 'حصة فراغ / إشراف';
              const isDelivered = period.deliveryStatus === 'Delivered';
              const isSubIn = period.isSubstitutionForOther;
              const isSubOut = period.isSubstituted;

              return (
                <div
                  key={period.periodNumber}
                  className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                    isDelivered
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                      : isSubIn
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400'
                      : isSubOut
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isFree
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300'
                  }`}
                >
                  <div>
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {period.periodNumber}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-slate-500">
                          {period.startTime} - {period.endTime}
                        </div>
                      </div>

                      {isDelivered && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>تم التنفيذ</span>
                        </span>
                      )}

                      {isSubIn && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                          حصة احتياطي بديلة
                        </span>
                      )}

                      {isSubOut && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          مغطاة ببديل
                        </span>
                      )}
                    </div>

                    {/* Subject & Classroom */}
                    <div className="space-y-1 mb-4">
                      <h4 className="text-base font-bold text-slate-900">
                        {period.effectiveSubject}
                      </h4>
                      {!isFree && (
                        <p className="text-xs font-bold text-emerald-800">
                          {period.effectiveGrade} • فصل {period.effectiveClassroom}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {period.effectiveRoom}
                      </p>
                    </div>

                    {/* Lesson Content summary if delivered */}
                    {period.lessonContent && (
                      <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs mb-4 space-y-1">
                        <p className="font-bold text-slate-800 truncate">
                          📖 {period.lessonContent.title || period.lessonContent.lessonTitle}
                        </p>
                        {period.lessonContent.bookPages && (
                          <p className="text-[11px] text-slate-500">
                            ص: {period.lessonContent.bookPages}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Button */}
                  {!isFree && !isSubOut ? (
                    <button
                      onClick={() => handleOpenWorkspace(period)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isDelivered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-900 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{isDelivered ? 'تعديل تحضير الحصة والغياب' : 'ابدأ الحصة ورصد المحتوى'}</span>
                    </button>
                  ) : (
                    <div className="py-2.5 text-center text-xs font-bold text-slate-400">
                      {isSubOut ? 'تم تكليف بديل' : 'فترة استراحة وإشراف'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE MATRIX */}
      {mainTab === 'matrix' && (
        <div className="animate-fadeIn">
          <ScheduleMatrixView currentUser={currentUser} />
        </div>
      )}

      {/* TAB 3: SUBSTITUTION CONSOLE */}
      {mainTab === 'substitutions' && (
        <div className="animate-fadeIn">
          <ScheduleSubstitutionManager currentUser={currentUser} />
        </div>
      )}

      {/* TAB 4: HOMEWORK & LESSON CONTENT REPOSITORY */}
      {mainTab === 'homework' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={hwFilterSearch}
                onChange={e => setHwFilterSearch(e.target.value)}
                placeholder="بحث في الواجبات والدروس المسندة..."
                className="w-full pr-9 pl-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <span className="text-xs font-bold text-slate-600">
              إجمالي الواجبات: {teacherHomeworks.length}
            </span>
          </div>

          {teacherHomeworks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-600" />
              <p className="text-sm font-bold text-slate-700">لا توجد واجبات مسجلة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك إضافة وتكليف الواجبات مباشرة عند رصد أي حصة في جدول اليوم
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherHomeworks.map(hw => (
                <div
                  key={hw.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {hw.subject}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      تسليم: {hw.dueDate}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{hw.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {hw.description || 'لا يوجد تفاصيل إضافية'}
                    </p>
                  </div>

                  {hw.questions && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-700">
                      📝 الأسئلة: {hw.questions}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{hw.grade} ({hw.classroom})</span>
                    <span className="font-bold text-emerald-700">الدرجة: {hw.maxScore || 10}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson Delivery Workspace Modal */}
      {isWorkspaceOpen && activeWorkspacePeriod && (
        <LessonDeliveryWorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          date={selectedDate}
          periodNumber={activeWorkspacePeriod.periodNumber}
          scheduleItem={activeWorkspacePeriod.scheduleItem}
          substitution={activeWorkspacePeriod.substitution}
          teacherId={activeTeacher?.id || ''}
          teacherName={activeTeacher?.name || ''}
          onSaved={reloadData}
        />
      )}
    </div>
  );
};
