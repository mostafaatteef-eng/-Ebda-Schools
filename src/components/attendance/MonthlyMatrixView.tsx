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
  formatDateKey,
  getBadgeColorForStatus,
  getDaysInMonth
} from '../../utils/attendanceUtils';
import { ExportService } from '../../services/exportService';
import { storageService } from '../../services/storageService';

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
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [deptFilter, setDeptFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCellRecord, setSelectedCellRecord] = useState<AttendanceRecord | null>(null);

  // Available Years
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const departments = ['الكل', ...Array.from(new Set(employees.map(e => e.department)))];

  // Days list for the selected month
  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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

  // Compute Monthly Summary per Employee
  const monthSummary = useMemo<MonthSummaryItem[]>(() => {
    return filteredEmployees.map(emp => {
      let presentDays = 0;
      let lateDays = 0;
      let totalLateMinutes = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let weekendDays = 0;
      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;

      daysInSelectedMonth.forEach(d => {
        const rec = attendance.find(a => a.employeeId === emp.id && a.date === d.dateStr);
        if (rec) {
          if (rec.status === 'حاضر') presentDays++;
          else if (rec.status === 'متأخر') {
            presentDays++;
            lateDays++;
            totalLateMinutes += rec.lateMinutes || 0;
          } else if (rec.status === 'غائب') absentDays++;
          else if (rec.status === 'إجازة') leaveDays++;
          else if (rec.status === 'عطلة أسبوعية') weekendDays++;

          totalWorkingHours += rec.workingHours || 0;
          totalOvertimeHours += rec.overtimeHours || 0;
        } else {
          if (d.isWeekend) weekendDays++;
          else absentDays++;
        }
      });

      const totalWorkDaysExpected = daysInSelectedMonth.length - weekendDays - leaveDays;
      const rate = totalWorkDaysExpected > 0 ? Math.round((presentDays / totalWorkDaysExpected) * 100) : 0;

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
        attendanceRate: Math.min(rate, 100)
      };
    });
  }, [filteredEmployees, daysInSelectedMonth, attendance]);

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

  const getStatusSymbol = (status?: AttendanceStatus, isWeekend?: boolean) => {
    if (!status) {
      return isWeekend ? { symbol: 'ع', color: 'text-slate-400 bg-slate-100' } : { symbol: 'غ', color: 'text-rose-600 bg-rose-50' };
    }
    switch (status) {
      case 'حاضر':
        return { symbol: 'ح', color: 'text-emerald-700 bg-emerald-100/90 font-bold' };
      case 'متأخر':
        return { symbol: 'ت', color: 'text-amber-800 bg-amber-200 font-bold' };
      case 'غائب':
        return { symbol: 'غ', color: 'text-rose-700 bg-rose-100 font-bold' };
      case 'إجازة':
        return { symbol: 'ج', color: 'text-blue-700 bg-blue-100 font-bold' };
      case 'عطلة أسبوعية':
        return { symbol: 'ع', color: 'text-slate-400 bg-slate-100' };
      case 'إذن عمل':
      case 'نصف يوم':
        return { symbol: 'إ', color: 'text-purple-700 bg-purple-100 font-bold' };
      default:
        return { symbol: '—', color: 'text-slate-400 bg-slate-50' };
    }
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600" />
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
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Quick Month Tabs (Sept, Oct, Nov, Dec, etc.) */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[9, 10, 11, 12].map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ARABIC_MONTHS[m - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Legend & Export Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Key Legend */}
          <div className="hidden md:flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-600">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">ح</span> حاضر</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">ت</span> متأخر</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">غ</span> غائب</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">ج</span> إجازة</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">ع</span> عطلة</span>
          </div>

          <button
            id="btn-export-monthly-matrix"
            onClick={handleExportMatrix}
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            تصدير شيت الشهر (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث عن موظف في شيت الشهر..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <span>تصفية بالقسم:</span>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-600"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic 31-Day Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-emerald-300 border-l border-slate-700 text-center" title="أيام الحضور">
                  حضور
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-orange-300 border-l border-slate-700 text-center" title="أيام التأخير">
                  تأخير
                </th>
                <th className="py-3 px-2 min-w-[55px] bg-slate-800 text-orange-300 border-l border-slate-700 text-center" title="إجمالي دقائق التأخير">
                  دقائق
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-red-300 border-l border-slate-700 text-center" title="أيام الغياب">
                  غياب
                </th>
                <th className="py-3 px-2 min-w-[45px] bg-slate-800 text-blue-300 border-l border-slate-700 text-center" title="أيام الإجازة">
                  إجازة
                </th>
                <th className="py-3 px-2 min-w-[50px] bg-slate-800 text-teal-300 border-l border-slate-700 text-center" title="إجمالي ساعات العمل">
                  ساعات
                </th>
                <th className="py-3 px-2 min-w-[55px] bg-indigo-900 text-white text-center" title="نسبة الالتزام">
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
                    <tr key={emp.id} className={`${isEvenRow ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                      {/* Fixed Employee Info */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 sticky right-0 z-10 bg-inherit border-l border-slate-200">
                        <div className="truncate">{emp.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{emp.id}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 text-[11px] border-l border-slate-200 truncate">
                        {emp.department}
                      </td>

                      {/* Day cells */}
                      {daysInSelectedMonth.map(d => {
                        const rec = attendance.find(a => a.employeeId === emp.id && a.date === d.dateStr);
                        const sym = getStatusSymbol(rec?.status, d.isWeekend);

                        return (
                          <td
                            key={d.dayNumber}
                            className={`p-1 border-l border-slate-100 text-center ${
                              d.isWeekend ? 'bg-slate-100/60' : ''
                            }`}
                            title={`${emp.name} - يوم ${d.dayNumber} (${d.dayName}): ${rec?.status || (d.isWeekend ? 'عطلة' : 'غائب')} ${
                              rec?.checkIn ? `[${rec.checkIn} - ${rec.checkOut}]` : ''
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-[11px] inline-flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${sym.color}`}
                              onClick={() => {
                                if (rec) setSelectedCellRecord(rec);
                              }}
                            >
                              {sym.symbol}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-1 text-center font-bold text-green-700 bg-green-50/30 border-l border-slate-200">
                        {summary?.presentDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-orange-700 bg-orange-50/30 border-l border-slate-200">
                        {summary?.lateDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-mono font-bold text-orange-700 bg-orange-50/30 border-l border-slate-200">
                        {summary?.totalLateMinutes || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-red-700 bg-red-50/30 border-l border-slate-200">
                        {summary?.absentDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-blue-700 bg-blue-50/30 border-l border-slate-200">
                        {summary?.leaveDays || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-indigo-700 bg-indigo-50/30 border-l border-slate-200">
                        {summary?.totalWorkingHours || 0}
                      </td>
                      <td className="py-2 px-1 text-center font-extrabold text-slate-900 bg-slate-100">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          (summary?.attendanceRate || 0) >= 90
                            ? 'text-green-700 font-bold'
                            : (summary?.attendanceRate || 0) >= 75
                            ? 'text-indigo-700'
                            : 'text-red-700'
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">تفاصيل الحضور</h4>
              <button
                onClick={() => setSelectedCellRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الموظف:</span>
                <span className="font-bold text-slate-800">{selectedCellRecord.employeeName} ({selectedCellRecord.employeeId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">التاريخ:</span>
                <span className="font-bold text-slate-800">{selectedCellRecord.date} ({selectedCellRecord.dayName})</span>
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
                <span className="font-bold text-emerald-700">{selectedCellRecord.workingHours} ساعة</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">دقائق التأخير:</span>
                <span className="font-bold text-amber-700">{selectedCellRecord.lateMinutes} دقيقة</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الحالة:</span>
                <span className="font-bold text-slate-800">{selectedCellRecord.status}</span>
              </div>
              {selectedCellRecord.notes && (
                <div className="py-1 text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span className="font-bold block mb-0.5">ملاحظات:</span>
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
