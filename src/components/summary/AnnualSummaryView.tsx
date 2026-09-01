import React, { useState, useMemo } from 'react';
import {
  Award,
  CalendarRange,
  ChevronDown,
  Download,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRecord, AnnualSummaryItem, SystemSettings, User } from '../../types';
import { ExportService } from '../../services/exportService';
import { deriveDynamicYears, getLeaveDaysForYear } from '../../utils/attendanceUtils';

interface AnnualSummaryViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
}

export const AnnualSummaryView: React.FC<AnnualSummaryViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');

  // Derive dynamic list of years
  const years = useMemo(() => {
    return deriveDynamicYears(attendance, employees, settings);
  }, [attendance, employees, settings]);

  const departments = useMemo(() => {
    return ['الكل', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];
  }, [employees]);

  // Performance Optimization: Pre-group attendance by employee for selected year
  const attendanceByEmployeeYear = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    const yearPrefix = `${selectedYear}-`;
    attendance.forEach(a => {
      if (a.date && a.date.startsWith(yearPrefix)) {
        if (!map.has(a.employeeId)) {
          map.set(a.employeeId, []);
        }
        map.get(a.employeeId)!.push(a);
      }
    });
    return map;
  }, [attendance, selectedYear]);

  // Performance Optimization: Pre-group leaves by employee for selected year
  const leavesByEmployeeYear = useMemo(() => {
    const map = new Map<string, LeaveRecord[]>();
    leaves.forEach(l => {
      if (l.status === 'مقبولة') {
        const daysInYear = getLeaveDaysForYear(l, selectedYear);
        if (daysInYear > 0) {
          if (!map.has(l.employeeId)) {
            map.set(l.employeeId, []);
          }
          map.get(l.employeeId)!.push(l);
        }
      }
    });
    return map;
  }, [leaves, selectedYear]);

  // Calculate annual metrics for each employee
  const annualData = useMemo<AnnualSummaryItem[]>(() => {
    return employees.map(emp => {
      const empYearRecords = attendanceByEmployeeYear.get(emp.id) || [];
      const empYearLeaves = leavesByEmployeeYear.get(emp.id) || [];

      const totalPresent = empYearRecords.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
      const totalLateCount = empYearRecords.filter(r => r.status === 'متأخر').length;
      const totalLateMinutes = empYearRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
      const totalAbsent = empYearRecords.filter(r => r.status === 'غائب').length;

      const totalLeaves = empYearLeaves.reduce((acc, l) => acc + getLeaveDaysForYear(l, selectedYear), 0);
      const annualLeavesUsed = empYearLeaves
        .filter(l => l.leaveType === 'سنوية')
        .reduce((acc, l) => acc + getLeaveDaysForYear(l, selectedYear), 0);
      const sickLeavesUsed = empYearLeaves
        .filter(l => l.leaveType === 'مرضية')
        .reduce((acc, l) => acc + getLeaveDaysForYear(l, selectedYear), 0);

      const totalHoursWorked = empYearRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);

      // Expected workdays (actual count of work records or non-weekend records)
      const recordedDays = empYearRecords.filter(r => r.status !== 'عطلة أسبوعية' && r.status !== 'راحة').length;
      const rate = recordedDays > 0 ? Math.min(100, Math.round((totalPresent / recordedDays) * 100)) : (empYearRecords.length > 0 ? 100 : 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        jobTitle: emp.jobTitle,
        hireDate: emp.hireDate,
        totalWorkDaysExpected: recordedDays,
        totalPresent,
        totalLateCount,
        totalLateMinutes,
        totalAbsent,
        totalLeaves,
        annualLeavesUsed,
        sickLeavesUsed,
        totalHoursWorked: parseFloat(totalHoursWorked.toFixed(1)),
        attendanceRate: rate
      };
    });
  }, [employees, attendanceByEmployeeYear, leavesByEmployeeYear, selectedYear]);

  // Filter
  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return annualData.filter(item => {
      const matchDept = deptFilter === 'الكل' || item.department === deptFilter;
      const matchSearch =
        !q ||
        (item.employeeName || '').toLowerCase().includes(q) ||
        (item.employeeId || '').toLowerCase().includes(q) ||
        (item.jobTitle || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [annualData, deptFilter, searchQuery]);

  // Top performers (Filter only employees with actual active data)
  const activeAnnualEmployees = useMemo(() => {
    return annualData.filter(a => a.totalWorkDaysExpected > 0 || a.totalHoursWorked > 0);
  }, [annualData]);

  const topAttendance = useMemo(() => {
    if (activeAnnualEmployees.length === 0) return null;
    return [...activeAnnualEmployees].sort((a, b) => b.attendanceRate - a.attendanceRate)[0];
  }, [activeAnnualEmployees]);

  const lowestLate = useMemo(() => {
    if (activeAnnualEmployees.length === 0) return null;
    return [...activeAnnualEmployees].sort((a, b) => a.totalLateMinutes - b.totalLateMinutes)[0];
  }, [activeAnnualEmployees]);

  const highestHours = useMemo(() => {
    if (activeAnnualEmployees.length === 0) return null;
    return [...activeAnnualEmployees].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked)[0];
  }, [activeAnnualEmployees]);

  const handleExport = () => {
    ExportService.exportAnnualSummary(selectedYear, filteredData);
  };

  return (
    <div className="space-y-5">
      {/* Header & Year Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-[#008e8b]" />
            تقرير الملخص السنوي التراكمي للموظفين
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إحصائيات شاملة للأداء السنوي، ساعات العمل، الإجازات المستهلكة، ومعدلات الالتزام
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-slate-700">السنة المالية:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-mono font-bold text-[#008e8b] bg-transparent focus:outline-none cursor-pointer"
            >
              {years.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button
            id="btn-export-annual-summary"
            onClick={handleExport}
            className="text-xs font-bold bg-[#008e8b] hover:bg-[#007a77] text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تصدير الملخص السنوي (.xlsx)
          </button>
        </div>
      </div>

      {/* Highlights / KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أعلى نسبة التزام سنوي</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {topAttendance ? `${topAttendance.employeeName} (${topAttendance.attendanceRate}%)` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أقل تأخير سنوي</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {lowestLate ? `${lowestLate.employeeName} (${lowestLate.totalLateMinutes} د)` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#008e8b] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أكثر ساعات عمل منجزة</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {highestHours ? `${highestHours.employeeName} (${highestHours.totalHoursWorked} س)` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود أو القسم..."
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="py-3 px-4">الموظف</th>
                <th className="py-3 px-3">القسم والوظيفة</th>
                <th className="py-3 px-3 text-center">أيام الحضور</th>
                <th className="py-3 px-3 text-center">مرات التأخير</th>
                <th className="py-3 px-3 text-center">دقائق التأخير</th>
                <th className="py-3 px-3 text-center">أيام الغياب</th>
                <th className="py-3 px-3 text-center">الإجازات المستهلكة</th>
                <th className="py-3 px-3 text-center">إجمالي ساعات العمل</th>
                <th className="py-3 px-3 text-center">نسبة الالتزام السنوي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد بيانات مطابقة لخيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.employeeId} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.employeeId}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{item.department}</div>
                      <div className="text-[11px] text-slate-400">{item.jobTitle}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {item.totalPresent} يوم
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      {item.totalLateCount} مرة
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700">
                      {item.totalLateMinutes} دقيقة
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-700">
                      {item.totalAbsent} يوم
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      <div className="font-bold">{item.totalLeaves} يوم</div>
                      <div className="text-[10px] text-slate-400">
                        (سنوية: {item.annualLeavesUsed} | مرضية: {item.sickLeavesUsed})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#008e8b]">
                      {item.totalHoursWorked} ساعة
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.attendanceRate >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.attendanceRate >= 75
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
