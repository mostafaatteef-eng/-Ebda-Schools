import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Layers,
  Search,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, Employee, LeaveRecord, MonthSummaryItem, SystemSettings, User } from '../../types';
import {
  ARABIC_MONTHS,
  deriveDynamicYears,
  formatDateKey,
  getBadgeColorForStatus,
  getDaysInMonth
} from '../../utils/attendanceUtils';
import { ExportService } from '../../services/exportService';
import { storageService } from '../../services/storageService';
import { getCairoCurrentDate } from '../../utils/egyptianTime';

interface MonthlyMatrixViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
}

export const MonthlyMatrixView: React.FC<MonthlyMatrixViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser
}) => {
  const todayKey = getCairoCurrentDate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [deptFilter, setDeptFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCellRecord, setSelectedCellRecord] = useState<AttendanceRecord | null>(null);

  // Derive dynamic years
  const years = useMemo(() => {
    return deriveDynamicYears(attendance, employees, settings);
  }, [attendance, employees, settings]);

  const departments = useMemo(() => {
    return ['الكل', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];
  }, [employees]);

  // Days list for the selected month
  const daysInSelectedMonth = useMemo(() => {
    const weekendDays = settings?.weekendDays || ['الجمعة', 'السبت'];
    return getDaysInMonth(selectedYear, selectedMonth, weekendDays);
  }, [selectedYear, selectedMonth, settings]);

  // Performance Optimization: Pre-index attendance records by `${employeeId}_${date}`
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach(rec => {
      if (rec.employeeId && rec.date) {
        map.set(`${rec.employeeId}_${rec.date}`, rec);
      }
    });
    return map;
  }, [attendance]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return employees.filter(emp => {
      const matchDept = deptFilter === 'الكل' || emp.department === deptFilter;
      const matchSearch =
        !q ||
        (emp.name || '').toLowerCase().includes(q) ||
        (emp.id || '').toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q) ||
        (emp.jobTitle || '').toLowerCase().includes(q);
      return emp.status === 'Active' && matchDept && matchSearch;
    });
  }, [employees, deptFilter, searchQuery]);

  // Compute Monthly Summary per Employee with accurate Attendance Rate
  const monthSummary = useMemo<MonthSummaryItem[]>(() => {
    return filteredEmployees.map(emp => {
      let presentDays = 0;
      let lateDays = 0;
      let totalLateMinutes = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let weekendDays = 0;
      let unrecordedDays = 0;
      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;
      let eligibleWorkDaysCount = 0;

      const empHireDate = emp.hireDate ? emp.hireDate.split('T')[0] : '';
      const empWeekends = emp.daysOff && emp.daysOff.length > 0 ? emp.daysOff : (settings.weekendDays || ['الجمعة', 'السبت']);

      daysInSelectedMonth.forEach(d => {
        const isFuture = d.dateStr > todayKey;
        const isBeforeHire = empHireDate ? d.dateStr < empHireDate : false;
        const isWknd = empWeekends.includes(d.dayName);

        const rec = attendanceMap.get(`${emp.id}_${d.dateStr}`);

        if (rec) {
          if (rec.status === 'حاضر') {
            presentDays++;
          } else if (rec.status === 'متأخر') {
            presentDays++;
            lateDays++;
            totalLateMinutes += rec.lateMinutes || 0;
          } else if (rec.status === 'غائب') {
            absentDays++;
          } else if (rec.status === 'إجازة') {
            leaveDays++;
          } else if (rec.status === 'عطلة أسبوعية' || rec.status === 'راحة') {
            weekendDays++;
          }

          totalWorkingHours += rec.workingHours || 0;
          totalOvertimeHours += rec.overtimeHours || 0;

          if (!isFuture && !isBeforeHire && !isWknd && rec.status !== 'إجازة' && rec.status !== 'عطلة أسبوعية') {
            eligibleWorkDaysCount++;
          }
        } else {
          if (isWknd) {
            weekendDays++;
          } else if (!isFuture && !isBeforeHire) {
            unrecordedDays++;
            eligibleWorkDaysCount++;
          }
        }
      });

      // Attendance Rate Formula: (Present Days + Late Days) / (Eligible Completed Workdays) * 100
      // Future dates or days before hire do not negatively impact the rate
      const rate = eligibleWorkDaysCount > 0
        ? Math.min(100, Math.round((presentDays / eligibleWorkDaysCount) * 100))
        : 100;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        totalDays: daysInSelectedMonth.length,
        presentDays,
        lateDays,
        totalLateMinutes,
        absentDays,
        leaveDays,
        weekendDays,
        totalWorkingHours: parseFloat(totalWorkingHours.toFixed(1)),
        totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(1)),
        attendanceRate: rate
      };
    });
  }, [filteredEmployees, daysInSelectedMonth, attendanceMap, todayKey, settings]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const getCellStatusDisplay = (
    rec: AttendanceRecord | undefined,
    dateStr: string,
    dayName: string,
    emp: Employee
  ) => {
    const isFuture = dateStr > todayKey;
    const isBeforeHire = emp.hireDate ? dateStr < emp.hireDate.split('T')[0] : false;
    const empWeekends = emp.daysOff && emp.daysOff.length > 0 ? emp.daysOff : (settings.weekendDays || ['الجمعة', 'السبت']);
    const isWknd = empWeekends.includes(dayName);

    if (isBeforeHire || isFuture) {
      return { symbol: '—', color: 'text-slate-300 bg-transparent', label: isFuture ? 'يوم قادم' : 'قبل التعيين' };
    }

    if (rec) {
      switch (rec.status) {
        case 'حاضر':
          return { symbol: 'ح', color: 'text-emerald-700 bg-emerald-100 font-bold', label: 'حاضر' };
        case 'متأخر':
          return { symbol: 'ت', color: 'text-amber-800 bg-amber-200 font-bold', label: `متأخر (${rec.lateMinutes || 0} د)` };
        case 'غائب':
          return { symbol: 'غ', color: 'text-rose-700 bg-rose-100 font-bold', label: 'غائب' };
        case 'إجازة':
          return { symbol: 'ج', color: 'text-blue-700 bg-blue-100 font-bold', label: 'إجازة' };
        case 'عطلة أسبوعية':
        case 'راحة':
          return { symbol: 'ع', color: 'text-slate-400 bg-slate-100', label: 'عطلة أسبوعية' };
        case 'مأذونية':
        case 'إذن عمل':
        case 'نصف يوم':
          return { symbol: 'إ', color: 'text-purple-700 bg-purple-100 font-bold', label: 'إذن عمل' };
        default:
          return { symbol: '—', color: 'text-slate-400 bg-slate-50', label: rec.status };
      }
    }

    if (isWknd) {
      return { symbol: 'ع', color: 'text-slate-400 bg-slate-100', label: 'عطلة أسبوعية' };
    }

    // Past date with no record
    return { symbol: '-', color: 'text-slate-400 bg-slate-50', label: 'لم يسجل' };
  };

  const handleExportMatrix = () => {
    ExportService.exportMonthlyMatrix(
      selectedYear,
      ARABIC_MONTHS[selectedMonth - 1],
      selectedMonth,
      daysInSelectedMonth,
      filteredEmployees,
      attendance,
      monthSummary
    );
  };

  return (
    <div className="space-y-5">
      {/* Month & Year Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-[#008e8b]" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {ARABIC_MONTHS.map((mName, idx) => (
                <option key={idx} value={idx + 1} className="text-slate-900">
                  {mName} ({idx + 1})
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none font-mono cursor-pointer"
            >
              {years.map(yr => (
                <option key={yr} value={yr} className="text-slate-900">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Legend & Export Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Key Legend */}
          <div className="hidden md:flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-600">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">ح</span> حاضر</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center">ت</span> متأخر</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">غ</span> غائب</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">ج</span> إجازة</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">ع</span> عطلة</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center">-</span> لم يسجل</span>
          </div>

          <button
            id="btn-export-monthly-matrix"
            onClick={handleExportMatrix}
            className="text-xs font-bold bg-[#008e8b] hover:bg-[#007a77] text-white px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تصدير مصفوفة الشهر (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث عن موظف في مصفوفة الشهر..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-900 focus:outline-[#008e8b]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span>تصفية بالقسم:</span>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#008e8b] cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                {/* Fixed Columns */}
                <th className="py-3 px-3 text-right sticky right-0 z-20 bg-slate-900 min-w-[140px] border-l border-slate-800">
                  الموظف
                </th>
                <th className="py-3 px-2 text-right min-w-[90px] border-l border-slate-800 text-slate-300">
                  القسم
                </th>

                {/* Day Columns 1..N */}
                {daysInSelectedMonth.map(d => (
                  <th
                    key={d.dayNumber}
                    className={`py-2 px-1 min-w-[32px] border-l border-slate-800 text-center ${
                      d.isWeekend ? 'bg-slate-800/80 text-amber-300' : 'text-slate-100'
                    }`}
                  >
                    <div className="font-mono text-xs">{d.dayNumber}</div>
                    <div className="text-[9px] font-normal text-slate-400 truncate max-w-[28px] mx-auto">
                      {d.dayName.slice(0, 3)}
                    </div>
                  </th>
                ))}

                {/* Monthly Summary Headers */}
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-emerald-300 border-l border-slate-700 text-center" title="أيام الحضور الفعلي والتأخير">
                  حضور
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-amber-300 border-l border-slate-700 text-center" title="أيام التأخير">
                  تأخير
                </th>
                <th className="py-3 px-2 min-w-[55px] bg-slate-800 text-amber-300 border-l border-slate-700 text-center" title="إجمالي دقائق التأخير">
                  دقائق
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-rose-300 border-l border-slate-700 text-center" title="أيام الغياب">
                  غياب
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-blue-300 border-l border-slate-700 text-center" title="أيام الإجازة">
                  إجازة
                </th>
                <th className="py-3 px-2 min-w-[50px] bg-slate-800 text-teal-300 border-l border-slate-700 text-center" title="إجمالي ساعات العمل">
                  ساعات
                </th>
                <th className="py-3 px-2 min-w-[55px] bg-slate-900 text-white text-center" title="نسبة الالتزام">
                  النسبة
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={daysInSelectedMonth.length + 9} className="py-12 text-center text-slate-400">
                    لا يوجد موظفون متاحون للعرض.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, empIdx) => {
                  const summary = monthSummary.find(s => s.employeeId === emp.id);
                  const isEvenRow = empIdx % 2 === 0;

                  return (
                    <tr key={emp.id} className={`${isEvenRow ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/40 transition-colors`}>
                      {/* Fixed Employee Info */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 sticky right-0 z-10 bg-inherit border-l border-slate-200">
                        <div className="truncate">{emp.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{emp.id}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 text-[11px] border-l border-slate-200 truncate">
                        {emp.department}
                      </td>

                      {/* Day cells with O(1) Map lookup */}
                      {daysInSelectedMonth.map(d => {
                        const rec = attendanceMap.get(`${emp.id}_${d.dateStr}`);
                        const display = getCellStatusDisplay(rec, d.dateStr, d.dayName, emp);

                        return (
                          <td
                            key={d.dayNumber}
                            className={`p-1 border-l border-slate-100 text-center ${
                              d.isWeekend ? 'bg-slate-100/60' : ''
                            }`}
                            title={`${emp.name} - يوم ${d.dayNumber} (${d.dayName}): ${display.label} ${
                              rec?.checkIn ? `[${rec.checkIn} - ${rec.checkOut || 'لم ينصرف'}]` : ''
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-[11px] inline-flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${display.color}`}
                              onClick={() => {
                                if (rec) setSelectedCellRecord(rec);
                              }}
                            >
                              {display.symbol}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/30 border-l border-slate-200">
                        {summary?.presentDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/30 border-l border-slate-200">
                        {summary?.lateDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-mono font-bold text-amber-700 bg-amber-50/30 border-l border-slate-200">
                        {summary?.totalLateMinutes || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/30 border-l border-slate-200">
                        {summary?.absentDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-blue-700 bg-blue-50/30 border-l border-slate-200">
                        {summary?.leaveDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-[#008e8b] bg-teal-50/30 border-l border-slate-200">
                        {summary?.totalWorkingHours || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-extrabold text-slate-900 bg-slate-100">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          (summary?.attendanceRate || 0) >= 90
                            ? 'text-emerald-700 bg-emerald-50'
                            : (summary?.attendanceRate || 0) >= 75
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {summary?.attendanceRate || 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Details Popover */}
      {selectedCellRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">تفاصيل الحضور</h4>
              <button
                onClick={() => setSelectedCellRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الموظف:</span>
                <span className="font-bold text-slate-800">{selectedCellRecord.employeeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">التاريخ:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCellRecord.date} ({selectedCellRecord.dayName})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الحالة:</span>
                <span className="font-bold text-[#008e8b]">{selectedCellRecord.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">وقت الحضور:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCellRecord.checkIn || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">وقت الانصراف:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCellRecord.checkOut || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ساعات العمل:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCellRecord.workingHours} ساعة</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">دقائق التأخير:</span>
                <span className="font-mono font-bold text-amber-600">{selectedCellRecord.lateMinutes} دقيقة</span>
              </div>
              {selectedCellRecord.notes && (
                <div className="pt-2 text-slate-600 text-[11px] bg-slate-50 p-2 rounded-lg">
                  <span className="font-bold block text-slate-700 mb-0.5">ملاحظات:</span>
                  {selectedCellRecord.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
