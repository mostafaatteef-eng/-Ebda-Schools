import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Banknote,
  BookOpen,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AcademicStage, SchoolHoliday, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import {
  DEFAULT_BEHAVIOR_RULES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_HOLIDAYS,
  DEFAULT_PAYROLL_RULES,
  DEFAULT_STAGES,
} from '../../data/initialData';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: User | null;
}

type TabKey = 'general' | 'stages' | 'holidays' | 'behavior' | 'payroll' | 'backup';

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    stages: settings.stages || DEFAULT_STAGES,
    departments: settings.departments || DEFAULT_DEPARTMENTS,
    holidays: settings.holidays || DEFAULT_HOLIDAYS,
    behaviorScoreRules: settings.behaviorScoreRules || DEFAULT_BEHAVIOR_RULES,
    payrollRules: settings.payrollRules || DEFAULT_PAYROLL_RULES,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendTestStatus, setBackendTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const handleCheckboxChange = (day: string) => {
    const currentDays = formData.weekendDays || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        weekendDays: currentDays.filter(d => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        weekendDays: [...currentDays, day],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setBackendTestStatus(null);
    try {
      const ok = await storageService.syncWithGoogleSheets(false);
      if (ok) {
        setBackendTestStatus({ success: true, message: 'تم الاتصال بقاعدة بيانات Google Sheets بنجاح!' });
      } else {
        setBackendTestStatus({ success: false, message: 'تعذر الاتصال بـ Google Apps Script، يرجى فحص الرابط وصلاحيات النشر' });
      }
    } catch (err: any) {
      setBackendTestStatus({ success: false, message: err.message || 'خطأ في الاتصال' });
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleExportFullBackup = () => {
    const employees = storageService.getEmployees();
    const students = storageService.getStudents();
    const attendance = storageService.getAttendance();
    const studentAttendance = storageService.getStudentAttendance();
    const leaves = storageService.getLeaves();
    const users = storageService.getUsers();
    const payroll = storageService.getPayrollRecords();
    const violations = storageService.getBehaviorViolations();
    const schedule = storageService.getSchedule();

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), 'الطلاب');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentAttendance), 'حضور_الطلاب');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employees), 'الموظفون_والمعلمون');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendance), 'حضور_الموظفين');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payroll), 'مسير_الرواتب');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(violations), 'سجل_السلوك_والمخالفات');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedule), 'الجدول_المدرسي');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leaves), 'الإجازات');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), 'المستخدمون');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `نسخة_احتياطية_شاملة_للنظام_${dateStr}.xlsx`);
  };

  const allWeekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <span>محرك إعدادات النظام المدرسي وقواعد العمل (مصر)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة المراحل الدراسية، اللائحة الانضباطية، قواعد الرواتب، العطلات الرسمية، وربط Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2.5 rounded-2xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير نسخة احتياطية شاملة (Excel)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ وتطبيق كافة إعدادات وسياسات المدرسة بنجاح!</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'general' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          بيانات المدرسة والدوام
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'stages' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          المراحل والصفوف الدراسية
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('behavior')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'behavior' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          قواعد السلوك والانضباط
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'payroll' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          محرك الرواتب والاستقطاعات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'holidays' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          العطلات الرسمية لمصر ({formData.holidays?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'backup' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          الربط السحابي (Google Sheets)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: General & School Info */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800">بيانات المدرسة والعام الدراسي</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">اسم الصرح التعليمي / المدرسة</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.schoolName || ''}
                    onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">العام الدراسي الحالي</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.currentAcademicYear || '2025/2026'}
                    onChange={e => setFormData({ ...formData, currentAcademicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">الفصل الدراسي الحالي</label>
                  <select
                    disabled={!isAdmin}
                    value={formData.currentSemester || 'الفصل الدراسي الثاني'}
                    onChange={e => setFormData({ ...formData, currentSemester: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    <option value="الفصل الصيفي">الفصل الصيفي</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Official Timing */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800">مواعيد اليوم الدراسي وفترة السماح (توقيت القاهرة)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">طابور الصباح / بداية الدوام</label>
                  <input
                    type="time"
                    disabled={!isAdmin}
                    value={formData.officialStartTime || '07:30'}
                    onChange={e => setFormData({ ...formData, officialStartTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">نهاية اليوم الدراسي والانصراف</label>
                  <input
                    type="time"
                    disabled={!isAdmin}
                    value={formData.officialEndTime || '14:30'}
                    onChange={e => setFormData({ ...formData, officialEndTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">فترة السماح للطلاب والموظفين (بالدقائق)</label>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    min="0"
                    max="60"
                    value={formData.gracePeriodMinutes ?? 15}
                    onChange={e => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Weekend Days */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800">أيام العطلة الأسبوعية المدرسية (مصر)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1">
                {allWeekDays.map(day => {
                  const isSelected = (formData.weekendDays || []).includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#008e8b]/10 border-[#008e8b] text-[#008e8b]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(day)}
                        className="rounded text-[#008e8b] focus:ring-[#008e8b]"
                      />
                      <span>{day}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Academic Stages */}
        {activeTab === 'stages' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800">المراحل والصفوف والفصول الدراسية</h3>
              </div>
            </div>

            <div className="space-y-4">
              {formData.stages?.map((st, idx) => (
                <div key={st.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{st.name}</span>
                    <span className="text-xs text-slate-500 font-mono">كود المرحلة: {st.code}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {st.grades.map(grade => (
                      <div key={grade.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                        <div className="font-bold text-teal-800">{grade.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          الفصول المعتمدة: {grade.classrooms.join(' ، ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Behavior Rules */}
        {activeTab === 'behavior' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-[#008e8b]" />
              <h3 className="text-sm font-bold text-slate-800">إعدادات لائحة الانضباط المدرسي</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رصيد السلوك المبدئي للطلبة (الدرجة الكاملة)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.behaviorScoreRules?.initialScore ?? 100}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      behaviorScoreRules: {
                        ...formData.behaviorScoreRules!,
                        initialScore: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">حد التحذير ولفت النظر (درجة)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.behaviorScoreRules?.warningThreshold ?? 70}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      behaviorScoreRules: {
                        ...formData.behaviorScoreRules!,
                        warningThreshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">حد الخطر واستدعاء ولي الأمر (درجة)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.behaviorScoreRules?.dangerThreshold ?? 50}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      behaviorScoreRules: {
                        ...formData.behaviorScoreRules!,
                        dangerThreshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Payroll Rules */}
        {activeTab === 'payroll' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Banknote className="w-5 h-5 text-[#008e8b]" />
              <h3 className="text-sm font-bold text-slate-800">قواعد محرك الرواتب والاستقطاعات المدرسية (مصر)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">أيام العمل المعتمدة لحساب أجر اليوم</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.payrollRules?.workDaysPerMonth ?? 30}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      payrollRules: {
                        ...formData.payrollRules!,
                        workDaysPerMonth: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">معامل خصم يوم الغياب (مضاعف)</label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={formData.payrollRules?.absenceDeductionMultiplier ?? 1.0}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      payrollRules: {
                        ...formData.payrollRules!,
                        absenceDeductionMultiplier: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">معامل الساعة الإضافية</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={formData.payrollRules?.overtimeRate ?? 1.5}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      payrollRules: {
                        ...formData.payrollRules!,
                        overtimeRate: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نسبة استقطاع التأمينات الاجتماعية (%)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.payrollRules?.socialInsuranceRate ?? 11}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      payrollRules: {
                        ...formData.payrollRules!,
                        socialInsuranceRate: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Holidays */}
        {activeTab === 'holidays' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800">قائمة العطلات الرسمية المعتمدة بجمهورية مصر العربية</h3>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المناسبة / العطلة</th>
                    <th className="p-3">تاريخ البداية</th>
                    <th className="p-3">تاريخ النهاية</th>
                    <th className="p-3">النوع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.holidays?.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-800">{h.name}</td>
                      <td className="p-3 font-mono text-slate-700">{h.startDate}</td>
                      <td className="p-3 font-mono text-slate-700">{h.endDate}</td>
                      <td className="p-3 text-slate-600">{h.type === 'National' ? 'عطلة وطنية' : 'عطلة دينية'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Cloud Connection */}
        {activeTab === 'backup' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-[#008e8b]" />
              <h3 className="text-sm font-bold text-slate-800">إعدادات ربط Google Apps Script & Sheets</h3>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رابط Web App (Google Apps Script URL)</label>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.googleAppsScriptUrl || ''}
                  onChange={e => setFormData({ ...formData, googleAppsScriptUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isTestingBackend}
                  onClick={handleTestBackend}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
                >
                  {isTestingBackend ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>اختبار المزامنة الآن</span>
                </button>
              </div>

              {backendTestStatus && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    backendTestStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {backendTestStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{backendTestStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-[#008e8b] hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق جميع الإعدادات والقواعد</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
