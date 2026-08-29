import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRecord, SystemSettings, User } from '../../types';
import { ExportService } from '../../services/exportService';
import { ARABIC_MONTHS, formatDateKey, getBadgeColorForStatus } from '../../utils/attendanceUtils';

interface ReportsViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
}

type ReportType =
  | 'daily'
  | 'monthly'
  | 'annual'
  | 'employee_statement'
  | 'late_report'
  | 'absence_report'
  | 'leave_report';

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser
}) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [deptFilter, setDeptFilter] = useState<string>('الكل');

  const departments = ['الكل', ...Array.from(new Set(employees.map(e => e.department)))];

  // Report Specific Data Queries
  const getReportData = () => {
    switch (reportType) {
      case 'daily':
        return attendance.filter(a => {
          const matchDate = a.date === selectedDate;
          const matchDept = deptFilter === 'الكل' || a.department === deptFilter;
          return matchDate && matchDept;
        });

      case 'monthly':
        const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        return attendance.filter(a => {
          const matchMonth = a.date.startsWith(monthPrefix);
          const matchDept = deptFilter === 'الكل' || a.department === deptFilter;
          return matchMonth && matchDept;
        });

      case 'annual':
        return attendance.filter(a => {
          const matchYear = a.date.startsWith(`${selectedYear}-`);
          const matchDept = deptFilter === 'الكل' || a.department === deptFilter;
          return matchYear && matchDept;
        });

      case 'employee_statement':
        return attendance.filter(a => a.employeeId === selectedEmpId);

      case 'late_report':
        return attendance.filter(a => {
          const matchLate = a.lateMinutes > 0 || a.status === 'متأخر';
          const matchDept = deptFilter === 'الكل' || a.department === deptFilter;
          return matchLate && matchDept;
        });

      case 'absence_report':
        return attendance.filter(a => {
          const matchAbsence = a.status === 'غائب';
          const matchDept = deptFilter === 'الكل' || a.department === deptFilter;
          return matchAbsence && matchDept;
        });

      case 'leave_report':
        return leaves.filter(l => {
          const matchDept = deptFilter === 'الكل' || l.department === deptFilter;
          return matchDept;
        });

      default:
        return [];
    }
  };

  const currentData = getReportData();

  const handlePrint = () => {
    ExportService.triggerPrint();
  };

  const handleExportExcel = () => {
    if (reportType === 'leave_report') {
      ExportService.exportFullDatabaseToExcel(employees, attendance, leaves, settings, []);
    } else {
      ExportService.exportFullDatabaseToExcel(employees, currentData as AttendanceRecord[], leaves, settings, []);
    }
  };

  const reportTitles: Record<ReportType, string> = {
    daily: `تقرير الحضور اليومي - تاريخ ${selectedDate}`,
    monthly: `تقرير الحضور والانصراف لشهر ${ARABIC_MONTHS[selectedMonth - 1]} ${selectedYear}`,
    annual: `تقرير الأداء السنوي العام لسنة ${selectedYear}`,
    employee_statement: `كشف حساب حضور الموظف: ${employees.find(e => e.id === selectedEmpId)?.name || selectedEmpId}`,
    late_report: `تقرير التأخيرات والمخالفات الزمنية`,
    absence_report: `تقرير حالات الغياب المسجلة`,
    leave_report: `تقرير الإجازات والأذونات الرسمية`
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            مركز التقارير والكشوفات الرسمية
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            توليد كشوفات وتقارير الموارد البشرية جاهزة للطباعة والتصدير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            طباعة الكشف (PDF)
          </button>
          <button
            onClick={handleExportExcel}
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            تصدير Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1.5 print:hidden">
        {[
          { id: 'daily', label: 'تقرير يومي', icon: Clock },
          { id: 'monthly', label: 'تقرير شهري', icon: Calendar },
          { id: 'employee_statement', label: 'كشف موظف', icon: Users },
          { id: 'late_report', label: 'تقرير التأخيرات', icon: Clock },
          { id: 'absence_report', label: 'تقرير الغياب', icon: FileCheck },
          { id: 'leave_report', label: 'تقرير الإجازات', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Context Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 print:hidden text-xs">
        {reportType === 'daily' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">التاريخ:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-indigo-600"
            />
          </div>
        )}

        {(reportType === 'monthly' || reportType === 'annual') && (
          <div className="flex items-center gap-3">
            {reportType === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">الشهر:</span>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-indigo-600"
                >
                  {ARABIC_MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">السنة:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-semibold focus:outline-indigo-600"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {reportType === 'employee_statement' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">الموظف:</span>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-indigo-600"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.id} - {emp.name} ({emp.department})</option>
              ))}
            </select>
          </div>
        )}

        {reportType !== 'employee_statement' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">القسم:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-indigo-600"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mr-auto text-slate-500 font-medium">
          إجمالي السجلات المستخرجة: <strong className="text-slate-800">{currentData.length}</strong>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{settings.companyName}</h1>
            <p className="text-xs text-slate-600 mt-0.5">إدارة الموارد البشرية والشؤون الإدارية</p>
          </div>
          <div className="text-left text-xs text-slate-600 font-mono">
            <div>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</div>
            <div>المستخدم: {currentUser?.fullName || 'مسؤول النظام'}</div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900">{reportTitles[reportType]}</h2>
        </div>

        {/* Printable Table */}
        <div className="overflow-x-auto">
          {reportType === 'leave_report' ? (
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">رقم الإجازة</th>
                  <th className="py-2.5 px-3">الموظف</th>
                  <th className="py-2.5 px-3">القسم</th>
                  <th className="py-2.5 px-3">نوع الإجازة</th>
                  <th className="py-2.5 px-3">من</th>
                  <th className="py-2.5 px-3">إلى</th>
                  <th className="py-2.5 px-3 text-center">المدة</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">السبب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {(currentData as LeaveRecord[]).map(l => (
                  <tr key={l.id}>
                    <td className="py-2 px-3 font-mono">{l.id}</td>
                    <td className="py-2 px-3 font-bold">{l.employeeName}</td>
                    <td className="py-2 px-3">{l.department}</td>
                    <td className="py-2 px-3 font-semibold">{l.leaveType}</td>
                    <td className="py-2 px-3 font-mono">{l.startDate}</td>
                    <td className="py-2 px-3 font-mono">{l.endDate}</td>
                    <td className="py-2 px-3 text-center font-bold">{l.daysCount} يوم</td>
                    <td className="py-2 px-3">{l.status}</td>
                    <td className="py-2 px-3">{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">رقم الموظف</th>
                  <th className="py-2.5 px-3">اسم الموظف</th>
                  <th className="py-2.5 px-3">القسم</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الحضور</th>
                  <th className="py-2.5 px-3">الانصراف</th>
                  <th className="py-2.5 px-3 text-center">الساعات</th>
                  <th className="py-2.5 px-3 text-center">التأخير</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      لا توجد بيانات مسجلة لهذا التقرير.
                    </td>
                  </tr>
                ) : (
                  (currentData as AttendanceRecord[]).map(r => {
                    const badge = getBadgeColorForStatus(r.status);
                    return (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-mono font-bold">{r.employeeId}</td>
                        <td className="py-2 px-3 font-bold">{r.employeeName}</td>
                        <td className="py-2 px-3">{r.department}</td>
                        <td className="py-2 px-3 font-mono">{r.date}</td>
                        <td className="py-2 px-3 font-mono">{r.checkIn || '-'}</td>
                        <td className="py-2 px-3 font-mono">{r.checkOut || '-'}</td>
                        <td className="py-2 px-3 text-center font-bold">{r.workingHours} س</td>
                        <td className="py-2 px-3 text-center font-mono">
                          {r.lateMinutes > 0 ? `${r.lateMinutes} د` : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.border}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Printable Footer / Signatures Area */}
        <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-bold text-slate-700">
          <div>
            <p className="mb-8">توقيع مسؤول الموارد البشرية:</p>
            <div className="w-36 h-0.5 bg-slate-300 mx-auto"></div>
          </div>
          <div>
            <p className="mb-8">اعتماد الإدارة العامة:</p>
            <div className="w-36 h-0.5 bg-slate-300 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
