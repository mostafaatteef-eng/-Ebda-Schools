import React, { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Building,
  Calendar,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Printer,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceRecord, Employee, LeaveRecord, Student, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianCurrency, formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface ReportsViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
}

type ReportCategory =
  | 'student_attendance'
  | 'student_behavior'
  | 'teacher_attendance'
  | 'payroll_summary'
  | 'employee_statement'
  | 'leaves';

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
}) => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('student_attendance');
  const [selectedDate, setSelectedDate] = useState<string>(getCairoCurrentDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');

  const students = storageService.getStudents();
  const studentAttendance = storageService.getStudentAttendance();
  const violations = storageService.getBehaviorViolations();
  const payrollRecords = storageService.getPayrollRecords();
  const stages = settings.stages || [];

  // Filtered Student Attendance Data
  const studentAttData = studentAttendance.filter(a => {
    const matchDate = a.date === selectedDate;
    const matchGrade = selectedGrade === 'ALL' || a.grade === selectedGrade;
    const matchClass = selectedClassroom === 'ALL' || a.classroom === selectedClassroom;
    return matchDate && matchGrade && matchClass;
  });

  // Filtered Teacher/Staff Attendance
  const staffAttData = attendance.filter(a => {
    const matchDate = a.date === selectedDate;
    const matchDept = selectedDepartment === 'ALL' || a.department === selectedDepartment;
    return matchDate && matchDept;
  });

  // Filtered Payroll Data
  const monthPayrollData = payrollRecords.filter(p => p.month === selectedMonth && p.year === selectedYear);

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeCategory === 'student_attendance') {
      const data = studentAttData.map((s, idx) => ({
        'م': idx + 1,
        'كود الطالب': s.studentCode,
        'اسم الطالب': s.studentName,
        'الصف': s.grade,
        'الفصل': s.classroom,
        'التاريخ': s.date,
        'الحالة': s.status,
        'وقت الحضور': s.checkInTime || '—',
        'التأخير': s.lateMinutes ? `${s.lateMinutes} دقيقة` : '—',
        'ملاحظات / العذر': s.absenceReason || s.notes || '—',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'تقرير_حضور_الطلاب');
      XLSX.writeFile(wb, `تقرير_حضور_الطلاب_${selectedDate}.xlsx`);
    } else if (activeCategory === 'student_behavior') {
      const data = violations.map((v, idx) => ({
        'م': idx + 1,
        'اسم الطالب': v.studentName,
        'كود الطالب': v.studentCode,
        'الصف والفصل': `${v.grade} (${v.classroom})`,
        'المخالفة': v.violationName,
        'الدرجة': v.severity,
        'النقاط المحسومة': v.pointsDeducted,
        'التاريخ': v.date,
        'الإجراء المتخذ': v.actionTaken || '—',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'تقرير_الانضباط_والسلوك');
      XLSX.writeFile(wb, `تقرير_الانضباط_السلوكي_${selectedDate}.xlsx`);
    } else if (activeCategory === 'payroll_summary') {
      const data = monthPayrollData.map((p, idx) => ({
        'م': idx + 1,
        'اسم الموظف': p.employeeName,
        'القسم': p.department,
        'الوظيفة': p.jobTitle,
        'الأساسي': p.basicSalary,
        'إجمالي الاستحقاق': p.totalGross,
        'إجمالي الاستقطاع': p.totalDeductions,
        'صافي الراتب': p.netSalary,
        'الحالة': p.status === 'Paid' ? 'مصروف' : 'معتمد',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'مسير_الرواتب');
      XLSX.writeFile(wb, `مسير_الرواتب_${selectedMonth}_${selectedYear}.xlsx`);
    } else {
      const data = staffAttData.map((a, idx) => ({
        'م': idx + 1,
        'كود الموظف': a.employeeId,
        'اسم الموظف': a.employeeName,
        'القسم': a.department,
        'التاريخ': a.date,
        'الحضور': a.checkIn || '—',
        'الانصراف': a.checkOut || '—',
        'الحالة': a.status,
        'دقائق التأخير': a.lateMinutes || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'حضور_المعلمين');
      XLSX.writeFile(wb, `حضور_المعلمين_${selectedDate}.xlsx`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span>مركز التقارير المدرسية والكشوفات الإحصائية الرسمية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تقارير حضور وغياب الطلاب والمعلمين، لائحة السلوك، مسير الرواتب، وسجلات الإجازات
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (PDF)</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1.5 print:hidden text-xs font-bold">
        {[
          { id: 'student_attendance', label: 'تقرير حضور الطلاب', icon: GraduationCap },
          { id: 'student_behavior', label: 'تقرير السلوك والانضباط', icon: Shield },
          { id: 'teacher_attendance', label: 'كشف حضور المعلمين والموظفين', icon: Users },
          { id: 'payroll_summary', label: 'كشف مسير الرواتب المعتمد', icon: Banknote },
          { id: 'leaves', label: 'سجل الإجازات والأذونات', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as ReportCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 print:hidden text-xs">
        {activeCategory !== 'payroll_summary' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">التاريخ:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800"
            />
          </div>
        )}

        {activeCategory === 'student_attendance' && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">الصف:</span>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
              >
                <option value="ALL">جميع الصفوف</option>
                {stages.flatMap(s => s.grades).map(g => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">الفصل:</span>
              <select
                value={selectedClassroom}
                onChange={e => setSelectedClassroom(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
              >
                <option value="ALL">جميع الفصول</option>
                {['1/1', '1/2', '1/3', '2/1', '2/2', '3/1', '3/2'].map(c => (
                  <option key={c} value={c}>فصل {c}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {activeCategory === 'payroll_summary' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">الشهر:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>شهر {m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">السنة:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{settings.schoolName}</h1>
            <p className="text-xs text-slate-600 mt-0.5">جمهورية مصر العربية • الإدارة العامة للتعليم والموارد البشرية</p>
          </div>
          <div className="text-left text-xs text-slate-600 font-mono">
            <div>تاريخ الاستخراج: {formatEgyptianDate(selectedDate)}</div>
            <div>المستخدم: {currentUser?.fullName || 'مدير النظام'}</div>
          </div>
        </div>

        {/* Dynamic Table Content */}
        {activeCategory === 'student_attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف الدراسي</th>
                  <th className="p-3">الفصل</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">وقت الحضور</th>
                  <th className="p-3">التأخير</th>
                  <th className="p-3">بيان العذر والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentAttData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد سجلات حضور طلاب مسجلة في هذا التاريخ
                    </td>
                  </tr>
                ) : (
                  studentAttData.map(s => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-bold">{s.studentCode}</td>
                      <td className="p-3 font-bold text-slate-800">{s.studentName}</td>
                      <td className="p-3">{s.grade}</td>
                      <td className="p-3 font-semibold">{s.classroom}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          s.status === 'حاضر' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{s.checkInTime || '—'}</td>
                      <td className="p-3 font-mono">{s.lateMinutes ? `${s.lateMinutes} دقيقة` : '—'}</td>
                      <td className="p-3 text-slate-600">{s.absenceReason || s.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeCategory === 'student_behavior' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف والفصل</th>
                  <th className="p-3">المخالفة</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">حسم النقاط</th>
                  <th className="p-3">الإجراء المتخذ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {violations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      سجل المخالفات خالٍ تماماً
                    </td>
                  </tr>
                ) : (
                  violations.map(v => (
                    <tr key={v.id}>
                      <td className="p-3 font-mono font-bold">{v.studentCode}</td>
                      <td className="p-3 font-bold text-slate-800">{v.studentName}</td>
                      <td className="p-3">{v.grade} ({v.classroom})</td>
                      <td className="p-3 font-bold text-rose-700">{v.violationName}</td>
                      <td className="p-3">{v.severity}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">-{v.pointsDeducted} نقطة</td>
                      <td className="p-3 text-slate-700">{v.actionTaken || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeCategory === 'payroll_summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-3">الموظف / المعلم</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">الأساسي</th>
                  <th className="p-3">إجمالي الاستحقاق</th>
                  <th className="p-3">إجمالي الاستقطاع</th>
                  <th className="p-3">صافي الراتب المصروف</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthPayrollData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا يوجد مسير رواتب مسجل لشهر {selectedMonth}/{selectedYear}
                    </td>
                  </tr>
                ) : (
                  monthPayrollData.map(p => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-800">{p.employeeName}</td>
                      <td className="p-3 text-slate-600">{p.department}</td>
                      <td className="p-3 font-mono">{formatEgyptianCurrency(p.basicSalary)}</td>
                      <td className="p-3 font-mono font-bold text-blue-700">{formatEgyptianCurrency(p.totalGross)}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">-{formatEgyptianCurrency(p.totalDeductions)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{formatEgyptianCurrency(p.netSalary)}</td>
                      <td className="p-3 font-semibold">{p.status === 'Paid' ? 'مصروف' : 'معتمد'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Signatures */}
        <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-bold text-slate-700">
          <div>
            <p className="mb-8">توقيع مسؤول شؤون الطلاب والموارد البشرية:</p>
            <div className="w-36 h-0.5 bg-slate-300 mx-auto"></div>
          </div>
          <div>
            <p className="mb-8">اعتماد ناظر / مدير المدرسة:</p>
            <div className="w-36 h-0.5 bg-slate-300 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
