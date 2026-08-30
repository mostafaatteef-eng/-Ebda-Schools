import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  GraduationCap,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { AcademicStructureTab } from './AcademicStructureTab';
import { ScheduleConfigTab } from './ScheduleConfigTab';
import { AttendanceRulesTab } from './AttendanceRulesTab';
import { BehaviorRulesTab } from './BehaviorRulesTab';
import { StaffConfigTab } from './StaffConfigTab';
import { FinancialRulesTab } from './FinancialRulesTab';
import {
  DEFAULT_ALERT_RULES,
  DEFAULT_BEHAVIOR_LEVELS,
  DEFAULT_BEHAVIOR_RULES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_FEE_CATEGORIES,
  DEFAULT_HOLIDAYS,
  DEFAULT_INSTALLMENT_PLANS,
  DEFAULT_JOB_TITLES,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PAYROLL_RULES,
  DEFAULT_PERMISSION_TYPES,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_STAGES,
  DEFAULT_STUDENT_ATTENDANCE_RULES,
  DEFAULT_STUDENT_ATTENDANCE_STATUSES,
  DEFAULT_TEACHER_ATTENDANCE_RULES,
} from '../../data/initialData';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: User | null;
}

export type TabKey =
  | 'general'
  | 'academic'
  | 'schedule'
  | 'attendance'
  | 'behavior'
  | 'staff'
  | 'financial'
  | 'holidays'
  | 'backup';

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    stages: settings.stages || DEFAULT_STAGES,
    departments: settings.departments || DEFAULT_DEPARTMENTS,
    jobTitles: settings.jobTitles || DEFAULT_JOB_TITLES,
    leaveTypes: settings.leaveTypes || DEFAULT_LEAVE_TYPES,
    permissionTypes: settings.permissionTypes || DEFAULT_PERMISSION_TYPES,
    feeCategories: settings.feeCategories || DEFAULT_FEE_CATEGORIES,
    installmentPlans: settings.installmentPlans || DEFAULT_INSTALLMENT_PLANS,
    paymentMethods: settings.paymentMethods || DEFAULT_PAYMENT_METHODS,
    scheduleConfig: settings.scheduleConfig || DEFAULT_SCHEDULE_CONFIG,
    studentAttendanceStatuses: settings.studentAttendanceStatuses || DEFAULT_STUDENT_ATTENDANCE_STATUSES,
    studentAttendanceRules: settings.studentAttendanceRules || DEFAULT_STUDENT_ATTENDANCE_RULES,
    teacherAttendanceRules: settings.teacherAttendanceRules || DEFAULT_TEACHER_ATTENDANCE_RULES,
    behaviorScoreRules: settings.behaviorScoreRules || DEFAULT_BEHAVIOR_RULES,
    behaviorLevels: settings.behaviorLevels || DEFAULT_BEHAVIOR_LEVELS,
    alertRules: settings.alertRules || DEFAULT_ALERT_RULES,
    payrollRules: settings.payrollRules || DEFAULT_PAYROLL_RULES,
    holidays: settings.holidays || DEFAULT_HOLIDAYS,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendTestStatus, setBackendTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setBackendTestStatus(null);
    try {
      const ok = await storageService.syncWithGoogleSheets(false);
      if (ok) {
        setBackendTestStatus({ success: true, message: 'تم الاتصال بقاعدة بيانات Google Sheets بنجاح!' });
      } else {
        setBackendTestStatus({
          success: false,
          message: 'تعذر الاتصال بـ Google Apps Script، يرجى فحص الرابط وصلاحيات النشر (Web App Exec)',
        });
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

  const handleExportSettingsJSON = () => {
    const jsonStr = storageService.exportSettingsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_config_v${formData.configVersion || '1.0.0'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettingsJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const success = storageService.importSettingsJSON(text);
        if (success) {
          setFormData(storageService.getSettings());
          alert('تم استيراد وتطبيق ملف الإعدادات بنجاح!');
        } else {
          alert('فشل استيراد الملف، تأكد من صحة تنسيق JSON');
        }
      } catch (err: any) {
        alert(`خطأ في قراءة الملف: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'تحذير خطير: هل أنت متأكد من إعادة ضبط كافة إعدادات النظام وقواعد التشغيل إلى القيم المصنعية الافتراضية؟'
      )
    ) {
      storageService.resetToFactorySettings();
      setFormData(storageService.getSettings());
      alert('تمت إعادة ضبط جميع إعدادات النظام إلى القيم الافتراضية بنجاح.');
    }
  };

  return (
    <div className="space-y-6" id="settings_main_view">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  محرك إدارة وتشغيل النظام المدرسي الديناميكي
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                  v{formData.configVersion || '1.0.0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعديل كامل الهيكل الأكاديمي، الحصص، لائحة السلوك، دوام الموظفين، والرسوم بدون الحاجة لتعديل الكود
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportSettingsJSON}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>تصدير ملف الإعدادات (JSON)</span>
          </button>

          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>استيراد إعدادات</span>
            <input type="file" accept=".json" onChange={handleImportSettingsJSON} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportFullBackup}
            className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>نسخة احتياطية (Excel)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ وتطبيق كافة إعدادات وسياسات المدرسة وتحديث رقم الإصدار بنجاح!</span>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          الهوية والبيانات العامة
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('academic')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'academic'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          الهيكل الأكاديمي والصفوف
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          الجدول والحصص والفسح
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          قواعد الحضور والدوام
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('behavior')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'behavior'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          السلوك ولائحة الانضباط
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          الأقسام والكادر والإجازات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'financial'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Banknote className="w-4 h-4" />
          الرسوم والرواتب والأقساط
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'holidays'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          العطلات الرسمية ({formData.holidays?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          الربط السحابي والنسخ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: General & School Info */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <Building className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">بيانات وهوية الصرح التعليمي</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم المدرسة / الصرح التعليمي *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={formData.schoolName || ''}
                    onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العام الدراسي الفعال *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={formData.currentAcademicYear || '2025/2026'}
                    onChange={e => setFormData({ ...formData, currentAcademicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الفصل الدراسي الحالي</label>
                  <select
                    disabled={!isAdmin}
                    value={formData.currentSemester || 'الفصل الدراسي الثاني'}
                    onChange={e => setFormData({ ...formData, currentSemester: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    <option value="الفصل الصيفي">الفصل الصيفي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الرقم التعريفي للمنشأة / كود المدرسة الوزاري</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.schoolCode || 'SCH_EG_2025'}
                    onChange={e => setFormData({ ...formData, schoolCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">شعار المدرسة (رابط الصورة Logo URL)</label>
                  <input
                    type="url"
                    disabled={!isAdmin}
                    value={formData.logoUrl || ''}
                    placeholder="https://example.com/logo.png"
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Academic Structure */}
        {activeTab === 'academic' && (
          <AcademicStructureTab formData={formData} setFormData={setFormData} />
        )}

        {/* TAB 3: Schedule Config */}
        {activeTab === 'schedule' && (
          <ScheduleConfigTab formData={formData} setFormData={setFormData} />
        )}

        {/* TAB 4: Attendance Rules */}
        {activeTab === 'attendance' && (
          <AttendanceRulesTab formData={formData} setFormData={setFormData} />
        )}

        {/* TAB 5: Behavior Rules */}
        {activeTab === 'behavior' && (
          <BehaviorRulesTab formData={formData} setFormData={setFormData} />
        )}

        {/* TAB 6: Staff & Leave Config */}
        {activeTab === 'staff' && (
          <StaffConfigTab formData={formData} setFormData={setFormData} />
        )}

        {/* TAB 7: Financial & Payroll Rules */}
        {activeTab === 'financial' && (
          <FinancialRulesTab formData={formData} setFormData={setFormData} userRole={currentUser?.role} />
        )}

        {/* TAB 8: Holidays */}
        {activeTab === 'holidays' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">قائمة العطلات الرسمية المعتمدة بجمهورية مصر العربية</h3>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المناسبة / العطلة</th>
                    <th className="p-3">تاريخ البداية</th>
                    <th className="p-3">تاريخ النهاية</th>
                    <th className="p-3">النوع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {formData.holidays?.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{h.name}</td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{h.startDate}</td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{h.endDate}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{h.type === 'National' ? 'عطلة وطنية' : 'عطلة دينية'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: Cloud Connection & System Reset */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <Database className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">إعدادات ربط Google Apps Script & Sheets</h3>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رابط Web App (Google Apps Script URL)</label>
                  <input
                    type="url"
                    disabled={!isAdmin}
                    value={formData.googleAppsScriptUrl || ''}
                    onChange={e => setFormData({ ...formData, googleAppsScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isTestingBackend}
                    onClick={handleTestBackend}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
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

            {/* Factory Reset Danger Zone */}
            {isAdmin && (
              <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-rose-200 dark:border-rose-900/40 pb-3">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">منطقة العمليات الحساسة (إعادة الضبط المصنعي)</h3>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  إعادة تهيئة جميع إعدادات النظام (الصفوف، الفصول، المواد، القواعد، الرسوم) إلى القيم المصنعية الأولية بدون التأثير على بيانات الطلاب المسجلين.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة ضبط المصنع لجميع الإعدادات</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Save Button */}
        {isAdmin && (
          <div className="flex justify-end pt-4 sticky bottom-4 z-20">
            <button
              type="submit"
              className="px-8 py-3.5 bg-[#008e8b] hover:bg-teal-700 text-white text-sm font-bold rounded-2xl shadow-xl transition-all flex items-center gap-2 border-2 border-white/20"
            >
              <Save className="w-5 h-5" />
              <span>حفظ وتطبيق جميع الإعدادات والقواعد المحدثة</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
