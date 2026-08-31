import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ClockAlert,
  Download,
  GraduationCap,
  HeartHandshake,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRecord, PayrollRecord, Student, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { NotificationEngine } from '../../services/notificationEngine';
import { PendingActionsCard } from './PendingActionsCard';
import { SyncQueueService } from '../../services/syncQueueService';
import { formatEgyptianCurrency, formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface AdminDashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  // School Data
  const students = useMemo(() => storageService.getStudents(), []);
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Active' || s.status === 'نشط'), [students]);
  const studentAttendance = useMemo(() => storageService.getStudentAttendance(), []);
  const todayStudentAtt = useMemo(() => studentAttendance.filter(a => a.date === selectedDate), [studentAttendance, selectedDate]);

  const studentPresentCount = todayStudentAtt.filter(a => a.status === 'حاضر').length;
  const studentLateCount = todayStudentAtt.filter(a => a.status === 'متأخر').length;
  const studentAbsentCount = todayStudentAtt.filter(a => a.status.includes('غائب')).length;
  const studentUnrecordedCount = Math.max(0, activeStudents.length - todayStudentAtt.length);
  const studentAttRate = activeStudents.length > 0 ? Math.round(((studentPresentCount + studentLateCount) / activeStudents.length) * 100) : 0;

  // HR & Staff Attendance
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);
  const todayTeacherAtt = useMemo(() => attendance.filter(a => a.date === selectedDate), [attendance, selectedDate]);
  const teacherPresentCount = todayTeacherAtt.filter(a => a.status === 'حاضر').length;
  const teacherLateCount = todayTeacherAtt.filter(a => a.status === 'متأخر').length;
  const teacherAbsentCount = todayTeacherAtt.filter(a => a.status.includes('غائب')).length;
  const teacherLeaveCount = todayTeacherAtt.filter(a => a.status.includes('إجازة')).length;
  const teacherUnrecordedCount = Math.max(0, activeEmployees.length - todayTeacherAtt.length);
  const teacherAttRate = activeEmployees.length > 0 ? Math.round(((teacherPresentCount + teacherLateCount) / activeEmployees.length) * 100) : 0;

  // Behavior
  const violations = useMemo(() => storageService.getBehaviorViolations(), []);
  const todayViolations = violations.filter(v => v.date === selectedDate);
  const totalViolationsCount = violations.length;
  const cases = useMemo(() => storageService.getBehaviorCases(), []);
  const activeCasesCount = cases.filter(c => c.status === 'ACTIVE' || c.status === 'UNDER_FOLLOWUP').length;

  // Schedule & Lessons
  const schedule = useMemo(() => storageService.getSchedule(), []);
  const substitutions = useMemo(() => storageService.getSubstitutions(), []);
  const todaySubstitutions = substitutions.filter(s => s.date === selectedDate);
  const pendingSubstitutions = todaySubstitutions.filter(s => s.status === 'PENDING');
  const lessons = useMemo(() => storageService.getLessonContents(), []);
  const todayDayName = getEgyptianDayName(selectedDate);
  const todayPeriods = schedule.filter(s => s.dayName === todayDayName);
  const todayLessonsLogged = lessons.filter(l => l.date === selectedDate);
  const missingLessonsCount = Math.max(0, todayPeriods.length - todayLessonsLogged.length);
  const lessonCoverageRate = todayPeriods.length > 0 ? Math.round((todayLessonsLogged.length / todayPeriods.length) * 100) : 100;

  // Payroll Data (Admin Only)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const payrollRecords = useMemo(() => storageService.getPayrollRecords(), []);
  const currentMonthPayroll = payrollRecords.filter(p => p.month === currentMonth && p.year === currentYear);
  const payrollStatus = currentMonthPayroll.length > 0 ? currentMonthPayroll[0].status : 'Draft';
  const totalGrossPayroll = currentMonthPayroll.reduce((sum, r) => sum + (r.totalGross || 0), 0);
  const totalDeductionsPayroll = currentMonthPayroll.reduce((sum, r) => sum + (r.totalDeductions || 0), 0);
  const totalNetPayroll = currentMonthPayroll.reduce((sum, r) => sum + (r.netSalary || 0), 0);
  const uncalculatedPayrollCount = Math.max(0, activeEmployees.length - currentMonthPayroll.length);

  // Dynamic Pending Actions for Admin
  const adminPendingActions = useMemo(() => {
    return NotificationEngine.generatePendingActions('Admin', currentUser?.id || '001', {
      studentsCount: students.length,
      unrecordedAttendanceCount: studentUnrecordedCount,
      absentOverLimitCount: 0,
      pendingSubstitutionsCount: pendingSubstitutions.length,
      draftHomeworkCount: 0,
      pendingBehaviorFollowupsCount: activeCasesCount,
      payrollDraftCount: uncalculatedPayrollCount > 0 ? 1 : 0,
      syncFailedCount: SyncQueueService.getFailedCount(),
      missingLessonsCount,
      activeAcademicYearNeedsReview: false,
    });
  }, [students.length, studentUnrecordedCount, pendingSubstitutions.length, activeCasesCount, uncalculatedPayrollCount, missingLessonsCount, currentUser?.id]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'مدير النظام';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Date Control */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">مرحباً، {currentUser?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                مدير النظام — Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              لوحة القيادة المركزية لمتابعة شؤون الطلاب، دوام المعلمين، السلوك، الدراسة، والرواتب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{getEgyptianDayName(selectedDate)}، {formatEgyptianDate(selectedDate)}</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20"
          />
        </div>
      </div>

      {/* Dynamic Pending Actions Card */}
      <PendingActionsCard
        userRole="Admin"
        actions={adminPendingActions}
        onExecuteAction={tab => onNavigate(tab)}
      />

      {/* 1. قسم شؤون الطلاب */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <GraduationCap className="w-4 h-4 text-[#008e8b]" />
            <span>شؤون الطلاب وحضور اليوم</span>
          </div>
          <button
            onClick={() => onNavigate('student_attendance')}
            className="text-xs font-bold text-[#008e8b] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>فتح شيت الحضور الكامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">الطلاب المقيدون</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-[#008e8b]"><GraduationCap className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{activeStudents.length}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-semibold">طالب نشط بالعام الحالي</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">حضور اليوم</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><UserCheck className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{studentPresentCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-bold">نسبة الحضور: {studentAttRate}%</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">غياب وتأخير اليوم</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><UserX className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-rose-600">{studentAbsentCount}</span>
              <span className="text-xs font-bold text-amber-600">({studentLateCount} متأخر)</span>
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-semibold">يحتاج تواصل ومتابعة</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">غير مرصود بعد</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><ClockAlert className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{studentUnrecordedCount}</div>
            <div className="text-[11px] text-amber-700 mt-1 font-semibold">بانتظار رصد المشرفين</div>
          </div>
        </div>
      </div>

      {/* 2. قسم شؤون المعلمين والموظفين */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Users className="w-4 h-4 text-[#008e8b]" />
            <span>دوام المعلمين والموظفين اليوم</span>
          </div>
          <button
            onClick={() => onNavigate('daily_attendance')}
            className="text-xs font-bold text-[#008e8b] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>سجل الدوام المكتبي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي المعلمين</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-[#008e8b]"><Users className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{activeEmployees.length}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-semibold">معلم وموظف نشط</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">حضور الكادر اليوم</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{teacherPresentCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-bold">نسبة التواجد: {teacherAttRate}%</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">غياب وإجازات</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><Clock className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-rose-600">{teacherAbsentCount + teacherLeaveCount}</span>
              <span className="text-xs font-bold text-amber-600">({teacherLateCount} متأخر)</span>
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-semibold">({teacherLeaveCount}) إجازة رسمية</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">حصص احتياطي اليوم</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><Layers className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-purple-600 mt-2">{todaySubstitutions.length}</div>
            <div className="text-[11px] text-purple-700 mt-1 font-semibold">({pendingSubstitutions.length}) بانتظار التعيين</div>
          </div>
        </div>
      </div>

      {/* 3. قسم السلوك والرواتب (Admin Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavior Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>الانضباط والحالات السلوكية</span>
            </div>
            <button
              onClick={() => onNavigate('behavior')}
              className="text-xs font-bold text-[#008e8b] hover:underline"
            >
              عرض السجل السلوكي
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-bold">مخالفات مسجلة اليوم</span>
              <div className="text-xl font-black text-slate-900 mt-1">{todayViolations.length}</div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-bold">حالات إرشاد نشطة</span>
              <div className="text-xl font-black text-amber-600 mt-1">{activeCasesCount}</div>
            </div>
          </div>
        </div>

        {/* Payroll Engine Status Card (Admin Only) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>مسير الرواتب والمحرك المالي (شهر {currentMonth} / {currentYear})</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              خاص بالإدارة
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-bold">صافي المستحقات المقدرة</span>
              <div className="text-lg font-black text-emerald-700 mt-1">
                {formatEgyptianCurrency(totalNetPayroll)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-bold">حالة المسير</span>
              <div className="text-sm font-black text-slate-800 mt-1">
                {payrollStatus === 'Approved' ? 'معتمد رسمياً' : payrollStatus === 'Paid' ? 'مدفوع' : 'مسودة قيد المراجعة'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
