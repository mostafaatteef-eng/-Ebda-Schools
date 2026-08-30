import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { BehaviorViolation, ClassPeriodSchedule, LessonContent, Student, StudentAttendanceRecord, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface ParentDashboardProps {
  currentUser: UserType | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const students = useMemo(() => storageService.getStudents(), []);
  const allAttendance = useMemo(() => storageService.getStudentAttendance(), []);
  const allViolations = useMemo(() => storageService.getBehaviorViolations(), []);
  const allLessons = useMemo(() => storageService.getLessonContents(), []);
  const allSchedule = useMemo(() => storageService.getSchedule(), []);

  // Find parent's children
  const myChildren = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.studentIds && currentUser.studentIds.length > 0) {
      return students.filter(s => currentUser.studentIds?.includes(s.id));
    }
    // Fallback match by parent name or phone
    return students.filter(s => 
      s.parentName === currentUser.fullName || 
      (currentUser.phone && s.parentPhone === currentUser.phone)
    );
  }, [students, currentUser]);

  // Selected child state
  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return myChildren[0]?.id || '';
  });

  const activeChild = useMemo(() => {
    return myChildren.find(c => c.id === selectedChildId) || myChildren[0] || null;
  }, [myChildren, selectedChildId]);

  // Child's attendance today
  const childTodayAtt = useMemo(() => {
    if (!activeChild) return null;
    return allAttendance.find(a => a.studentId === activeChild.id && a.date === selectedDate) || null;
  }, [allAttendance, activeChild, selectedDate]);

  // Child's monthly attendance stats
  const childMonthlyAtt = useMemo(() => {
    if (!activeChild) return { present: 0, absent: 0, late: 0, rate: 100 };
    const monthPrefix = selectedDate.substring(0, 7); // YYYY-MM
    const records = allAttendance.filter(a => a.studentId === activeChild.id && a.date.startsWith(monthPrefix));
    const present = records.filter(r => r.status === 'حاضر').length;
    const late = records.filter(r => r.status === 'متأخر').length;
    const absent = records.filter(r => r.status.includes('غائب')).length;
    const total = records.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
    return { present, absent, late, rate, total };
  }, [allAttendance, activeChild, selectedDate]);

  // Child's schedule today
  const todayDayName = getEgyptianDayName(selectedDate);
  const childPeriods = useMemo(() => {
    if (!activeChild) return [];
    return allSchedule.filter(s => s.grade === activeChild.grade && s.classroom === activeChild.classroom && s.dayName === todayDayName)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }, [allSchedule, activeChild, todayDayName]);

  // Lessons taught to child today
  const childLessonsToday = useMemo(() => {
    if (!activeChild) return [];
    return allLessons.filter(l => l.grade === activeChild.grade && l.classroom === activeChild.classroom && l.date === selectedDate);
  }, [allLessons, activeChild, selectedDate]);

  // Child's violations & behavior score
  const childViolations = useMemo(() => {
    if (!activeChild) return [];
    return allViolations.filter(v => v.studentId === activeChild.id);
  }, [allViolations, activeChild]);

  const totalDeducted = useMemo(() => {
    return childViolations.reduce((sum, v) => sum + (v.pointsDeducted || 0), 0);
  }, [childViolations]);

  const behaviorScore = Math.max(0, (activeChild?.initialBehaviorScore || 100) - totalDeducted);

  const userName = currentUser?.fullName?.split(' ')[0] || 'ولي الأمر';

  if (!activeChild) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <Users className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-extrabold text-slate-900 text-base">لم يتم ربط أي طالب بحسابك حتى الآن</h2>
        <p className="text-xs text-slate-500">
          يرجى التواصل مع إدارة المدرسة أو شؤون الطلاب لربط كود الطالب بحساب ولي الأمر الخاص بك.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Parent Welcome */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">مرحباً بحضرتك، {currentUser?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-[#008e8b] border border-teal-200">
                بوابة ولي الأمر
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة مباشرة ودقيقة لحضور وانضباط أبنائكم والدروس والواجبات المدرسية المقررة
            </p>
          </div>
        </div>

        {/* Multi-child selector */}
        {myChildren.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-bold px-2">اختر الابن/الابنة:</span>
            {myChildren.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedChildId === c.id
                    ? 'bg-[#008e8b] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {c.name.split(' ')[0]} ({c.grade})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Child Profile & Daily Status Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-teal-300 shrink-0">
              {activeChild.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{activeChild.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-teal-200">
                  كود الطالب: {activeChild.studentCode || activeChild.id}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                <span>{activeChild.grade} — {activeChild.classroom}</span>
                <span>العام الدراسي: {activeChild.academicYear}</span>
              </div>
            </div>
          </div>

          {/* Today's Status Badge */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15 text-left sm:text-right">
            <div className="text-[11px] text-teal-200 font-bold mb-1">حالة الحضور اليوم ({formatEgyptianDate(selectedDate)}):</div>
            {childTodayAtt ? (
              <div className="flex items-center gap-2">
                {childTodayAtt.status === 'حاضر' ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حاضر بالمدرسة (في الموعد)</span>
                  </div>
                ) : childTodayAtt.status === 'متأخر' ? (
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
                    <Clock className="w-4 h-4" />
                    <span>متأخر ({childTodayAtt.lateMinutes || 0} دقيقة)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>غائب اليوم ({childTodayAtt.status})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-300 font-medium">
                جاري رصد الحضور من قبل المدرسة...
              </div>
            )}
          </div>
        </div>

        {/* Quick Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold">نسبة الحضور الشهري</div>
            <div className="text-base font-black text-teal-300 mt-0.5">{childMonthlyAtt.rate}%</div>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold">أيام الغياب هذا الشهر</div>
            <div className="text-base font-black text-rose-400 mt-0.5">{childMonthlyAtt.absent} أيام</div>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold">مرات التأخر الصباحي</div>
            <div className="text-base font-black text-amber-400 mt-0.5">{childMonthlyAtt.late} مرات</div>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <div className="text-[10px] text-slate-400 font-bold">تقييم السلوك والانضباط</div>
            <div className={`text-base font-black mt-0.5 ${behaviorScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {behaviorScore}% {behaviorScore >= 95 ? '(ممتاز ★)' : behaviorScore >= 85 ? '(جيد جداً)' : '(يحتاج متابعة)'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: What was taught today & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What was taught today (محتوى الدروس والواجبات) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#008e8b]" />
              <h2 className="font-bold text-slate-900 text-sm">ما تم تدريسه والواجبات اليوم</h2>
            </div>
            <span className="text-xs text-slate-500">{childLessonsToday.length} دروس مسجلة</span>
          </div>

          {childLessonsToday.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              لم يتم إدراج دروس اليوم بعد. سيقوم المعلمون بتحديث المحتوى فور انتهاء الحصص.
            </div>
          ) : (
            <div className="space-y-3">
              {childLessonsToday.map(lesson => (
                <div key={lesson.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{lesson.subject} — {lesson.lessonTitle}</span>
                    <span className="text-[10px] text-[#008e8b] font-bold">الحصة {lesson.periodNumber}</span>
                  </div>
                  {lesson.contentSummary && (
                    <p className="text-xs text-slate-600 leading-relaxed">{lesson.contentSummary}</p>
                  )}
                  {lesson.homework && (
                    <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg font-semibold flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
                      <div><strong>الواجب المنزلي:</strong> {lesson.homework}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timetable for Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">جدول حصص اليوم ({todayDayName})</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{childPeriods.length} حصص</span>
          </div>

          {childPeriods.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              لا توجد حصص مجدولة لهذا اليوم (عطلة أسبوعية أو رسمية).
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {childPeriods.map((period, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                      {period.periodNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{period.subject}</div>
                      <div className="text-[10px] text-slate-400">{period.teacherName}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {period.startTime} - {period.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
