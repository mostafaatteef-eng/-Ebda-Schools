import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Homework, Student, StudentAttendanceRecord, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import { HomeworkService } from '../../services/homeworkService';
import { NotificationService } from '../../services/notificationService';
import { getCairoCurrentDate, getEgyptianDayName, formatEgyptianDate } from '../../utils/egyptianTime';

interface ParentDayViewProps {
  currentUser: UserType | null;
  onNavigateToFullPortal?: () => void;
}

export const ParentDayView: React.FC<ParentDayViewProps> = ({ currentUser, onNavigateToFullPortal }) => {
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const today = getCairoCurrentDate();

  useEffect(() => {
    const allStudents = storageService.getStudents();
    setStudents(allStudents);
    if (allStudents.length > 0 && !selectedStudentId) {
      // If user has linked student IDs, select the first linked one
      if (currentUser?.studentIds && currentUser.studentIds.length > 0) {
        const found = allStudents.find(s => currentUser.studentIds?.includes(s.id));
        if (found) {
          setSelectedStudentId(found.id);
          return;
        }
      }
      setSelectedStudentId(allStudents[0].id);
    }
  }, [currentUser]);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // 1. Attendance Today
  const attendanceToday: StudentAttendanceRecord | undefined = selectedStudent
    ? storageService.getStudentAttendance().find(a => a.studentId === selectedStudent.id && a.date === today)
    : undefined;

  // 2. Schedule & Lesson Instances Today
  const dayName = getEgyptianDayName(today);
  const studentSchedule = selectedStudent
    ? storageService
        .getSchedule()
        .filter(s => s.grade === selectedStudent.grade && (!s.classroom || s.classroom === selectedStudent.classroom) && (s.dayName === dayName || s.dayOfWeek === dayName))
        .sort((a, b) => a.periodNumber - b.periodNumber)
    : [];

  const lessonContentsToday = selectedStudent
    ? storageService
        .getLessonContents()
        .filter(l => l.grade === selectedStudent.grade && (!l.classroom || l.classroom === selectedStudent.classroom) && l.date === today)
    : [];

  // 3. Due Homeworks
  const homeworks = selectedStudent
    ? HomeworkService.getHomeworks(
        { grade: selectedStudent.grade, classroom: selectedStudent.classroom, status: 'Published' },
        currentUser
      )
    : [];

  // Categorize Homeworks
  const todayHomeworks = homeworks.filter(h => h.dueDate === today);
  const upcomingHomeworks = homeworks.filter(h => h.dueDate > today);
  const overdueHomeworks = homeworks.filter(h => h.dueDate < today);

  // 4. Notifications for Parent & Student
  const notifications = selectedStudent
    ? NotificationService.getNotifications('Parent', currentUser?.id, selectedStudent.id).slice(0, 5)
    : [];

  // 5. Recent Behavior & Positive Points
  const behaviorViolations = selectedStudent
    ? storageService.getBehaviorViolations().filter(v => v.studentId === selectedStudent.id).slice(0, 3)
    : [];
  const behaviorLedger = selectedStudent
    ? storageService.getBehaviorLedger(selectedStudent.id).slice(0, 3)
    : [];

  if (!selectedStudent) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#008e8b] flex items-center justify-center mx-auto mb-4">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">بوابة ولي الأمر - اليوم الدراسي</h2>
        <p className="text-xs text-slate-500 mt-2">لا يوجد طلاب مسجلون حالياً لعرض اليوم الدراسي.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header & Student Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center shrink-0 border border-teal-100 shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">اليوم الدراسي</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#008e8b]/10 text-[#008e8b] border border-[#008e8b]/20">
                متابعة فورية
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {getEgyptianDayName(today)}، {formatEgyptianDate(today)}
            </p>
          </div>
        </div>

        {/* Student Switcher Dropdown */}
        {students.length > 1 ? (
          <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 px-3">
            <User className="w-4 h-4 text-[#008e8b]" />
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              {students.map(std => (
                <option key={std.id} value={std.id}>
                  {std.name} ({std.grade} - فصل {std.classroom})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800">
            <User className="w-4 h-4 text-[#008e8b]" />
            <span>
              {selectedStudent.name} ({selectedStudent.grade} - فصل {selectedStudent.classroom})
            </span>
          </div>
        )}
      </div>

      {/* 2. Today's Attendance Hero Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#008e8b]" />
            <span>حضور الطالب اليوم</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">طابور الصباح والدخول</span>
        </div>

        {attendanceToday ? (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              attendanceToday.status === 'حاضر'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : attendanceToday.status === 'متأخر'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 ${
                  attendanceToday.status === 'حاضر'
                    ? 'bg-emerald-600'
                    : attendanceToday.status === 'متأخر'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}
              >
                {attendanceToday.status === 'حاضر' ? (
                  <Check className="w-5 h-5" />
                ) : attendanceToday.status === 'متأخر' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-base font-black flex items-center gap-2">
                  <span>{attendanceToday.status}</span>
                  {attendanceToday.status === 'متأخر' && attendanceToday.lateMinutes && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      تأخير {attendanceToday.lateMinutes} دقيقة
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {attendanceToday.checkInTime ? `وقت الدخول المسجل: ${attendanceToday.checkInTime}` : 'مسجل بدفتر الحضور المدرسي'}
                </div>
              </div>
            </div>

            {attendanceToday.notes && (
              <div className="text-xs bg-white/70 px-3 py-1.5 rounded-xl border border-black/5 max-w-xs">
                {attendanceToday.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div className="text-xs">
              <span className="font-bold">قيد الرصد والاعتماد:</span> لم يتم تسجيل حضور طابور الصباح حتى الآن من قبل المشرف.
            </div>
          </div>
        )}
      </div>

      {/* 3. Grid: Lessons Timeline & Homework Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline of Today's Lessons & What was Taught */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#008e8b]" />
                <span>حصص اليوم وما تم تدريسه</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {studentSchedule.length} حصص مجدولة
              </span>
            </div>

            {studentSchedule.length > 0 ? (
              <div className="space-y-3.5">
                {studentSchedule.map((item, idx) => {
                  const lesson = lessonContentsToday.find(l => l.periodNumber === item.periodNumber && l.subject === item.subject);
                  const isDelivered = Boolean(lesson);

                  return (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-200 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-teal-50 text-[#008e8b] font-bold text-xs flex items-center justify-center border border-teal-100">
                            {item.periodNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{item.subject}</span>
                          <span className="text-xs text-slate-500 font-medium">({item.teacherName})</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isDelivered ? '✓ تم التدريس وتسجيل المحتوى' : 'الحصة في الموعد المجدول'}
                        </span>
                      </div>

                      {/* Lesson Content if Recorded */}
                      {lesson ? (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-[#008e8b]">● الدرس:</span> {lesson.lessonTitle}
                          </div>
                          {lesson.summaryCovered && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {lesson.summaryCovered}
                            </p>
                          )}
                          {lesson.bookPages && (
                            <div className="text-[11px] text-teal-700 font-semibold">
                              📖 صفحات الكتاب المدرسي: {lesson.bookPages}
                            </div>
                          )}
                          {lesson.links && lesson.links.length > 0 && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {lesson.links.map(lk => (
                                <a
                                  key={lk.id}
                                  href={lk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-[#008e8b] hover:underline bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{lk.title}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          لم يتم تسجيل ملخص الحصة من المعلم بعد.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                لا توجد حصص مجدولة لهذا اليوم (عطلة أو جدول غير محدد).
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Homeworks & Direct In-App Notifications */}
        <div className="space-y-6">
          {/* Homeworks Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#008e8b]" />
                <span>الواجبات والمهام</span>
              </h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                {homeworks.length} واجبات
              </span>
            </div>

            {homeworks.length > 0 ? (
              <div className="space-y-3">
                {homeworks.map(hw => {
                  const isToday = hw.dueDate === today;
                  const isOverdue = hw.dueDate < today;

                  return (
                    <div
                      key={hw.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 ${
                        isToday
                          ? 'bg-amber-50/50 border-amber-200'
                          : isOverdue
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{hw.subject}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isToday
                              ? 'bg-amber-100 text-amber-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-teal-50 text-[#008e8b]'
                          }`}
                        >
                          {isToday ? 'تسليم اليوم' : isOverdue ? 'متأخر' : `تسليم ${hw.dueDate}`}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 text-[11px]">{hw.title}</div>
                      {hw.description && (
                        <p className="text-slate-600 text-[10px] line-clamp-2">{hw.description}</p>
                      )}
                      {hw.link && (
                        <a
                          href={hw.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-[#008e8b] font-bold hover:underline pt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح رابط الواجب / المرفق</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                لا توجد واجبات معلقة حالياً.
              </div>
            )}
          </div>

          {/* Quick Notifications Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>تنبيهات مهمة لابنك</span>
              </h2>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-800">{n.title}</div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">{n.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                لا توجد تنبيهات جديدة.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
