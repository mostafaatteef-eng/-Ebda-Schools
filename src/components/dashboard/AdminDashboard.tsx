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

  // Staff Data
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);
  const todayEmpAtt = useMemo(() => attendance.filter(a => a.date === selectedDate), [attendance, selectedDate]);
  const empPresentCount = todayEmpAtt.filter(r => r.status === 'حاضر').length;
  const empLateCount = todayEmpAtt.filter(r => r.status === 'متأخر').length;
  const empAbsentCount = todayEmpAtt.filter(r => r.status === 'غائب').length;
  const empNoCheckoutCount = todayEmpAtt.filter(r => r.checkIn && !r.checkOut).length;
  const todayLeavesCount = leaves.filter(l => l.startDate <= selectedDate && l.endDate >= selectedDate && l.status === 'مقبولة').length;

  // Behavior stats
  const violations = useMemo(() => storageService.getBehaviorViolations(), []);
  const todayViolations = violations.filter(v => v.date === selectedDate);
  const severeViolations = violations.filter(v => v.severity === 'الدرجة الثالثة' || v.severity === 'الدرجة الرابعة' || v.severity?.includes('شديدة') || v.severity?.includes('خطيرة'));
  const pendingReviewViolations = violations.filter(v => v.status === 'قيد المراجعة');
  const unnotifiedViolations = violations.filter(v => !v.parentNotified && (v.severity?.includes('شديدة') || v.severity?.includes('متوسطة')));

  // Timetable & Lessons stats
  const schedule = useMemo(() => storageService.getSchedule(), []);
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

  const userName = currentUser?.fullName?.split(' ')[0] || 'مدير النظام';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Date Control */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      {/* 1. قسم شؤون الطلاب */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <GraduationCap className="w-4 h-4 text-[#008e8b]" />
            <span>مؤشرات حضور الطلاب اليومية</span>
          </div>
          <button
            onClick={() => onNavigate('student_attendance')}
            className="text-xs text-[#008e8b] hover:text-[#007775] font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>رصد الحضور الكامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onNavigate('students')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-[#008e8b]/50 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-slate-500 font-bold">إجمالي الطلاب</div>
            <div className="text-xl font-black text-slate-900 mt-1">{activeStudents.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">طالب نشط</div>
          </div>

          <div
            onClick={() => onNavigate('student_attendance')}
            className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-emerald-700 font-bold">حاضر اليوم</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{studentPresentCount}</div>
            <div className="text-[10px] text-emerald-600 mt-1">طالب مسجل حضور</div>
          </div>

          <div
            onClick={() => onNavigate('student_attendance')}
            className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-amber-700 font-bold">متأخر اليوم</div>
            <div className="text-xl font-black text-amber-600 mt-1">{studentLateCount}</div>
            <div className="text-[10px] text-amber-600 mt-1">تأخر صباحي</div>
          </div>

          <div
            onClick={() => onNavigate('student_attendance')}
            className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs hover:border-rose-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-rose-700 font-bold">غائب اليوم</div>
            <div className="text-xl font-black text-rose-600 mt-1">{studentAbsentCount}</div>
            <div className="text-[10px] text-rose-600 mt-1">غياب بعذر/بدون</div>
          </div>

          <div
            onClick={() => onNavigate('student_attendance')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-slate-500 font-bold">لم يسجل بعد</div>
            <div className="text-xl font-black text-slate-700 mt-1">{studentUnrecordedCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">قيد الانتظار</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs">
            <div className="text-[11px] text-[#008e8b] font-bold">نسبة الحضور</div>
            <div className="text-xl font-black text-[#008e8b] mt-1">{studentAttRate}%</div>
            <div className="text-[10px] text-slate-500 mt-1">معدل الانضباط</div>
          </div>
        </div>
      </div>

      {/* 2. قسم المعلمين والموظفين */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>دوام المعلمين والموظفين</span>
          </div>
          <button
            onClick={() => onNavigate('daily_attendance')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>سجل الحضور الكامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-slate-500 font-bold">إجمالي الكادر</div>
            <div className="text-xl font-black text-slate-900 mt-1">{activeEmployees.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">معلم وموظف</div>
          </div>

          <div
            onClick={() => onNavigate('daily_attendance')}
            className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-emerald-700 font-bold">حاضرون</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{empPresentCount}</div>
            <div className="text-[10px] text-emerald-600 mt-1">في الموعد</div>
          </div>

          <div
            onClick={() => onNavigate('daily_attendance')}
            className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-amber-700 font-bold">متأخرون</div>
            <div className="text-xl font-black text-amber-600 mt-1">{empLateCount}</div>
            <div className="text-[10px] text-amber-600 mt-1">تأخر صباحي</div>
          </div>

          <div
            onClick={() => onNavigate('daily_attendance')}
            className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs hover:border-rose-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-rose-700 font-bold">غائبون</div>
            <div className="text-xl font-black text-rose-600 mt-1">{empAbsentCount}</div>
            <div className="text-[10px] text-rose-600 mt-1">بدون حضور</div>
          </div>

          <div
            onClick={() => onNavigate('daily_attendance')}
            className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs hover:border-purple-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-purple-700 font-bold">لم ينصرف</div>
            <div className="text-xl font-black text-purple-600 mt-1">{empNoCheckoutCount}</div>
            <div className="text-[10px] text-purple-600 mt-1">حضر ولم يوقع انصراف</div>
          </div>

          <div
            onClick={() => onNavigate('leaves')}
            className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
          >
            <div className="text-[11px] text-blue-700 font-bold">إجازات اليوم</div>
            <div className="text-xl font-black text-blue-600 mt-1">{todayLeavesCount}</div>
            <div className="text-[10px] text-blue-600 mt-1">إجازات معتمدة</div>
          </div>
        </div>
      </div>

      {/* 3. قسم السلوك والجدول الدراسي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* السلوك والانضباط */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>متابعة الانضباط والسلوك</span>
            </div>
            <button
              onClick={() => onNavigate('behavior')}
              className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>سجل المخالفات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <div className="text-[11px] text-slate-500 font-bold">مخالفات اليوم</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{todayViolations.length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center">
              <div className="text-[11px] text-amber-700 font-bold">قيد المراجعة</div>
              <div className="text-lg font-extrabold text-amber-800 mt-0.5">{pendingReviewViolations.length}</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-center">
              <div className="text-[11px] text-rose-700 font-bold">مخالفات جسيمة</div>
              <div className="text-lg font-extrabold text-rose-700 mt-0.5">{severeViolations.length}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-center">
              <div className="text-[11px] text-purple-700 font-bold">لم يخطر ولي أمره</div>
              <div className="text-lg font-extrabold text-purple-700 mt-0.5">{unnotifiedViolations.length}</div>
            </div>
          </div>
        </div>

        {/* الجدول الدراسي وتوثيق الدروس */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>الجدول الدراسي وتوثيق المادة العلمية</span>
            </div>
            <button
              onClick={() => onNavigate('teacher_portal')}
              className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>الجدول والدروس</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <div className="text-[11px] text-slate-500 font-bold">حصص اليوم</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{todayPeriods.length}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <div className="text-[11px] text-emerald-700 font-bold">تم توثيقها</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">{todayLessonsLogged.length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center">
              <div className="text-[11px] text-amber-700 font-bold">بدون توثيق</div>
              <div className="text-lg font-extrabold text-amber-800 mt-0.5">{missingLessonsCount}</div>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-center">
              <div className="text-[11px] text-[#008e8b] font-bold">نسبة التوثيق</div>
              <div className="text-lg font-extrabold text-[#008e8b] mt-0.5">{lessonCoverageRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. قسم الرواتب والأجور (ADMIN ONLY) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                مسير رواتب شهر ({currentMonth}/{currentYear}) — صلاحية حصرية للمدير
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                حالة المسير: {payrollStatus === 'Approved' ? 'معتمد' : payrollStatus === 'Locked' ? 'مغلق' : 'مسودة'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              يتم احتساب البدلات، المكافآت، وخصومات الغياب والتأخيرات تلقائياً من بيانات الحضور والانصراف
            </p>
          </div>

          <button
            onClick={() => onNavigate('payroll')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>فتح محرك مسير الرواتب</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-700/60 relative z-10">
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
            <div className="text-[11px] text-slate-400 font-bold">إجمالي المستحقات (Gross)</div>
            <div className="text-lg font-black text-emerald-400 mt-1">{formatEgyptianCurrency(totalGrossPayroll)}</div>
            <div className="text-[10px] text-slate-400 mt-1">الأساسي + البدلات والحوافز</div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
            <div className="text-[11px] text-slate-400 font-bold">إجمالي الاستقطاعات</div>
            <div className="text-lg font-black text-rose-400 mt-1">{formatEgyptianCurrency(totalDeductionsPayroll)}</div>
            <div className="text-[10px] text-slate-400 mt-1">غياب + تأخير + تأمينات</div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
            <div className="text-[11px] text-slate-400 font-bold">صافي الرواتب المستحقة (Net)</div>
            <div className="text-lg font-black text-cyan-300 mt-1">{formatEgyptianCurrency(totalNetPayroll)}</div>
            <div className="text-[10px] text-slate-400 mt-1">المبلغ القابل للصرف</div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
            <div className="text-[11px] text-slate-400 font-bold">موظفون بانتظار الاحتساب</div>
            <div className="text-lg font-black text-amber-400 mt-1">{uncalculatedPayrollCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">من أصل {activeEmployees.length} موظف</div>
          </div>
        </div>
      </div>
    </div>
  );
};
