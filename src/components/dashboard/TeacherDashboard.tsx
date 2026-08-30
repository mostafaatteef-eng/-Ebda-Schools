import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FilePlus,
  GraduationCap,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { ClassPeriodSchedule, LessonContent, Student, User } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface TeacherDashboardProps {
  currentUser: User | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const todayDayName = getEgyptianDayName(selectedDate);
  const schedule = useMemo(() => storageService.getSchedule(), []);
  const lessons = useMemo(() => storageService.getLessonContents(), []);
  const students = useMemo(() => storageService.getStudents(), []);

  // Filter schedule for this teacher (or all if admin viewing)
  const teacherPeriods = useMemo(() => {
    return schedule.filter(s => {
      const matchDay = s.dayName === todayDayName;
      const matchTeacher = !currentUser?.employeeId || s.teacherId === currentUser.employeeId || s.teacherName === currentUser.fullName;
      return matchDay && matchTeacher;
    }).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [schedule, todayDayName, currentUser]);

  // Lessons recorded for today
  const teacherTodayLessons = useMemo(() => {
    return lessons.filter(l => l.date === selectedDate && (!currentUser?.employeeId || l.teacherId === currentUser.employeeId));
  }, [lessons, selectedDate, currentUser]);

  // Missing lesson logs
  const missingLogs = useMemo(() => {
    return teacherPeriods.filter(period => {
      const logged = teacherTodayLessons.some(l => l.grade === period.grade && l.classroom === period.classroom && l.subject === period.subject);
      return !logged;
    });
  }, [teacherPeriods, teacherTodayLessons]);

  // Current or next period calculation
  const now = new Date();
  const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const currentPeriod = useMemo(() => {
    return teacherPeriods.find(p => p.startTime <= currentHourMin && p.endTime >= currentHourMin) || teacherPeriods[0] || null;
  }, [teacherPeriods, currentHourMin]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'المعلم';

  return (
    <div className="space-y-6">
      {/* Top Welcome */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">مرحباً يا أستاذ {currentUser?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-[#008e8b] border border-teal-200">
                بوابة المعلم اليومية
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              جدول حصصك اليومية، رصد حضور وغياب الطلاب، وتوثيق الدروس المشروحة والواجبات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{todayDayName}، {formatEgyptianDate(selectedDate)}</span>
          </div>
        </div>
      </div>

      {/* Current / Active Period Highlight Banner */}
      {currentPeriod && (
        <div className="bg-gradient-to-r from-[#008e8b] to-[#007775] text-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-100 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الحصة الحالية المقررة:</span>
              </div>
              <div className="text-xl font-black">{currentPeriod.subject} — {currentPeriod.grade} ({currentPeriod.classroom})</div>
              <div className="text-xs text-teal-100 flex items-center gap-2 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>الحصة {currentPeriod.periodNumber} ({currentPeriod.startTime} - {currentPeriod.endTime})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('student_attendance', { grade: currentPeriod.grade, classroom: currentPeriod.classroom })}
                className="px-4 py-2 bg-white text-[#008e8b] hover:bg-teal-50 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>رصد حضور الطلاب</span>
              </button>

              <button
                onClick={() => onNavigate('teacher_portal', { action: 'log_lesson', period: currentPeriod })}
                className="px-4 py-2 bg-teal-800/80 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-teal-400/30"
              >
                <FilePlus className="w-4 h-4" />
                <span>تسجيل ما تم تدريسه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Lesson Logs Alert */}
      {missingLogs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>لديك ({missingLogs.length}) حصص اليوم لم يتم توثيق محتواها الدراسي والواجبات بعد.</span>
          </div>
          <button
            onClick={() => onNavigate('teacher_portal')}
            className="font-bold underline hover:text-amber-950 cursor-pointer shrink-0"
          >
            توثيق الحصص الآن
          </button>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('teacher_portal')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#008e8b] shadow-xs text-right transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold mb-2 group-hover:bg-[#008e8b] group-hover:text-white transition-all">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-900 text-xs">جدول الحصص الأسبوعي</div>
          <div className="text-[10px] text-slate-400 mt-0.5">عرض وتصدير PDF</div>
        </button>

        <button
          onClick={() => onNavigate('teacher_portal')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#008e8b] shadow-xs text-right transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-900 text-xs">توثيق الدروس والواجبات</div>
          <div className="text-[10px] text-slate-400 mt-0.5">تسجيل ما تم شرحه</div>
        </button>

        <button
          onClick={() => onNavigate('student_attendance')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#008e8b] shadow-xs text-right transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-900 text-xs">رصد حضور الطلاب</div>
          <div className="text-[10px] text-slate-400 mt-0.5">تسجيل الغياب والتأخر</div>
        </button>

        <button
          onClick={() => onNavigate('students')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#008e8b] shadow-xs text-right transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Users className="w-4 h-4" />
          </div>
          <div className="font-bold text-slate-900 text-xs">قوائم طلاب فصولي</div>
          <div className="text-[10px] text-slate-400 mt-0.5">بيانات الطلاب والتواصل</div>
        </button>
      </div>

      {/* Today's Schedule Timeline */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#008e8b]" />
            <h2 className="font-bold text-slate-900 text-sm">جدول حصصك لليوم ({todayDayName})</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{teacherPeriods.length} حصص مقررة</span>
        </div>

        {teacherPeriods.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 font-medium">
            ليس لديك حصص مقررة في هذا اليوم.
          </div>
        ) : (
          <div className="space-y-2.5">
            {teacherPeriods.map((period, idx) => {
              const isLogged = teacherTodayLessons.some(
                l => l.grade === period.grade && l.classroom === period.classroom && l.subject === period.subject
              );
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-[#008e8b]/40 bg-slate-50/50 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-xs text-[#008e8b] flex items-center justify-center shadow-xs">
                      {period.periodNumber}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{period.subject}</span>
                        <span className="text-slate-400 font-normal">—</span>
                        <span className="text-[#008e8b] font-extrabold">{period.grade} ({period.classroom})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{period.startTime} إلى {period.endTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        isLogged
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isLogged ? 'تم توثيق الدرس ✓' : 'بانتظار التوثيق'}
                    </span>

                    <button
                      onClick={() => onNavigate('student_attendance', { grade: period.grade, classroom: period.classroom })}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      حضور الفصل
                    </button>

                    <button
                      onClick={() => onNavigate('teacher_portal', { action: 'log_lesson', period })}
                      className="px-2.5 py-1 bg-[#008e8b] hover:bg-[#007775] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      توثيق الدرس
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
