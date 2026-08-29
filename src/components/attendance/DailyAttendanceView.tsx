import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  Filter,
  Info,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X
} from 'lucide-react';
import {
  AbsenceReasonCategory,
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  LeaveRecord,
  LeaveType,
  SystemSettings,
  User
} from '../../types';
import {
  calculateAttendanceMetrics,
  determineAttendanceStatus,
  formatDateKey,
  formatMinutesToHuman,
  getArabicDayName,
  getArabicFullDate,
  getCurrentTimeString,
  isWeekend
} from '../../utils/attendanceUtils';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import {
  FastAbsenceModal,
  FastEditModal,
  FastLeaveModal,
  FastPermissionModal
} from './FastModals';

interface DailyAttendanceViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  onNavigateToTab?: (tab: any) => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
  onNavigateToTab
}) => {
  const todayKey = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('الكل');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Modals state
  const [absenceModalEmp, setAbsenceModalEmp] = useState<Employee | null>(null);
  const [permissionModalEmp, setPermissionModalEmp] = useState<Employee | null>(null);
  const [leaveModalEmp, setLeaveModalEmp] = useState<Employee | null>(null);
  const [editModalRecord, setEditModalRecord] = useState<AttendanceRecord | null>(null);

  // Quick Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'HR' || currentUser?.role === 'Supervisor';

  const isToday = selectedDate === todayKey;
  const isSelectedDateWeekend = isWeekend(selectedDate, settings.weekendDays);

  // Active employees
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Active');
  }, [employees]);

  // Attendance records for the selected date mapped by employeeId
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.filter(a => a.date === selectedDate).forEach(a => {
      map.set(a.employeeId, a);
    });
    return map;
  }, [attendance, selectedDate]);

  // Departments List
  const departments = useMemo(() => {
    return ['الكل', ...Array.from(new Set(activeEmployees.map(e => e.department)))];
  }, [activeEmployees]);

  // Metrics for selected date
  const totalActiveCount = activeEmployees.length;
  const currentDayRecords = useMemo(() => attendance.filter(a => a.date === selectedDate), [attendance, selectedDate]);
  const recordedCount = currentDayRecords.length;
  const unrecordedCount = Math.max(0, totalActiveCount - recordedCount);

  const presentCount = currentDayRecords.filter(r => r.status === 'حاضر').length;
  const lateCount = currentDayRecords.filter(r => r.status === 'متأخر').length;
  const absentCount = currentDayRecords.filter(r => r.status === 'غائب').length;
  const permissionCount = currentDayRecords.filter(r => r.status === 'مأذونية' || r.status === 'إذن عمل').length;
  const leaveCount = currentDayRecords.filter(r => r.status === 'إجازة').length;
  const dayOffCount = currentDayRecords.filter(r => r.status === 'راحة').length;

  const completionPercentage = totalActiveCount > 0 ? Math.round((recordedCount / totalActiveCount) * 100) : 0;

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      // Dept filter
      if (deptFilter !== 'الكل' && emp.department !== deptFilter) return false;

      // Search query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = (emp.name || '').toLowerCase().includes(q);
        const matchesId = (emp.id || '').toLowerCase().includes(q);
        const matchesDept = (emp.department || '').toLowerCase().includes(q);
        const matchesTitle = (emp.jobTitle || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesTitle) return false;
      }

      // Status filter
      const record = attendanceMap.get(emp.id);
      if (statusFilter === 'الكل') return true;
      if (statusFilter === 'لم يسجل') return !record;
      if (!record) return false;
      if (statusFilter === 'مأذونية') return record.status === 'مأذونية' || record.status === 'إذن عمل';
      return record.status === statusFilter;
    });
  }, [activeEmployees, deptFilter, searchQuery, statusFilter, attendanceMap]);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateKey(d));
    setSelectedEmpIds([]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateKey(d));
    setSelectedEmpIds([]);
  };

  const handleSetToday = () => {
    setSelectedDate(todayKey);
    setSelectedEmpIds([]);
  };

  // Selection handlers
  const handleSelectAllVisible = () => {
    if (selectedEmpIds.length === filteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleToggleSelectEmp = (empId: string) => {
    setSelectedEmpIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // 1-Click Actions for an Employee
  const handleQuickCheckIn = (emp: Employee) => {
    if (!canEdit) return;
    const nowTime = getCurrentTimeString();
    const startTime = emp.workStartTime || settings.officialStartTime;
    const checkInTime = isToday ? nowTime : startTime;

    const res = storageService.quickCheckIn(emp.id, selectedDate, checkInTime);
    if (res.record.status === 'متأخر') {
      showToast(`تم تسجيل حضور متأخر للموظف ${emp.name} (${res.record.lateMinutes} دقيقة تأخير)`);
    } else {
      showToast(`تم تسجيل حضور ${emp.name} في الموعد (${checkInTime})`);
    }
  };

  const handleQuickLate = (emp: Employee) => {
    if (!canEdit) return;
    const nowTime = getCurrentTimeString();
    const res = storageService.quickCheckIn(emp.id, selectedDate, nowTime, 'متأخر');
    showToast(`تم تسجيل تأخير للموظف ${emp.name} (${res.record.lateMinutes || 15} دقيقة)`);
  };

  const handleQuickCheckOut = (emp: Employee) => {
    if (!canEdit) return;
    const nowTime = getCurrentTimeString();
    const endTime = emp.workEndTime || settings.officialEndTime;
    const checkOutTime = isToday ? nowTime : endTime;

    const res = storageService.quickCheckOut(emp.id, selectedDate, checkOutTime);
    if (res.success && res.record) {
      showToast(`تم تسجيل انصراف ${emp.name} الساعة ${checkOutTime} (ساعات العمل: ${res.record.workingHours} س)`);
    }
  };

  const handleQuickDayOff = (emp: Employee) => {
    if (!canEdit) return;
    storageService.quickMarkDayOff(emp.id, selectedDate, isSelectedDateWeekend ? 'عطلة أسبوعية' : 'راحة مصرحة');
    showToast(`تم تسجيل راحة للموظف ${emp.name}`);
  };

  const handleDeleteRecord = (emp: Employee) => {
    if (!canEdit) return;
    const rec = attendanceMap.get(emp.id);
    if (rec) {
      storageService.deleteAttendanceRecord(rec.id);
      showToast(`تم حذف سجل حضور ${emp.name}`);
    }
  };

  // Bulk Actions
  const handleBulkPresent = (targets?: string[]) => {
    if (!canEdit) return;
    const empIdsToProcess = targets || (selectedEmpIds.length > 0 ? selectedEmpIds : filteredEmployees.filter(e => !attendanceMap.has(e.id)).map(e => e.id));
    if (empIdsToProcess.length === 0) {
      showToast('لا يوجد موظفون لتسجيل حضورهم');
      return;
    }
    const res = storageService.bulkMarkAttendance(empIdsToProcess, selectedDate, 'حاضر');
    setSelectedEmpIds([]);
    showToast(`تم تسجيل حضور جماعي لـ ${res.count} موظف بنجاح`);
  };

  const handleBulkAbsent = (targets?: string[]) => {
    if (!canEdit) return;
    const empIdsToProcess = targets || (selectedEmpIds.length > 0 ? selectedEmpIds : filteredEmployees.filter(e => !attendanceMap.has(e.id)).map(e => e.id));
    if (empIdsToProcess.length === 0) {
      showToast('لا يوجد موظفون لتسجيل غيابهم');
      return;
    }
    const res = storageService.bulkMarkAttendance(empIdsToProcess, selectedDate, 'غائب');
    setSelectedEmpIds([]);
    showToast(`تم تسجيل غياب جماعي لـ ${res.count} موظف بنجاح`);
  };

  const handleBulkCheckOut = () => {
    if (!canEdit) return;
    const targetEmps = activeEmployees.filter(emp => {
      const rec = attendanceMap.get(emp.id);
      return rec && (rec.status === 'حاضر' || rec.status === 'متأخر' || rec.status === 'مأذونية') && !rec.checkOut;
    });

    if (targetEmps.length === 0) {
      showToast('جميع الموظفين الحاضرين مسجل لهم انصراف بالفعل');
      return;
    }

    const res = storageService.bulkCheckOut(targetEmps.map(e => e.id), selectedDate);
    showToast(`تم تسجيل انصراف جماعي لـ ${res.count} موظف بنجاح`);
  };

  // Save Modals
  const handleSaveAbsence = (empId: string, date: string, category: AbsenceReasonCategory, reason: string) => {
    storageService.quickMarkAbsent(empId, date, category, reason);
    const emp = activeEmployees.find(e => e.id === empId);
    showToast(`تم تسجيل غياب (${category}) للموظف ${emp?.name || empId}`);
  };

  const handleSavePermission = (empId: string, date: string, permData: { type: string; from: string; to: string; reason?: string }) => {
    storageService.quickMarkPermission(empId, date, permData);
    const emp = activeEmployees.find(e => e.id === empId);
    showToast(`تم تسجيل إذن (${permData.type}) للموظف ${emp?.name || empId}`);
  };

  const handleSaveLeave = (empId: string, startDate: string, endDate: string, leaveType: LeaveType, reason: string) => {
    storageService.quickMarkLeave(empId, startDate, endDate, leaveType, reason);
    const emp = activeEmployees.find(e => e.id === empId);
    showToast(`تم تسجيل إجازة ${leaveType} للموظف ${emp?.name || empId}`);
  };

  const handleSaveEditRecord = (updatedRecord: AttendanceRecord) => {
    storageService.saveAttendanceRecord(updatedRecord);
    showToast(`تم حفظ تعديل سجل الموظف ${updatedRecord.employeeName}`);
  };

  // Export Daily Attendance to Excel/CSV
  const handleExportDaily = () => {
    const exportData = activeEmployees.map(emp => {
      const rec = attendanceMap.get(emp.id);
      return {
        'الرقم الوظيفي': emp.id,
        'اسم الموظف': emp.name,
        'القسم': emp.department,
        'المسمى الوظيفي': emp.jobTitle,
        'التاريخ': selectedDate,
        'اليوم': getArabicDayName(selectedDate),
        'الحالة': rec?.status || 'لم يسجل',
        'وقت الحضور': rec?.checkIn || '-',
        'وقت الانصراف': rec?.checkOut || '-',
        'ساعات العمل': rec?.workingHours || 0,
        'دقائق التأخير': rec?.lateMinutes || 0,
        'انصراف مبكر (دقيقة)': rec?.earlyLeaveMinutes || 0,
        'ساعات إضافية': rec?.overtimeHours || 0,
        'نوع الإذن / الإجازة': rec?.permissionType || rec?.leaveType || '-',
        'سبب الغياب / الإذن': rec?.reason || rec?.absenceReasonCategory || '-',
        'ملاحظات': rec?.notes || '-',
        'سجل بواسطة': rec?.createdBy || '-'
      };
    });

    ExportService.exportToExcel(exportData, `سجل_الحضور_اليومي_${selectedDate}`);
    showToast('تم تصدير كشف الحضور اليومي بنجاح');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Live Date Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              تسجيل الحضور اليومي
            </h1>
            {isToday ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                اليوم (مباشر)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                تاريخ مخصص
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {getArabicFullDate(selectedDate)}
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              title="اليوم السابق"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-[#008e8b] rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSetToday}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                isToday ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم
            </button>

            <button
              onClick={handleNextDay}
              title="اليوم التالي"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-[#008e8b] rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Native Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setSelectedEmpIds([]);
                }
              }}
              className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportDaily}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
            title="تصدير كشف الحضور اليومي إلى Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Weekend Banner Notice */}
      {isSelectedDateWeekend && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <Moon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>هذا اليوم ({getArabicDayName(selectedDate)}) عطلة راحة أسبوعية.</span>
          </div>
          <button
            onClick={() => handleBulkPresent()}
            className="font-bold text-[#008e8b] hover:underline text-xs"
          >
            + تسجيل حضور استثنائي / إضافي
          </button>
        </div>
      )}

      {/* 2. Completion Progress & Interactive Counter Pills */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">مؤشر التسجيل:</span>
            <span className="text-xs font-extrabold text-[#008e8b] font-mono">
              {recordedCount} من أصل {totalActiveCount} موظف ({completionPercentage}%)
            </span>
          </div>
          {unrecordedCount > 0 && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              المتبقي: {unrecordedCount} موظف
            </span>
          )}
        </div>

        {/* Multi-color Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (presentCount / totalActiveCount) * 100 : 0}%` }}
            title={`حاضر: ${presentCount}`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (lateCount / totalActiveCount) * 100 : 0}%` }}
            title={`متأخر: ${lateCount}`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (absentCount / totalActiveCount) * 100 : 0}%` }}
            title={`غائب: ${absentCount}`}
          />
          <div
            className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (permissionCount / totalActiveCount) * 100 : 0}%` }}
            title={`مأذونية: ${permissionCount}`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (leaveCount / totalActiveCount) * 100 : 0}%` }}
            title={`إجازة: ${leaveCount}`}
          />
          <div
            className="bg-slate-400 h-full transition-all duration-300"
            style={{ width: `${totalActiveCount > 0 ? (dayOffCount / totalActiveCount) * 100 : 0}%` }}
            title={`راحة: ${dayOffCount}`}
          />
        </div>

        {/* Clickable Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <button
            onClick={() => setStatusFilter('الكل')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition shrink-0 ${
              statusFilter === 'الكل'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            الكل ({totalActiveCount})
          </button>

          <button
            onClick={() => setStatusFilter('لم يسجل')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'لم يسجل'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : unrecordedCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 font-extrabold'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            لم يسجل ({unrecordedCount})
          </button>

          <button
            onClick={() => setStatusFilter('حاضر')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'حاضر'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            حاضر ({presentCount})
          </button>

          <button
            onClick={() => setStatusFilter('متأخر')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'متأخر'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            متأخر ({lateCount})
          </button>

          <button
            onClick={() => setStatusFilter('غائب')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'غائب'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            غائب ({absentCount})
          </button>

          <button
            onClick={() => setStatusFilter('مأذونية')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'مأذونية'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            مأذونية ({permissionCount})
          </button>

          <button
            onClick={() => setStatusFilter('إجازة')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'إجازة'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            إجازة ({leaveCount})
          </button>

          <button
            onClick={() => setStatusFilter('راحة')}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'راحة'
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            راحة ({dayOffCount})
          </button>
        </div>
      </div>

      {/* 3. Bulk Quick Actions Toolbar & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Fast Bulk Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkPresent()}
              disabled={!canEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
              title="تسجيل حضور لجميع غير المسجلين بنقرة واحدة"
            >
              <CheckCheck className="w-4 h-4" />
              <span>تحديد الكل → حاضر</span>
            </button>

            <button
              onClick={() => handleBulkAbsent()}
              disabled={!canEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
              title="تسجيل غياب لجميع غير المسجلين بنقرة واحدة"
            >
              <UserX className="w-4 h-4" />
              <span>تحديد الكل → غائب</span>
            </button>

            <button
              onClick={handleBulkCheckOut}
              disabled={!canEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition"
              title="تسجيل انصراف جماعي لجميع الحاضرين"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل انصراف للجميع</span>
            </button>
          </div>

          {/* Search & Dept Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative shrink-0 w-36 sm:w-44">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d}>
                    {d === 'الكل' ? '🏢 كل الأقسام' : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الرقم، أو المسمى..."
                className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Rows Multi-Action Bar */}
        {selectedEmpIds.length > 0 && (
          <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-teal-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold">تم تحديد {selectedEmpIds.length} موظف:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkPresent(selectedEmpIds)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition"
              >
                تسجيل كـ حاضر
              </button>
              <button
                onClick={() => handleBulkAbsent(selectedEmpIds)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition"
              >
                تسجيل كـ غائب
              </button>
              <button
                onClick={() => setSelectedEmpIds([])}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold transition"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Unified Employee Attendance Hybrid List / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0}
              onChange={handleSelectAllVisible}
              className="w-4 h-4 rounded-sm border-slate-300 text-[#008e8b] focus:ring-[#008e8b] cursor-pointer"
            />
            <span>الموظف وبيانات الدوام</span>
          </div>
          <span>حالة اليوم والإجراءات الفورية</span>
        </div>

        {/* Employee Rows List */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">لا يوجد موظفون يطابقون خيارات البحث أو الفلتر</p>
            <p className="text-xs text-slate-400 mt-1">جرّب تغيير التاريخ أو تفريغ حقل البحث</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEmployees.map(emp => {
              const record = attendanceMap.get(emp.id);
              const isRecorded = !!record;
              const isSelected = selectedEmpIds.includes(emp.id);
              const isExpanded = expandedEmpId === emp.id;
              const canCheckOut = record && (record.status === 'حاضر' || record.status === 'متأخر' || record.status === 'مأذونية') && !record.checkOut;

              let statusColor = 'bg-slate-50 text-slate-700 border-slate-200';
              let dotColor = 'bg-slate-400';

              if (record) {
                if (record.status === 'حاضر') {
                  statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  dotColor = 'bg-emerald-500';
                } else if (record.status === 'متأخر') {
                  statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  dotColor = 'bg-amber-500';
                } else if (record.status === 'غائب') {
                  statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
                  dotColor = 'bg-rose-500';
                } else if (record.status === 'مأذونية' || record.status === 'إذن عمل') {
                  statusColor = 'bg-sky-50 text-sky-800 border-sky-200';
                  dotColor = 'bg-sky-500';
                } else if (record.status === 'إجازة') {
                  statusColor = 'bg-purple-50 text-purple-800 border-purple-200';
                  dotColor = 'bg-purple-500';
                } else if (record.status === 'راحة') {
                  statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  dotColor = 'bg-slate-400';
                }
              }

              return (
                <div
                  key={emp.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-teal-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Employee Identity */}
                    <div className="flex items-start sm:items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectEmp(emp.id)}
                        className="w-4 h-4 mt-1 sm:mt-0 rounded-sm border-slate-300 text-[#008e8b] focus:ring-[#008e8b] cursor-pointer"
                      />

                      {/* Initials Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200/80">
                        {emp.name.slice(0, 2)}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-semibold">
                            {emp.id}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                            {emp.department}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{emp.jobTitle}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 font-semibold" title="مواعيد العمل">
                            🕒 {emp.workStartTime || settings.officialStartTime} - {emp.workEndTime || settings.officialEndTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Status Area */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* IF NOT RECORDED YET -> 1-CLICK ACTION BUTTONS */}
                      {!isRecorded ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 1-Click Present */}
                          <button
                            onClick={() => handleQuickCheckIn(emp)}
                            disabled={!canEdit}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                            title="تسجيل حضور بنقرة واحدة"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>حاضر</span>
                          </button>

                          {/* 1-Click Late */}
                          <button
                            onClick={() => handleQuickLate(emp)}
                            disabled={!canEdit}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="تسجيل حضور متأخر"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>متأخر</span>
                          </button>

                          {/* 1-Click Absent (Popup) */}
                          <button
                            onClick={() => setAbsenceModalEmp(emp)}
                            disabled={!canEdit}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="تسجيل غياب مع تحديد السبب"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>غائب</span>
                          </button>

                          {/* 1-Click Permission (Popup) */}
                          <button
                            onClick={() => setPermissionModalEmp(emp)}
                            disabled={!canEdit}
                            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition"
                            title="تسجيل إذن أو مأذونية"
                          >
                            <span>إذن</span>
                          </button>

                          {/* 1-Click Leave (Popup) */}
                          <button
                            onClick={() => setLeaveModalEmp(emp)}
                            disabled={!canEdit}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition"
                            title="تسجيل إجازة"
                          >
                            <span>إجازة</span>
                          </button>

                          {/* 1-Click Day Off */}
                          <button
                            onClick={() => handleQuickDayOff(emp)}
                            disabled={!canEdit}
                            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-xs font-bold transition"
                            title="تسجيل راحة"
                          >
                            <Moon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* IF ALREADY RECORDED -> SHOW STATUS PILL & QUICK CHECKOUT / EDIT */
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Pill */}
                          <div
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${statusColor}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span>{record.status}</span>

                            {record.status === 'حاضر' && record.checkIn && (
                              <span className="font-mono text-[11px] opacity-90">({record.checkIn})</span>
                            )}

                            {record.status === 'متأخر' && (
                              <span className="font-mono text-[11px] opacity-90">
                                ({record.checkIn} - {formatMinutesToHuman(record.lateMinutes)})
                              </span>
                            )}

                            {record.status === 'غائب' && record.absenceReasonCategory && (
                              <span className="text-[11px] opacity-90">({record.absenceReasonCategory})</span>
                            )}

                            {(record.status === 'مأذونية' || record.status === 'إذن عمل') && record.permissionFrom && (
                              <span className="font-mono text-[11px] opacity-90">
                                ({record.permissionFrom} ➔ {record.permissionTo})
                              </span>
                            )}

                            {record.status === 'إجازة' && record.leaveType && (
                              <span className="text-[11px] opacity-90">({record.leaveType})</span>
                            )}
                          </div>

                          {/* Check-Out / Hours */}
                          {canCheckOut ? (
                            <button
                              onClick={() => handleQuickCheckOut(emp)}
                              disabled={!canEdit}
                              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                              title="تسجيل انصراف الموظف"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>انصراف</span>
                            </button>
                          ) : record.checkOut ? (
                            <div className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 border border-slate-200">
                              <span>انصراف: {record.checkOut}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-[#008e8b] font-bold">{record.workingHours} س</span>
                            </div>
                          ) : null}

                          {/* Quick Edit */}
                          <button
                            onClick={() => setEditModalRecord(record)}
                            disabled={!canEdit}
                            className="p-2 text-slate-400 hover:text-[#008e8b] hover:bg-teal-50 rounded-xl transition"
                            title="تعديل السجل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Quick Delete */}
                          <button
                            onClick={() => handleDeleteRecord(emp)}
                            disabled={!canEdit}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="إعادة تعيين / حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Expand Details Trigger */}
                          <button
                            onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="عرض التفاصيل الإضافية"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progressive Disclosure: Expandable Detail Drawer */}
                  {isExpanded && record && (
                    <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-slate-400">التأخير: </span>
                          <strong className="text-slate-800">{record.lateMinutes ? `${record.lateMinutes} دقيقة` : 'لا يوجد'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">انصراف مبكر: </span>
                          <strong className="text-slate-800">{record.earlyLeaveMinutes ? `${record.earlyLeaveMinutes} دقيقة` : 'لا يوجد'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">إضافي: </span>
                          <strong className="text-slate-800">{record.overtimeHours ? `${record.overtimeHours} ساعة` : 'لا يوجد'}</strong>
                        </div>
                        {record.notes && (
                          <div>
                            <span className="text-slate-400">ملاحظات: </span>
                            <span className="text-slate-800 font-medium">{record.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        سجل بواسطة: {record.createdBy || 'النظام'} • {record.updatedAt ? new Date(record.updatedAt).toLocaleTimeString('ar-EG') : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modals Area */}
      {absenceModalEmp && (
        <FastAbsenceModal
          isOpen={!!absenceModalEmp}
          onClose={() => setAbsenceModalEmp(null)}
          employee={absenceModalEmp}
          date={selectedDate}
          onSave={handleSaveAbsence}
        />
      )}

      {permissionModalEmp && (
        <FastPermissionModal
          isOpen={!!permissionModalEmp}
          onClose={() => setPermissionModalEmp(null)}
          employee={permissionModalEmp}
          date={selectedDate}
          onSave={handleSavePermission}
        />
      )}

      {leaveModalEmp && (
        <FastLeaveModal
          isOpen={!!leaveModalEmp}
          onClose={() => setLeaveModalEmp(null)}
          employee={leaveModalEmp}
          date={selectedDate}
          onSave={handleSaveLeave}
        />
      )}

      {editModalRecord && (
        <FastEditModal
          isOpen={!!editModalRecord}
          onClose={() => setEditModalRecord(null)}
          record={editModalRecord}
          settings={settings}
          onSave={handleSaveEditRecord}
        />
      )}
    </div>
  );
};
