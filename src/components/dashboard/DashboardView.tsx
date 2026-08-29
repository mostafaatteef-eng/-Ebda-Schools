import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ClockAlert,
  Download,
  FileText,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRecord, SystemSettings, User } from '../../types';
import {
  calculateAttendanceMetrics,
  determineAttendanceStatus,
  formatDateKey,
  formatMinutesToHuman,
  getArabicDayName,
  getArabicFullDate,
  getCurrentTimeString
} from '../../utils/attendanceUtils';
import { storageService } from '../../services/storageService';

interface DashboardViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  onNavigate?: (tab: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
  onNavigate,
  onNavigateToTab
}) => {
  const todayKey = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [quickEmpId, setQuickEmpId] = useState<string>(employees[0]?.id || '');
  const [quickCheckIn, setQuickCheckIn] = useState<string>(getCurrentTimeString());
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleNavigate = (tab: string) => {
    if (onNavigate) onNavigate(tab);
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);
  const totalEmployeesCount = activeEmployees.length;

  // Filter records for the selected date (defaults to today)
  const dayRecords = useMemo(() => attendance.filter(a => a.date === selectedDate), [attendance, selectedDate]);
  const recordedCount = dayRecords.length;
  const unrecordedCount = Math.max(0, totalEmployeesCount - recordedCount);

  // Present, Late, Absent, Leave, Permission counts
  const presentCount = dayRecords.filter(r => r.status === 'حاضر').length;
  const lateCount = dayRecords.filter(r => r.status === 'متأخر').length;
  const totalLateMinutes = dayRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
  const absentCount = dayRecords.filter(r => r.status === 'غائب').length;
  const permissionCount = dayRecords.filter(r => r.status === 'مأذونية' || r.status === 'إذن عمل').length;
  const leaveCount = dayRecords.filter(r => r.status === 'إجازة').length;

  // Percentage
  const attendanceRate = totalEmployeesCount > 0 ? Math.round(((presentCount + lateCount) / totalEmployeesCount) * 100) : 0;
  const completionPercentage = totalEmployeesCount > 0 ? Math.round((recordedCount / totalEmployeesCount) * 100) : 0;

  // Department Distribution
  const departments = useMemo(() => Array.from(new Set(activeEmployees.map(e => e.department))), [activeEmployees]);
  const deptStats = useMemo(() => {
    return departments.map(dept => {
      const deptEmps = activeEmployees.filter(e => e.department === dept);
      const deptRecords = dayRecords.filter(r => deptEmps.some(e => e.id === r.employeeId));
      const deptPresent = deptRecords.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
      const rate = deptEmps.length > 0 ? Math.round((deptPresent / deptEmps.length) * 100) : 0;
      return {
        name: dept,
        total: deptEmps.length,
        present: deptPresent,
        rate
      };
    });
  }, [departments, activeEmployees, dayRecords]);

  // Handle Quick Attendance Punch from Dashboard
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === quickEmpId);
    if (!emp) return;

    storageService.quickCheckIn(emp.id, selectedDate, quickCheckIn, undefined, quickNotes);
    setShowSuccessToast(true);
    setQuickNotes('');
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Recent 6 records
  const recentRecords = useMemo(() => {
    return [...dayRecords]
      .sort((a, b) => (b.checkIn || '').localeCompare(a.checkIn || ''))
      .slice(0, 5)
      .map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return { ...r, employee: emp };
      });
  }, [dayRecords, employees]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'مسؤول النظام';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Apple-Inspired Greeting & Date Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              صباح الخير، {userName} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {getArabicFullDate(selectedDate)} • المتابعة المباشرة للحضور والإنصراف اليومي
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <input
              id="dashboard-date-filter"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-bold bg-transparent px-2 py-1 text-slate-800 focus:outline-hidden font-mono"
            />
            {selectedDate !== todayKey && (
              <button
                id="btn-today-date"
                onClick={() => setSelectedDate(todayKey)}
                className="text-[11px] font-bold px-2.5 py-1 bg-teal-50 text-[#008e8b] hover:bg-teal-100 rounded-lg transition"
              >
                اليوم
              </button>
            )}
          </div>

          <button
            onClick={() => handleNavigate('daily_attendance')}
            className="text-xs font-bold px-4 py-2.5 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>شاشة الحضور السريع</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Production Empty State if no employees registered yet */}
      {totalEmployeesCount === 0 && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#008e8b]/10 border border-[#008e8b]/20 rounded-3xl flex items-center justify-center mx-auto text-[#008e8b]">
            <Users className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              مرحباً بك في النظام الفعلي للحضور والموارد البشرية
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              النظام الآن في وضع التشغيل الفعلي (Production Mode) وخالٍ من أي بيانات تجريبية. ابدأ بإضافة موظفيك وتسجيل الحضور اليومي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleNavigate('employees')}
              className="p-4 bg-slate-50 hover:bg-[#008e8b]/5 border border-slate-200 hover:border-[#008e8b]/30 rounded-2xl text-right transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#008e8b] mb-2 group-hover:scale-105 transition-transform">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">إضافة موظف جديد</div>
              <div className="text-[11px] text-slate-500 mt-0.5">تسجيل موظف جديد وتحديد مواعيد عمله</div>
            </button>

            <button
              onClick={() => handleNavigate('daily_attendance')}
              className="p-4 bg-slate-50 hover:bg-[#008e8b]/5 border border-slate-200 hover:border-[#008e8b]/30 rounded-2xl text-right transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#008e8b] mb-2 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">تسجيل الحضور اليومي</div>
              <div className="text-[11px] text-slate-500 mt-0.5">تسجيل بصمات الحضور والانصراف السريعة</div>
            </button>
          </div>
        </div>
      )}

      {/* 2. Key Metrics Row (Apple-Style Calm Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Employees */}
        <div
          onClick={() => handleNavigate('employees')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008e8b]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الموظفين</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-[#008e8b] transition-colors" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {totalEmployeesCount}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1.5 flex items-center gap-1">
            <span>{activeEmployees.length} موظف نشط</span>
          </div>
        </div>

        {/* Present */}
        <div
          onClick={() => handleNavigate('daily_attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">حاضر في الموعد</span>
            <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {presentCount}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1.5">
            نسبة الالتزام: {attendanceRate}%
          </div>
        </div>

        {/* Late */}
        <div
          onClick={() => handleNavigate('daily_attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">حالات التأخير</span>
            <ClockAlert className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
            {lateCount}
          </div>
          <div className="text-[11px] font-semibold text-amber-700 mt-1.5 truncate">
            {totalLateMinutes > 0 ? formatMinutesToHuman(totalLateMinutes) : 'لا يوجد تأخير'}
          </div>
        </div>

        {/* Absent */}
        <div
          onClick={() => handleNavigate('daily_attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">غياب اليوم</span>
            <UserX className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono tracking-tight">
            {absentCount}
          </div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1.5">
            {unrecordedCount > 0 ? `+ ${unrecordedCount} لم يسجل` : 'تم حصر الجميع'}
          </div>
        </div>

        {/* Leaves */}
        <div
          onClick={() => handleNavigate('leaves')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">إجازات رسمية</span>
            <Calendar className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono tracking-tight">
            {leaveCount}
          </div>
          <div className="text-[11px] font-semibold text-purple-700 mt-1.5">
            إجازات معتمدة
          </div>
        </div>

        {/* Permissions */}
        <div
          onClick={() => handleNavigate('leaves')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">أذونات ومهمات</span>
            <Clock className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 font-mono tracking-tight">
            {permissionCount}
          </div>
          <div className="text-[11px] font-semibold text-sky-700 mt-1.5">
            مأذونيات عمل
          </div>
        </div>
      </div>

      {/* 3. Daily Completion Progress Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#008e8b]"></div>
            <span className="text-xs font-bold text-slate-800">
              نسبة اكتمال تسجيل حضور الموظفين اليوم:
            </span>
            <span className="text-xs font-black text-[#008e8b] font-mono">
              {recordedCount} من أصل {totalEmployeesCount} موظف ({completionPercentage}%)
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            المتبقي للحصر: <strong className="text-slate-800">{unrecordedCount} موظف</strong>
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${totalEmployeesCount > 0 ? (presentCount / totalEmployeesCount) * 100 : 0}%` }}
            title={`حاضر: ${presentCount}`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${totalEmployeesCount > 0 ? (lateCount / totalEmployeesCount) * 100 : 0}%` }}
            title={`متأخر: ${lateCount}`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${totalEmployeesCount > 0 ? (absentCount / totalEmployeesCount) * 100 : 0}%` }}
            title={`غائب: ${absentCount}`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-500"
            style={{ width: `${totalEmployeesCount > 0 ? (leaveCount / totalEmployeesCount) * 100 : 0}%` }}
            title={`إجازة: ${leaveCount}`}
          />
          <div
            className="bg-sky-500 h-full transition-all duration-500"
            style={{ width: `${totalEmployeesCount > 0 ? (permissionCount / totalEmployeesCount) * 100 : 0}%` }}
            title={`إذن: ${permissionCount}`}
          />
        </div>
      </div>

      {/* 4. Main Two-Column Grid: Quick Punch & Department Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Punch Form (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#008e8b]" />
                تسجيل حضور سريع لموظف
              </h3>
              <span className="text-[11px] font-bold text-slate-400 font-mono">{selectedDate}</span>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر الموظف:</label>
                <select
                  id="quick-emp-select"
                  value={quickEmpId}
                  onChange={e => setQuickEmpId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">وقت الحضور:</label>
                <input
                  id="quick-checkin-input"
                  type="time"
                  value={quickCheckIn}
                  onChange={e => setQuickCheckIn(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات إضافية:</label>
                <input
                  id="quick-notes-input"
                  type="text"
                  value={quickNotes}
                  onChange={e => setQuickNotes(e.target.value)}
                  placeholder="مثال: حضور بمهمة خارجية..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                />
              </div>

              <button
                id="btn-quick-attendance-submit"
                type="submit"
                className="w-full bg-[#008e8b] hover:bg-[#007775] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                حفظ وتسجيل الحضور الآن
              </button>

              {showSuccessToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center animate-in fade-in duration-150">
                  ✓ تم حفظ وتسجيل حركة الحضور بنجاح!
                </div>
              )}
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => handleNavigate('daily_attendance')}
              className="w-full text-center text-xs font-bold text-[#008e8b] hover:text-[#007775] transition"
            >
              الانتقال إلى شاشة الحضور اليومي الكاملة ➔
            </button>
          </div>
        </div>

        {/* Department Compliance Rates (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                نسبة التزام الأقسام بالدوام اليومي
              </h3>
              <span className="text-xs text-slate-400 font-semibold">إجمالي {departments.length} أقسام</span>
            </div>

            <div className="space-y-4">
              {deptStats.map(dept => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dept.name}</span>
                    <span className="font-semibold text-slate-500 font-mono">
                      {dept.present} من {dept.total} موظف ({dept.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dept.rate >= 90
                          ? 'bg-emerald-500'
                          : dept.rate >= 70
                          ? 'bg-[#008e8b]'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleNavigate('daily_attendance')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right transition"
            >
              <div className="text-[11px] font-bold text-slate-700">تسجيل جماعي</div>
              <div className="text-[10px] text-slate-400">حضور كامل القسم بنقرة واحدة</div>
            </button>
            <button
              onClick={() => handleNavigate('leaves')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right transition"
            >
              <div className="text-[11px] font-bold text-slate-700">الأذونات والإجازات</div>
              <div className="text-[10px] text-slate-400">إضافة ومراجعة الطلبات</div>
            </button>
            <button
              onClick={() => handleNavigate('reports')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right transition"
            >
              <div className="text-[11px] font-bold text-slate-700">التقارير المجمعة</div>
              <div className="text-[10px] text-slate-400">تصدير إكسيل وتفاصيل شهرية</div>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Live Activity Feed of Today */}
      {recentRecords.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#008e8b]" />
              آخر حركات الحضور المسجلة اليوم
            </h3>
            <button
              onClick={() => handleNavigate('daily_attendance')}
              className="text-xs font-bold text-[#008e8b] hover:underline"
            >
              عرض السجل كاملاً
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRecords.map(rec => {
              const empName = rec.employee?.name || rec.employeeId;
              const empDept = rec.employee?.department || 'عام';
              const initial = empName.charAt(0);

              let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (rec.status === 'متأخر') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              if (rec.status === 'غائب') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
              if (rec.status === 'إجازة') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
              if (rec.status === 'مأذونية' || rec.status === 'إذن عمل') badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';

              return (
                <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {initial}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{empName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{empDept} • {rec.employeeId}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {rec.checkIn && (
                      <span className="font-mono font-bold text-slate-600">
                        {rec.checkIn} {rec.checkOut ? `← ${rec.checkOut}` : ''}
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badgeStyle}`}>
                      {rec.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
