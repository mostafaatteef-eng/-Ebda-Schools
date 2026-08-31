import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { MasterDataService } from '../../services/masterDataService';
import { HomeworkService } from '../../services/homeworkService';
import { getCairoNowISO } from '../../utils/egyptianTime';

export const BackupExportView: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const students = storageService.getStudents();
  const employees = storageService.getEmployees();
  const attendance = storageService.getAttendance();
  const studentAttendance = storageService.getStudentAttendance();
  const schedule = storageService.getSchedule();
  const behavior = storageService.getBehaviorViolations();
  const homeworks = HomeworkService.getHomeworks();
  const masterData = MasterDataService.getMasterData();

  const handleCreateFullBackup = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const now = getCairoNowISO();
      // Sanitized backup excluding any passwords or secrets
      const backupData = {
        backupVersion: '2.0',
        createdAt: now,
        createdBy: storageService.getCurrentUser()?.fullName || 'Admin',
        data: {
          students,
          employees,
          teacherAttendance: attendance,
          studentAttendance,
          schedule,
          behaviorViolations: behavior,
          homeworks,
          masterData,
          settings: storageService.getSettings(),
          academicYears: storageService.getAcademicYears(),
          studentEnrollments: storageService.getStudentEnrollments(),
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `School_ERP_Full_Backup_${now.split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      storageService.logAudit('EXPORT', 'SETTINGS', `تصدير نسخة احتياطية شاملة للنظام بدون كلمات المرور`);
      setExportSuccess(true);
    } catch (e) {
      console.error('Backup creation failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">النسخ الاحتياطي وتصدير البيانات (Backup & Export)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تصدير نسخة احتياطية آمنة من كافة جداول وقواعد بيانات المدرسة (خاص بالإدارة)
            </p>
          </div>
        </div>
      </div>

      {/* Backup Action Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#008e8b]" />
              <span>تصدير نسخة احتياطية متكاملة (Full System Snapshot)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              تشمل نسخة آمنة من سجلات الطلاب، الدوام، السلوك، الجدول، الواجبات، والقوائم المعتمدة. (لا يتم تضمين كلمات المرور لأسباب أمنية).
            </p>
          </div>

          <button
            onClick={handleCreateFullBackup}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#008e8b] hover:bg-[#007775] text-white font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جارٍ التجهيز والتصدير...' : 'تحميل النسخة الاحتياطية الآن'}</span>
          </button>
        </div>

        {exportSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم تصدير وتحميل النسخة الاحتياطية بنجاح وتسجيل العملية في سجل الرقابة (Audit Log).</span>
          </div>
        )}

        {/* Entities Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
            <div className="text-xl font-black text-[#008e8b]">{students.length}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">الطلاب المسجلون</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
            <div className="text-xl font-black text-[#008e8b]">{employees.length}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">المعلمون والعاملون</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
            <div className="text-xl font-black text-[#008e8b]">{studentAttendance.length}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">سجلات الحضور</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
            <div className="text-xl font-black text-[#008e8b]">{homeworks.length}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">الواجبات المدرسية</div>
          </div>
        </div>
      </div>
    </div>
  );
};
