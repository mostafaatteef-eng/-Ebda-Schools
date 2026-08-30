import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Calculator,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PayrollRecord } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianCurrency, formatEgyptianDate } from '../../utils/egyptianTime';

export const PayrollView: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => storageService.getPayrollRecords());
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRecordForSlip, setSelectedRecordForSlip] = useState<PayrollRecord | null>(null);

  const settings = storageService.getSettings();
  const rules = settings.payrollRules;
  const departments = settings.departments || [];

  const reloadData = () => {
    setPayrollRecords(storageService.getPayrollRecords());
  };

  const handleGeneratePayroll = () => {
    if (window.confirm(`هل ترغب في إنشاء وحساب مسير مرتبات شهر (${selectedMonth}/${selectedYear}) لجميع المعلمين والموظفين؟`)) {
      const generated = storageService.generateMonthlyPayroll(selectedMonth, selectedYear);
      setPayrollRecords(storageService.getPayrollRecords());
      alert(`تم بنجاح احتساب مرتبات (${generated.length}) موظف ومعلم وفقاً لسجلات الحضور وقواعد الرواتب.`);
    }
  };

  // Filtered Records for the selected month/year
  const monthRecords = useMemo(() => {
    return payrollRecords.filter(p => p.month === selectedMonth && p.year === selectedYear);
  }, [payrollRecords, selectedMonth, selectedYear]);

  const filteredRecords = useMemo(() => {
    return monthRecords.filter(p => {
      const matchSearch =
        !searchTerm.trim() ||
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleApproveRecord = (record: PayrollRecord) => {
    const updated: PayrollRecord = {
      ...record,
      status: 'Approved',
      approvedBy: storageService.getCurrentUser()?.fullName || 'المدير المالي',
    };
    storageService.savePayrollRecord(updated);
    reloadData();
  };

  const handleLockRecord = (record: PayrollRecord) => {
    const updated: PayrollRecord = {
      ...record,
      status: 'Paid',
      paidDate: new Date().toISOString(),
    };
    storageService.savePayrollRecord(updated);
    reloadData();
  };

  const exportPayrollExcel = () => {
    const data = filteredRecords.map((r, idx) => ({
      'م': idx + 1,
      'اسم الموظف': r.employeeName,
      'القسم': r.department,
      'المسمى الوظيفي': r.jobTitle,
      'الراتب الأساسي': r.basicSalary,
      'البدلات والحوافز': r.allowances + r.incentives,
      'أجر الإضافي': r.overtimeAmount,
      'إجمالي الاستحقاقات': r.totalGross,
      'خصم الغياب': r.absenceDeductions,
      'خصم التأخير': r.lateDeductions,
      'التأمينات والاستقطاعات': r.loanDeductions + r.otherDeductions,
      'إجمالي الاستقطاعات': r.totalDeductions,
      'صافي المرتب المستحق': r.netSalary,
      'الحالة': r.status === 'Paid' ? 'تم الصرف' : r.status === 'Approved' ? 'معتمد' : 'مسودة',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `مسير_${selectedMonth}_${selectedYear}`);
    XLSX.writeFile(wb, `مسير_الرواتب_الشهري_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            <span>محرك ومسير الرواتب والاستحقاقات (المعلمين والموظفين)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            احتساب تلقائي للغياب والتأخير، الإضافي، التأمينات الاجتماعية، وطباعة مفردات المرتب
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportPayrollExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير المسير Excel</span>
          </button>

          <button
            onClick={handleGeneratePayroll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>احتساب مسير الشهر تلقائياً</span>
          </button>
        </div>
      </div>

      {/* Month & Period Selector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">الشهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              {[
                { m: 1, n: 'يناير' },
                { m: 2, n: 'فبراير' },
                { m: 3, n: 'مارس' },
                { m: 4, n: 'أبريل' },
                { m: 5, n: 'مايو' },
                { m: 6, n: 'يونيو' },
                { m: 7, n: 'يوليو' },
                { m: 8, n: 'أغسطس' },
                { m: 9, n: 'سبتمبر' },
                { m: 10, n: 'أكتوبر' },
                { m: 11, n: 'نوفمبر' },
                { m: 12, n: 'ديسمبر' },
              ].map(item => (
                <option key={item.m} value={item.m}>
                  {item.m} - {item.n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">السنة:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">القسم:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع الأقسام</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الوظيفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-slate-800"
          />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-slate-800 font-mono">{totals.count}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">عدد الموظفين بالمسير</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-200 shadow-xs text-center">
          <div className="text-xl font-bold text-blue-700 font-mono">
            {formatEgyptianCurrency(totals.totalGross)}
          </div>
          <div className="text-xs text-blue-800 font-semibold mt-1">إجمالي الاستحقاقات والرواتب</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-200 shadow-xs text-center">
          <div className="text-xl font-bold text-rose-700 font-mono">
            {formatEgyptianCurrency(totals.totalDeductions)}
          </div>
          <div className="text-xs text-rose-800 font-semibold mt-1">إجمالي الاستقطاعات والخصومات</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 shadow-xs text-center">
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {formatEgyptianCurrency(totals.totalNet)}
          </div>
          <div className="text-xs text-emerald-800 font-semibold mt-1">صافي المرتبات المصروفة</div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الموظف / المعلم</th>
                <th className="p-3.5">القسم</th>
                <th className="p-3.5">الأساسي</th>
                <th className="p-3.5">البدلات</th>
                <th className="p-3.5">الإضافي</th>
                <th className="p-3.5">إجمالي الاستحقاق</th>
                <th className="p-3.5">خصم الغياب</th>
                <th className="p-3.5">خصم التأخير</th>
                <th className="p-3.5">التأمينات</th>
                <th className="p-3.5">إجمالي الخصم</th>
                <th className="p-3.5">صافي المرتب</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-12 text-center text-slate-400">
                    <Banknote className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">لا يوجد مسير رواتب مسجل لشهر {selectedMonth}/{selectedYear}</p>
                    <p className="text-xs text-slate-400 mt-1">اضغط على زر "احتساب مسير الشهر تلقائياً" للبدء</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{rec.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{rec.jobTitle}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{rec.department}</td>
                    <td className="p-3.5 font-mono text-slate-700">{formatEgyptianCurrency(rec.basicSalary)}</td>
                    <td className="p-3.5 font-mono text-slate-700">{formatEgyptianCurrency(rec.allowances + (rec.incentives || 0))}</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-semibold">{formatEgyptianCurrency(rec.overtimeAmount)}</td>
                    <td className="p-3.5 font-mono font-bold text-blue-700">{formatEgyptianCurrency(rec.totalGross)}</td>
                    <td className="p-3.5 font-mono text-rose-600">
                      {rec.absentDaysCount > 0 ? (
                        <span>-{formatEgyptianCurrency(rec.absenceDeductions)} ({rec.absentDaysCount} يوم)</span>
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
                      {rec.loanDeductions > 0 ? formatEgyptianCurrency(rec.loanDeductions) : '—'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-700">-{formatEgyptianCurrency(rec.totalDeductions)}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      {formatEgyptianCurrency(rec.netSalary)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

      {/* Salary Slip Modal */}
      {selectedRecordForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008e8b]" />
                <span>مفردات مرتب رسمية (Salary Slip)</span>
              </h3>
              <button onClick={() => setSelectedRecordForSlip(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6 bg-white" id="salarySlipPrintable">
              <div className="text-center border-b pb-4 border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">{settings.schoolName}</h2>
                <p className="text-xs text-slate-500">
                  كشف مفردات مرتب عن شهر: {selectedRecordForSlip.month} / {selectedRecordForSlip.year}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">اسم الموظف / المعلم:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRecordForSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">القسم / الإدارة:</span>
                  <span className="font-bold text-slate-800">{selectedRecordForSlip.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">المسمى الوظيفي:</span>
                  <span className="font-bold text-slate-800">{selectedRecordForSlip.jobTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة الصرف:</span>
                  <span className="font-bold text-emerald-700">{selectedRecordForSlip.status === 'Paid' ? 'مصروف' : 'معتمد'}</span>
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
                      <span className="font-mono font-bold text-rose-600">-{formatEgyptianCurrency(selectedRecordForSlip.loanDeductions)}</span>
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
                  تاريخ الطباعة: {formatEgyptianDate(new Date().toISOString())}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRecordForSlip(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                إغلاق
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
