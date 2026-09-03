import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  Banknote,
  Calculator,
  CheckCircle,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Unlock,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Employee,
  MonthlyAttendanceClosing,
  PayrollAttendanceSnapshot,
  PayrollCalculationBreakdown,
  PayrollRecord,
  PayrollRule,
  SystemSettings,
  User,
} from '../../types';
import { storageService } from '../../services/storageService';
import { HRPayrollService } from '../../services/hrPayrollService';
import { formatEgyptianCurrency, formatEgyptianDate } from '../../utils/egyptianTime';
import { ARABIC_MONTHS } from '../../utils/attendanceUtils';

interface PayrollViewProps {
  currentUser?: User | null;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ currentUser }) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const isAdmin = HRPayrollService.isPayrollAdmin(activeUser);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => storageService.getPayrollRecords());
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedRecordForSlip, setSelectedRecordForSlip] = useState<PayrollRecord | null>(null);
  const [breakdownModalData, setBreakdownModalData] = useState<{
    record: PayrollRecord;
    breakdown?: PayrollCalculationBreakdown;
    snapshot?: PayrollAttendanceSnapshot;
  } | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Settings & Rules State
  const [settings, setSettings] = useState<SystemSettings>(() => storageService.getSettings());
  const [rulesForm, setRulesForm] = useState<PayrollRule>(() => storageService.getSettings().payrollRules);

  // Period Closing State
  const [closing, setClosing] = useState<MonthlyAttendanceClosing | undefined>(() =>
    HRPayrollService.getMonthlyClosing(selectedMonth, selectedYear)
  );

  useEffect(() => {
    setClosing(HRPayrollService.getMonthlyClosing(selectedMonth, selectedYear));
  }, [selectedMonth, selectedYear]);

  const departments = useMemo(() => {
    return settings.departments || [];
  }, [settings.departments]);

  const reloadData = () => {
    setPayrollRecords(storageService.getPayrollRecords());
    setClosing(HRPayrollService.getMonthlyClosing(selectedMonth, selectedYear));
  };

  // Role Security Guard Check
  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-900 max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">غير مصرح بالدخول (403 Forbidden - Admin Only)</h2>
        <p className="text-xs text-rose-700 mt-2 leading-relaxed">
          عذراً، مسير الرواتب والمحرك المالي وتفاصيل الأجور محمية ومقتصرة فقط على حساب الإدارة العليا (Admin) للحفاظ على سرية البيانات المالية.
        </p>
      </div>
    );
  }

  // Filtered Records for the selected month/year
  const monthRecords = useMemo(() => {
    return payrollRecords.filter(p => p.month === selectedMonth && p.year === selectedYear);
  }, [payrollRecords, selectedMonth, selectedYear]);

  const filteredRecords = useMemo(() => {
    return monthRecords.filter(p => {
      const matchSearch =
        !searchTerm.trim() ||
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === 'ALL' || p.department === selectedDepartment;
      return matchSearch && matchDept;
    });
  }, [monthRecords, searchTerm, selectedDepartment]);

  // Overall Totals
  const totals = useMemo(() => {
    const totalGross = monthRecords.reduce((sum, r) => sum + (r.totalGross || 0), 0);
    const totalDeductions = monthRecords.reduce((sum, r) => sum + (r.totalDeductions || 0), 0);
    const totalNet = monthRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const count = monthRecords.length;

    return { totalGross, totalDeductions, totalNet, count };
  }, [monthRecords]);

  const handleGeneratePayroll = () => {
    try {
      const generated = HRPayrollService.generateMonthlyPayrollFromSnapshots(selectedMonth, selectedYear, activeUser);
      reloadData();
      alert(`تم بنجاح احتساب واعتماد مسير رواتب شهر (${selectedMonth}/${selectedYear}) لعدد (${generated.length}) موظف ومعلم.`);
    } catch (err: any) {
      alert(`خطأ: ${err.message || 'فشلت عملية الاحتساب'}`);
    }
  };

  const handleApproveAll = () => {
    if (monthRecords.length === 0) return;
    if (window.confirm(`هل ترغب في اعتماد جميع مرتبات شهر (${selectedMonth}/${selectedYear}) دفعة واحدة؟`)) {
      const currentAll = storageService.getPayrollRecords();
      const updated = currentAll.map(rec => {
        if (rec.month === selectedMonth && rec.year === selectedYear && rec.status === 'Draft') {
          return {
            ...rec,
            status: 'Approved' as const,
            approvedBy: activeUser?.fullName || 'المدير المالي',
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      });
      storageService.savePayrollRecordsBatch(updated);
      reloadData();
    }
  };

  const handleMarkAllPaid = () => {
    if (monthRecords.length === 0) return;
    if (window.confirm(`هل ترغب في تثبيت الصرف والتحويل البنكي لجميع مسيرات شهر (${selectedMonth}/${selectedYear})؟`)) {
      const currentAll = storageService.getPayrollRecords();
      const now = new Date().toISOString();
      const updated = currentAll.map(rec => {
        if (rec.month === selectedMonth && rec.year === selectedYear) {
          return {
            ...rec,
            status: 'Paid' as const,
            paidDate: now,
            updatedAt: now,
          };
        }
        return rec;
      });
      storageService.savePayrollRecordsBatch(updated);
      reloadData();
    }
  };

  const handleApproveRecord = (record: PayrollRecord) => {
    const updated: PayrollRecord = {
      ...record,
      status: 'Approved',
      approvedBy: activeUser?.fullName || 'المدير المالي',
      updatedAt: new Date().toISOString(),
    };
    storageService.savePayrollRecord(updated);
    reloadData();
  };

  const handleLockRecord = (record: PayrollRecord) => {
    const updated: PayrollRecord = {
      ...record,
      status: 'Paid',
      paidDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.savePayrollRecord(updated);
    reloadData();
  };

  const handleOpenBreakdown = (record: PayrollRecord) => {
    const emp = storageService.getEmployees().find(e => e.id === record.employeeId);
    const snapshots = HRPayrollService.getPayrollAttendanceSnapshots(selectedMonth, selectedYear);
    const snap = snapshots.find(s => s.employeeId === record.employeeId);

    if (emp && snap) {
      const { breakdown } = HRPayrollService.calculateEmployeePayrollBreakdown(emp, snap);
      setBreakdownModalData({ record, breakdown, snapshot: snap });
    } else {
      setBreakdownModalData({ record });
    }
  };

  const handleSavePayrollRules = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: SystemSettings = {
      ...settings,
      payrollRules: rulesForm,
    };
    storageService.saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setIsRulesModalOpen(false);
    alert('تم بنجاح حفظ قواعد احتساب الرواتب والبدلات');
  };

  const exportPayrollExcel = () => {
    const data = filteredRecords.map((r, idx) => ({
      'م': idx + 1,
      'رقم الموظف': r.employeeId,
      'اسم الموظف': r.employeeName,
      'القسم': r.department,
      'المسمى الوظيفي': r.jobTitle,
      'الراتب الأساسي': r.basicSalary,
      'البدلات والحوافز': r.allowances + (r.incentives || 0),
      'أجر الإضافي': r.overtimeAmount,
      'إجمالي الاستحقاقات': r.totalGross,
      'خصم الغياب': r.absenceDeductions,
      'خصم التأخير': r.lateDeductions,
      'التأمينات والاستقطاعات': (r.loanDeductions || 0) + (r.otherDeductions || 0),
      'إجمالي الاستقطاعات': r.totalDeductions,
      'صافي المرتب المستحق (EGP)': r.netSalary,
      'الحالة': r.status === 'Paid' ? 'تم الصرف' : r.status === 'Approved' ? 'معتمد' : 'مسودة',
      'معتمد بواسطة': r.approvedBy || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `مسير_${selectedMonth}_${selectedYear}`);
    XLSX.writeFile(wb, `مسير_الرواتب_الشهري_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const isPeriodClosed = closing?.status === 'CLOSED' || closing?.status === 'LOCKED';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            <span>محرك ومسير الرواتب والاستحقاقات (Payroll Engine - Admin Only)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            احتساب تلقائي للغياب والتأخير، ساعات الإضافي، التأمينات الاجتماعية، وطباعة مفردات المرتب الرسمية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" />
            <span>قواعد الاحتساب</span>
          </button>

          <button
            onClick={exportPayrollExcel}
            className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-1.5 border border-slate-200 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير المسير Excel</span>
          </button>
        </div>
      </div>

      {/* Snapshot / Monthly Period Notice */}
      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
        isPeriodClosed
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isPeriodClosed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {isPeriodClosed ? <FileCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>حالة لقطة الحضور لشهر {selectedMonth}/{selectedYear}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isPeriodClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isPeriodClosed ? 'لقطة الحضور مثبتة وجاهزة للمسير' : 'لم يتم إقفال الحضور بعد'}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {isPeriodClosed
                ? `تم إقفال الحضور وتوليد اللقطة بنجاح بواسطة (${closing?.closedBy}). يمكنك تشغيل محرك الاحتساب المالي.`
                : 'يُفضل إقفال دورة الحضور في مصفوفة الشهر أولاً لضمان عدم تغير السجلات بعد الاحتساب.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePayroll}
          className="text-xs font-bold bg-[#008e8b] hover:bg-teal-700 text-white px-5 py-2.5 rounded-2xl shadow-sm transition-colors flex items-center gap-2 shrink-0"
        >
          <Calculator className="w-4 h-4" />
          <span>احتساب / تحديث مسير رواتب الشهر</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المستحقين في المسير</span>
          <div className="text-2xl font-bold font-mono text-slate-800">{totals.count} موظف</div>
          <span className="text-[10px] text-slate-400 block mt-1">شهر {selectedMonth}/{selectedYear}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الاستحقاقات (Gross)</span>
          <div className="text-2xl font-bold font-mono text-slate-800">{formatEgyptianCurrency(totals.totalGross)}</div>
          <span className="text-[10px] text-emerald-600 block mt-1">شامل الأساسي والبدلات والإضافي</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الاستقطاعات والخصومات</span>
          <div className="text-2xl font-bold font-mono text-rose-600">-{formatEgyptianCurrency(totals.totalDeductions)}</div>
          <span className="text-[10px] text-rose-500 block mt-1">غياب + تأخير + تأمينات وسلف</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 block mb-1">صافي الأجور المستحقة للصرف</span>
          <div className="text-2xl font-bold font-mono text-emerald-700">{formatEgyptianCurrency(totals.totalNet)}</div>
          <span className="text-[10px] text-emerald-600 block mt-1">المبلغ النهائي الصافي بالجنيه المصري</span>
        </div>
      </div>

      {/* Filters and Month Picker */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            <span className="text-xs font-bold text-slate-500">الشهر:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {ARABIC_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m} ({idx + 1})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            <span className="text-xs font-bold text-slate-500">السنة:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden font-mono cursor-pointer"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            <span className="text-xs font-bold text-slate-500">القسم:</span>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">جميع الأقسام</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم، الكود، أو المسمى..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Batch Action Bar */}
      {monthRecords.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="text-slate-600 font-medium">
            عدد السجلات المعروضة: <span className="font-bold font-mono text-slate-800">{filteredRecords.length}</span> من أصل <span className="font-bold font-mono text-slate-800">{monthRecords.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>اعتماد جميع مسودات الشهر</span>
            </button>

            <button
              onClick={handleMarkAllPaid}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>تثبيت الصرف والتحويل البنكي</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الموظف / المعلم</th>
                <th className="p-3.5">القسم والمسمى</th>
                <th className="p-3.5">الأساسي</th>
                <th className="p-3.5">البدلات</th>
                <th className="p-3.5">أجر الإضافي</th>
                <th className="p-3.5">إجمالي الاستحقاق</th>
                <th className="p-3.5">خصم الغياب</th>
                <th className="p-3.5">خصم التأخير</th>
                <th className="p-3.5">استقطاعات أخرى</th>
                <th className="p-3.5">إجمالي الخصم</th>
                <th className="p-3.5 bg-emerald-50 text-emerald-900">صافي الراتب (EGP)</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Banknote className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">لا توجد سجلات رواتب مسجلة لشهر {selectedMonth}/{selectedYear}</p>
                      <p className="text-xs text-slate-500">اضغط على زر "احتساب مسير رواتب الشهر" أعلاه لبدء التوليد التلقائي.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{rec.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rec.employeeId}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{rec.department}</div>
                      <div className="text-[10px] text-slate-400">{rec.jobTitle}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{formatEgyptianCurrency(rec.basicSalary)}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {rec.allowances > 0 ? formatEgyptianCurrency(rec.allowances) : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600">
                      {rec.overtimeAmount > 0 ? (
                        <span>+{formatEgyptianCurrency(rec.overtimeAmount)} ({rec.overtimeHours} س)</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{formatEgyptianCurrency(rec.totalGross)}</td>
                    <td className="p-3.5 font-mono text-rose-600">
                      {rec.absentDaysCount > 0 ? (
                        <span>-{formatEgyptianCurrency(rec.absenceDeductions)} ({rec.absentDaysCount} ي)</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-rose-600">
                      {rec.totalLateMinutes > 0 ? (
                        <span>-{formatEgyptianCurrency(rec.lateDeductions)} ({rec.totalLateMinutes} د)</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {(rec.loanDeductions || 0) + (rec.otherDeductions || 0) > 0
                        ? formatEgyptianCurrency((rec.loanDeductions || 0) + (rec.otherDeductions || 0))
                        : '—'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-700">-{formatEgyptianCurrency(rec.totalDeductions)}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      {formatEgyptianCurrency(rec.netSalary)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status === 'Paid' ? 'تم الصرف' : rec.status === 'Approved' ? 'معتمد' : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenBreakdown(rec)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="تفاصيل ومعادلة الاحتساب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedRecordForSlip(rec)}
                          className="p-1.5 text-slate-500 hover:text-[#008e8b] hover:bg-teal-50 rounded-lg transition-colors"
                          title="طباعة مفردات المرتب"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {rec.status === 'Draft' && (
                          <button
                            onClick={() => handleApproveRecord(rec)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="اعتماد المرتب"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        {rec.status === 'Approved' && (
                          <button
                            onClick={() => handleLockRecord(rec)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="إتمام الصرف وإقفال السجل"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown Details Modal */}
      {breakdownModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span>تفاصيل ومعادلة احتساب مرتب: {breakdownModalData.record.employeeName}</span>
              </h3>
              <button onClick={() => setBreakdownModalData(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Snapshot Attendance Summary */}
              {breakdownModalData.snapshot && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>سجل الحضور المعتمد في لقطة المسير</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center pt-2">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">أيام العمل</span>
                      <span className="font-mono font-bold text-slate-800">{breakdownModalData.snapshot.workingDays}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">حضور فعلي</span>
                      <span className="font-mono font-bold text-emerald-700">{breakdownModalData.snapshot.presentDays}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">غياب + غير مدفوع</span>
                      <span className="font-mono font-bold text-rose-700">{breakdownModalData.snapshot.absentDays + breakdownModalData.snapshot.unpaidLeaveDays}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">تأخير (دقيقة)</span>
                      <span className="font-mono font-bold text-amber-700">{breakdownModalData.snapshot.lateMinutes}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mathematical Rates Breakdown */}
              {breakdownModalData.breakdown && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 space-y-2">
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    <span>معدلات الأجر اليومي والساعي المحتسبة</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 block">أجر اليوم:</span>
                      <span className="font-mono font-bold text-indigo-900">{formatEgyptianCurrency(breakdownModalData.breakdown.calculationDetails.dailyWage)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">أجر الدقيقة:</span>
                      <span className="font-mono font-bold text-indigo-900">{formatEgyptianCurrency(breakdownModalData.breakdown.calculationDetails.minuteRate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">أجر ساعة الإضافي:</span>
                      <span className="font-mono font-bold text-indigo-900">{formatEgyptianCurrency(breakdownModalData.breakdown.calculationDetails.overtimeRatePerHour)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Formula & Final Net */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <span className="text-slate-400 block text-[11px]">معادلة الاحتساب الرسمية:</span>
                <p className="font-mono text-xs text-slate-200 leading-relaxed">
                  {breakdownModalData.breakdown?.calculationDetails.calculationFormula ||
                    `الأساسي (${breakdownModalData.record.basicSalary}) + البدلات (${breakdownModalData.record.allowances}) + الإضافي (${breakdownModalData.record.overtimeAmount}) - غياب (${breakdownModalData.record.absenceDeductions}) - تأخير (${breakdownModalData.record.lateDeductions}) - استقطاعات (${breakdownModalData.record.loanDeductions}) = صافي (${breakdownModalData.record.netSalary}) ج.م`}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">الصافي النهائي المستحق:</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {formatEgyptianCurrency(breakdownModalData.record.netSalary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setBreakdownModalData(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Rules Config Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#008e8b]" />
                <span>إعدادات وقواعد احتساب الرواتب (Payroll Rules)</span>
              </h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayrollRules} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">أيام العمل القياسية بالشهر</label>
                  <input
                    type="number"
                    value={rulesForm.workDaysPerMonth}
                    onChange={e => setRulesForm({ ...rulesForm, workDaysPerMonth: Number(e.target.value) })}
                    min={20}
                    max={31}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">لحساب الأجر اليومي = الأساسي ÷ أيام العمل</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">فترة السماح للتأخير الصباحي (دقائق)</label>
                  <input
                    type="number"
                    value={rulesForm.lateGraceMinutes}
                    onChange={e => setRulesForm({ ...rulesForm, lateGraceMinutes: Number(e.target.value) })}
                    min={0}
                    max={60}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">الدقائق المعفية شهرياً أو يومياً قبل الخصم</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">معامل خصم يوم الغياب (Multiplier)</label>
                  <input
                    type="number"
                    value={rulesForm.absenceDeductionMultiplier}
                    onChange={e => setRulesForm({ ...rulesForm, absenceDeductionMultiplier: Number(e.target.value) })}
                    min={1}
                    max={3}
                    step={0.5}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">1.0 = خصم أجر اليوم، 2.0 = خصم يومين عن يوم الغياب</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">معدل احتساب الساعة الإضافية (Overtime Rate)</label>
                  <input
                    type="number"
                    value={rulesForm.overtimeRate}
                    onChange={e => setRulesForm({ ...rulesForm, overtimeRate: Number(e.target.value) })}
                    min={1}
                    max={3}
                    step={0.25}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">1.5 = ساعة ونصف أجر عن كل ساعة إضافية</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نسبة خصم التأمينات الاجتماعية (%)</label>
                  <input
                    type="number"
                    value={rulesForm.socialInsuranceRate}
                    onChange={e => setRulesForm({ ...rulesForm, socialInsuranceRate: Number(e.target.value) })}
                    min={0}
                    max={30}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="enableSocialInsuranceDeduction"
                    checked={rulesForm.enableSocialInsuranceDeduction}
                    onChange={e => setRulesForm({ ...rulesForm, enableSocialInsuranceDeduction: e.target.checked })}
                    className="w-4 h-4 text-[#008e8b] rounded-sm cursor-pointer"
                  />
                  <label htmlFor="enableSocialInsuranceDeduction" className="text-xs font-bold text-slate-700 cursor-pointer">
                    تفعيل خصم التأمينات الاجتماعية تلقائياً
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ القواعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Salary Slip Modal */}
      {selectedRecordForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008e8b]" />
                <span>مفردات مرتب رسمية (Official Salary Slip)</span>
              </h3>
              <button onClick={() => setSelectedRecordForSlip(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 bg-white" id="salarySlipPrintable">
              <div className="text-center border-b pb-4 border-slate-200 space-y-1">
                <h2 className="text-lg font-bold text-slate-900">{settings.schoolName || 'مدرسة التكنولوجيا التطبيقية الحديثة'}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  إدارة الموارد البشرية والشؤون المالية - كشف مفردات مرتب عن شهر: {selectedRecordForSlip.month} / {selectedRecordForSlip.year}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">اسم الموظف / المعلم:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRecordForSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الرقم الوظيفي:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedRecordForSlip.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">القسم / الإدارة:</span>
                  <span className="font-bold text-slate-800">{selectedRecordForSlip.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">المسمى الوظيفي:</span>
                  <span className="font-bold text-slate-800">{selectedRecordForSlip.jobTitle}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-emerald-50/20">
                  <h4 className="text-xs font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-3">
                    الاستحقاقات والمزايا
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">الراتب الأساسي:</span>
                      <span className="font-mono font-bold">{formatEgyptianCurrency(selectedRecordForSlip.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">البدلات والحوافز:</span>
                      <span className="font-mono font-bold">{formatEgyptianCurrency(selectedRecordForSlip.allowances + (selectedRecordForSlip.incentives || 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">أجر ساعات إضافية:</span>
                      <span className="font-mono font-bold text-emerald-600">{formatEgyptianCurrency(selectedRecordForSlip.overtimeAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                      <span>إجمالي الاستحقاق:</span>
                      <span className="font-mono">{formatEgyptianCurrency(selectedRecordForSlip.totalGross)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-rose-50/20">
                  <h4 className="text-xs font-bold text-rose-800 border-b border-rose-200 pb-2 mb-3">
                    الاستقطاعات والخصومات
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">خصم أيام الغياب:</span>
                      <span className="font-mono font-bold text-rose-600">-{formatEgyptianCurrency(selectedRecordForSlip.absenceDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">خصم دقائق التأخير:</span>
                      <span className="font-mono font-bold text-rose-600">-{formatEgyptianCurrency(selectedRecordForSlip.lateDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">تأمينات وسلف:</span>
                      <span className="font-mono font-bold text-rose-600">-{formatEgyptianCurrency((selectedRecordForSlip.loanDeductions || 0) + (selectedRecordForSlip.otherDeductions || 0))}</span>
                    </div>
                    <div className="pt-2 border-t border-rose-200 flex justify-between font-bold text-rose-900">
                      <span>إجمالي الاستقطاع:</span>
                      <span className="font-mono">-{formatEgyptianCurrency(selectedRecordForSlip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">صافي المرتب المستحق للصرف:</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {formatEgyptianCurrency(selectedRecordForSlip.netSalary)}
                  </span>
                </div>
                <div className="text-left text-[11px] text-slate-400">
                  تاريخ الاعتماد: {formatEgyptianDate(selectedRecordForSlip.updatedAt || new Date().toISOString())}
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500">
                <div>
                  <span className="block font-bold text-slate-700 mb-6">توقيع المستلم</span>
                  <span className="block border-t border-dashed border-slate-300 pt-1">................................</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-700 mb-6">المراجع المالي</span>
                  <span className="block border-t border-dashed border-slate-300 pt-1">{selectedRecordForSlip.approvedBy || 'إدارة الحسابات'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-700 mb-6">اعتماد مدير المدرسة</span>
                  <span className="block border-t border-dashed border-slate-300 pt-1">خاتم المدرسة الرسمي</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRecordForSlip(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة مفردات المرتب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
