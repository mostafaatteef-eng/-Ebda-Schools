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

  const years = [2024, 2025, 2026, 2027, 2028];
  const departments = ['الكل', ...Array.from(new Set(employees.map(e => e.department)))];

  // Calculate annual metrics for each employee
  const annualData = useMemo<AnnualSummaryItem[]>(() => {
    return employees.map(emp => {
      // All records for this employee in the selected year
      const empYearRecords = attendance.filter(
        a => a.employeeId === emp.id && a.date.startsWith(`${selectedYear}-`)
      );

      const totalPresent = empYearRecords.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
      const totalLateCount = empYearRecords.filter(r => r.status === 'متأخر').length;
      const totalLateMinutes = empYearRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
      const totalAbsent = empYearRecords.filter(r => r.status === 'غائب').length;

      // Leaves for this employee in this year
      const empYearLeaves = leaves.filter(
        l => l.employeeId === emp.id && l.status === 'مقبولة' && l.startDate.startsWith(`${selectedYear}-`)
      );

      const totalLeaves = empYearLeaves.reduce((acc, l) => acc + (l.daysCount || 0), 0);
      const annualLeavesUsed = empYearLeaves
        .filter(l => l.leaveType === 'سنوية')
        .reduce((acc, l) => acc + (l.daysCount || 0), 0);
      const sickLeavesUsed = empYearLeaves
        .filter(l => l.leaveType === 'مرضية')
        .reduce((acc, l) => acc + (l.daysCount || 0), 0);

      const totalHoursWorked = empYearRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);

      // Expected workdays (approx 260 per year or actual count of recorded days)
      const recordedDays = empYearRecords.length > 0 ? empYearRecords.length : 1;
      const rate = recordedDays > 0 ? Math.round((totalPresent / recordedDays) * 100) : 0;

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
        attendanceRate: Math.min(rate, 100)
      };
    });
  }, [employees, attendance, leaves, selectedYear]);

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

  // Top performers
  const topAttendance = [...annualData].sort((a, b) => b.attendanceRate - a.attendanceRate)[0];
  const lowestLate = [...annualData].sort((a, b) => a.totalLateMinutes - b.totalLateMinutes)[0];
  const highestHours = [...annualData].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked)[0];

  const handleExport = () => {
    ExportService.exportAnnualSummary(selectedYear, filteredData);
  };

  return (
    <div className="space-y-5">
      {/* Header & Year Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            تقرير الملخص السنوي التراكمي للموظفين
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إحصائيات شاملة للأداء السنوي، ساعات العمل، الإجازات المستهلكة، ومعدلات الالتزام
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <span className="text-xs font-semibold text-slate-700">السنة المالية:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-mono font-bold text-indigo-600 bg-transparent focus:outline-none cursor-pointer"
            >
              {years.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button
            id="btn-export-annual-summary"
            onClick={handleExport}
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            تصدير الملخص السنوي (.xlsx)
          </button>
        </div>
      </div>

      {/* Top Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أعلى نسبة التزام سنوية</span>
            <div className="text-sm font-bold text-slate-800">{topAttendance?.employeeName || '-'}</div>
            <span className="text-xs font-mono font-bold text-green-600">{topAttendance?.attendanceRate || 0}% التزام</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أقل تأخير سنوي</span>
            <div className="text-sm font-bold text-slate-800">{lowestLate?.employeeName || '-'}</div>
            <span className="text-xs font-mono font-bold text-orange-600">{lowestLate?.totalLateMinutes || 0} دقيقة فقط</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">أعلى ساعات عمل منجزة</span>
            <div className="text-sm font-bold text-slate-800">{highestHours?.employeeName || '-'}</div>
            <span className="text-xs font-mono font-bold text-indigo-600">{highestHours?.totalHoursWorked || 0} ساعة عمل</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الرقم الوظيفي..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <span>القسم:</span>
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

      {/* Annual Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الموظف</th>
                <th className="py-3.5 px-4">اسم الموظف</th>
                <th className="py-3.5 px-4">القسم</th>
                <th className="py-3.5 px-4">المسمى الوظيفي</th>
                <th className="py-3.5 px-4 text-center">أيام الحضور</th>
                <th className="py-3.5 px-4 text-center">مرات التأخير</th>
                <th className="py-3.5 px-4 text-center">دقائق التأخير</th>
                <th className="py-3.5 px-4 text-center">أيام الغياب</th>
                <th className="py-3.5 px-4 text-center">الإجازات المستهلكة</th>
                <th className="py-3.5 px-4 text-center">إجمالي الساعات</th>
                <th className="py-3.5 px-4 text-center">نسبة الالتزام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    لا توجد بيانات موظفين تطابق البحث.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.employeeId}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.employeeName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.department}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.jobTitle}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-green-600">{item.totalPresent} يوم</td>
                    <td className="py-3.5 px-4 text-center font-bold text-orange-600">{item.totalLateCount}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-orange-600">{item.totalLateMinutes} د</td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">{item.totalAbsent} يوم</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                        {item.totalLeaves} يوم ({item.annualLeavesUsed} اعتيادية)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{item.totalHoursWorked} س</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.attendanceRate >= 90
                          ? 'bg-green-50 text-green-700'
                          : item.attendanceRate >= 75
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
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
