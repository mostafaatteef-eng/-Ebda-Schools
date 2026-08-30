import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ClockAlert,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRecord, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface TeacherAffairsDashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const TeacherAffairsDashboard: React.FC<TeacherAffairsDashboardProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);
  const departments = settings.departments || [];

  const filteredEmployees = useMemo(() => {
    if (selectedDept === 'ALL') return activeEmployees;
    return activeEmployees.filter(e => e.department === selectedDept);
  }, [activeEmployees, selectedDept]);

  const todayRecords = useMemo(() => attendance.filter(r => r.date === selectedDate), [attendance, selectedDate]);

  // Metric counts
  const presentCount = todayRecords.filter(r => r.status === 'حاضر').length;
  const lateCount = todayRecords.filter(r => r.status === 'متأخر').length;
  const absentCount = todayRecords.filter(r => r.status === 'غائب').length;
  const noCheckoutCount = todayRecords.filter(r => r.checkIn && !r.checkOut).length;

  const todayLeaves = useMemo(() => {
    return leaves.filter(l => l.startDate <= selectedDate && l.endDate >= selectedDate && l.status === 'مقبولة');
  }, [leaves, selectedDate]);

  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => l.status === 'معلقة');
  }, [leaves]);

  // Late Staff List
  const lateStaffList = useMemo(() => {
    return todayRecords.filter(r => r.status === 'متأخر' && (r.lateMinutes || 0) > 0);
  }, [todayRecords]);

  // Missing Check-out List
  const missingCheckoutList = useMemo(() => {
    return todayRecords.filter(r => r.checkIn && !r.checkOut);
  }, [todayRecords]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'مسؤول شؤون المعلمين';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">لوحة تحكم شؤون المعلمين والعاملين</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                متابعة الحضور والانصراف والإجازات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مرحباً {currentUser?.fullName} — رصد الدوام اليومي للكادر التعليمي والإداري، التأخيرات، والغياب
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
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold">إجمالي الكادر النشط</div>
          <div className="text-xl font-black text-slate-900 mt-1">{activeEmployees.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">معلم وموظف</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] text-emerald-700 font-bold">حاضر في الموعد</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-600 mt-1">دوام منضبط</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <div className="text-[11px] text-amber-700 font-bold">تأخر صباحي</div>
          <div className="text-xl font-black text-amber-600 mt-1">{lateCount}</div>
          <div className="text-[10px] text-amber-600 mt-1">تأخير بالدقائق</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold">غائب اليوم</div>
          <div className="text-xl font-black text-rose-600 mt-1">{absentCount}</div>
          <div className="text-[10px] text-rose-600 mt-1">بدون إجازة رسمية</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <div className="text-[11px] text-purple-700 font-bold">لم يسجل انصراف</div>
          <div className="text-xl font-black text-purple-600 mt-1">{noCheckoutCount}</div>
          <div className="text-[10px] text-purple-600 mt-1">حاضر بدون وقت خروج</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <div className="text-[11px] text-blue-700 font-bold">إجازات اليوم</div>
          <div className="text-xl font-black text-blue-600 mt-1">{todayLeaves.length}</div>
          <div className="text-[10px] text-blue-600 mt-1">إجازات معتمدة</div>
        </div>
      </div>

      {/* Action Shortcuts */}
      <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
          <span>إجراءات دوام المعلمين:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('daily_attendance')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>تسجيل حضور / انصراف المعلمين</span>
          </button>

          <button
            onClick={() => onNavigate('employees', { action: 'new' })}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>إضافة معلم / موظف</span>
          </button>

          <button
            onClick={() => onNavigate('leaves')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>طلبات الإجازات ({pendingLeaves.length} معلقة)</span>
          </button>

          <button
            onClick={() => onNavigate('daily_attendance')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>تصدير كشف الدوام</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Late Staff & Missing Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Late Staff */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockAlert className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">قائمة المتأخرين اليوم ({lateStaffList.length})</h2>
            </div>
            <button
              onClick={() => onNavigate('daily_attendance')}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          {lateStaffList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              لا توجد حالات تأخير مسجلة اليوم حتى الآن.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lateStaffList.map(rec => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{rec.employeeName}</div>
                    <div className="text-[11px] text-slate-500">{rec.department} — {rec.jobTitle}</div>
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                      تأخر {rec.lateMinutes} دقيقة
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">وقت الدخول: {rec.checkIn}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Check-out */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">لم يسجلوا انصراف بعد ({missingCheckoutList.length})</h2>
            </div>
            <button
              onClick={() => onNavigate('daily_attendance')}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
            >
              تسجيل الانصراف
            </button>
          </div>

          {missingCheckoutList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              جميع الحاضرين اليوم قاموا بتسجيل وقت الانصراف.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missingCheckoutList.slice(0, 5).map(rec => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{rec.employeeName}</div>
                    <div className="text-[11px] text-slate-500">حضور: {rec.checkIn}</div>
                  </div>
                  <button
                    onClick={() => onNavigate('daily_attendance')}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    تسجيل انصراف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
