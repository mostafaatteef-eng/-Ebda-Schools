import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCheck,
  FileText,
  History,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { User } from '../../types';
import { BackupType, RestoreValidationReport, SystemBackupMetadata, SystemBackupPackage } from '../../types_extended';
import { BackupRestoreService } from '../../services/backupRestoreService';
import { formatEgyptianDate, getCairoCurrentDate } from '../../utils/egyptianTime';

interface BackupRestoreViewProps {
  currentUser: User | null;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'Admin';
  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE' | 'HISTORY'>('BACKUP');

  // Backup state
  const [selectedType, setSelectedType] = useState<BackupType>('FULL');
  const [description, setDescription] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [lastBackupCreated, setLastBackupCreated] = useState<SystemBackupMetadata | null>(null);

  // Restore state
  const [restoreStep, setRestoreStep] = useState<'UPLOAD' | 'PREVIEW' | 'CONFIRM' | 'SUCCESS'>('UPLOAD');
  const [uploadedPackage, setUploadedPackage] = useState<SystemBackupPackage | null>(null);
  const [validationReport, setValidationReport] = useState<RestoreValidationReport | null>(null);
  const [safetyBackupId, setSafetyBackupId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<SystemBackupMetadata[]>(() =>
    BackupRestoreService.getBackupHistory()
  );

  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2">
        <ShieldAlert className="w-10 h-10 mx-auto text-rose-600" />
        <h2 className="text-base font-bold">غير مصرح بالدخول (403 Forbidden)</h2>
        <p className="text-xs text-rose-600">
          وحدة النسخ الاحتياطي واستعادة البيانات محصورة بالكامل على حساب مدير النظام الأعلى.
        </p>
      </div>
    );
  }

  // Handle Backup Creation
  const handleCreateBackup = () => {
    setIsBackingUp(true);
    try {
      const { backupPackage, jsonString } = BackupRestoreService.createBackup(
        selectedType,
        description,
        currentUser
      );
      setLastBackupCreated(backupPackage.metadata);
      setHistory(BackupRestoreService.getBackupHistory());

      // Trigger download
      const filename = `School_Backup_${selectedType}_${getCairoCurrentDate()}`;
      BackupRestoreService.downloadBackupFile(jsonString, filename);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle Restore File Upload & Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const content = evt.target?.result as string;
        const parsed: SystemBackupPackage = JSON.parse(content);
        const report = BackupRestoreService.validateBackupForRestore(parsed);
        setUploadedPackage(parsed);
        setValidationReport(report);
        if (report.isValid) {
          setRestoreStep('PREVIEW');
        } else {
          setRestoreError('الملف غير صالح للاستعادة: ' + report.incompatibilities.join(', '));
        }
      } catch (err) {
        setRestoreError('تعذر قراءة ملف النسخة الاحتياطية. تأكد من أنه ملف JSON سليم تم تصديره من النظام.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Restore Execution
  const handleExecuteRestore = () => {
    if (!uploadedPackage) return;
    setIsRestoring(true);
    setRestoreError(null);
    try {
      const res = BackupRestoreService.executeRestore(uploadedPackage, currentUser);
      setSafetyBackupId(res.safetyBackupId);
      setHistory(BackupRestoreService.getBackupHistory());
      setRestoreStep('SUCCESS');
    } catch (err: any) {
      setRestoreError(err.message || 'فشلت عملية الاستعادة.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">النسخ الاحتياطي واستعادة البيانات الآمن</h1>
            <p className="text-xs text-slate-500 mt-1">
              تأمين قواعد البيانات مع تطهير الأسرار وحماية الاستعادة بنسخة أمان تلقائية (Safety Backup)
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BACKUP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>تصدير نسخة احتياطية</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('RESTORE');
              setRestoreStep('UPLOAD');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RESTORE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>استعادة البيانات</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>سجل النسخ ({history.length})</span>
          </button>
        </div>
      </div>

      {/* 1. BACKUP TAB */}
      {activeTab === 'BACKUP' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-slate-800">إنشاء وتنزيل نسخة احتياطية جديدة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              حدد النطاق المطلوب حفظه، يتم تشفير البيانات واستبعاد الأسرار مثل كلمات المرور ورموز التوكن
            </p>
          </div>

          {/* Backup Types Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { type: 'FULL' as BackupType, title: 'نسخة شاملة لكل الكيانات (Full)', desc: 'الطلاب، المعلمين، الحضور، الإعدادات، السلوك، والمالية' },
              { type: 'ACADEMIC' as BackupType, title: 'البيانات الأكاديمية والطلاب', desc: 'الطلاب، الحضور والغياب، الحصص، والواجبات' },
              { type: 'HR' as BackupType, title: 'شؤون المعلمين والموظفين', desc: 'الموظفون، دوام الموظفين، الإجازات، والأذونات' },
              { type: 'PAYROLL' as BackupType, title: 'محرك ومسير الرواتب (Admin Only)', desc: 'السجلات المالية واللقطات الشهرية المقفلة' },
              { type: 'CONFIG' as BackupType, title: 'تهيئة وإعدادات النظام', desc: 'الأعوام الدراسية، الفصول، المواد، والتعريفات' },
            ].map(item => {
              const isSelected = selectedType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Security Sanitization Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-emerald-900">حماية أمنية وتطهير إجباري للبيانات السرية (Sanitization)</div>
              <p className="text-emerald-700 leading-relaxed">
                يقوم النظام تلقائياً بتجريد ملف النسخة الاحتياطية من أي كلمات مرور صريحة أو مشفرة، وتفريغ جلسات التوكن
                ومفاتيح الـ JWT لضمان عدم تسريب أي أسرار في حال تم تداول الملف.
              </p>
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ملاحظات أو وصف لهذه النسخة (اختياري):</label>
            <input
              type="text"
              value={description}
              placeholder="مثال: نسخة نهاية الفصل الدراسي الأول لعام 2025"
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isBackingUp ? 'جاري تجهيز النسخة...' : 'إنشاء وتنزيل النسخة الاحتياطية الآن'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. RESTORE TAB */}
      {activeTab === 'RESTORE' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 max-w-3xl mx-auto">
          {restoreError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}

          {restoreStep === 'UPLOAD' && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-800">استعادة قاعدة البيانات من ملف نسخة احتياطية</h2>
                <p className="text-xs text-slate-500">اختر ملف .json تم تنزيله سابقاً من هذا النظام</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-10 text-center cursor-pointer bg-slate-50 hover:bg-amber-50/20 transition-all space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">انقر لاختيار ملف النسخة الاحتياطية (.json)</div>
                  <div className="text-xs text-slate-400 mt-1">يتم التحقق من سلامة الهيكل وإصدار المخطط فورياً</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {restoreStep === 'PREVIEW' && validationReport && (
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">تقرير فحص وتأثير الاستعادة (Restore Impact)</h3>
                  <p className="text-xs text-slate-500">
                    تاريخ إنشاء الملف: {validationReport.sourceCreatedDate} | المنفذ: {validationReport.sourceCreatedBy}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  ملف متوافق وصالح
                </span>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-amber-800">
                  <div className="font-bold">تأمين تلقائي للبيانات الحالية قبل الاستبدال</div>
                  <p className="leading-relaxed">
                    سيقوم النظام بإنشاء نسخة أمان تلقائية (Safety Backup) لبيانات المدرسة الحالية قبل بدء الاستعادة،
                    مما يضمن إمكانية التراجع في أي لحظة.
                  </p>
                </div>
              </div>

              {/* Impact Estimate Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">الكيان / الجدول</th>
                      <th className="py-2.5 px-3 text-center">العدد الحالي</th>
                      <th className="py-2.5 px-3 text-center">العدد القادم بالنسخة</th>
                      <th className="py-2.5 px-3">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {Object.entries(validationReport.impactEstimate).map(([k, v]: [string, any]) => (
                      <tr key={k}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{k}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{v.currentCount}</td>
                        <td className="py-2.5 px-3 text-center text-indigo-700 font-mono font-bold">{v.incomingCount}</td>
                        <td className="py-2.5 px-3 text-amber-700 font-bold">{v.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setRestoreStep('UPLOAD')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء واختيار ملف آخر
                </button>
                <button
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isRestoring ? 'جاري الاستعادة...' : 'تأكيد واستعادة البيانات'}</span>
                </button>
              </div>
            </div>
          )}

          {restoreStep === 'SUCCESS' && (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">تمت استعادة البيانات بنجاح!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  تم استبدال الكيانات بنجاح وتأمين نسخة أمان برقم:{' '}
                  <strong className="font-mono text-slate-800">{safetyBackupId}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('HISTORY');
                  setRestoreStep('UPLOAD');
                }}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                عرض سجل النسخ الاحتياطية
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">أرشيف النسخ الاحتياطية ونسخ الأمان</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              قائمة بالنسخ التي تم إنشاؤها يدوياً أو تلقائياً قبل عمليات الاستعادة
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">رقم النسخة</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">الوصف</th>
                  <th className="py-3 px-4">تاريخ الإنشاء</th>
                  <th className="py-3 px-4">المنفذ</th>
                  <th className="py-3 px-4 text-center">الحجم التقديري</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      لا توجد نسخ احتياطية مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  history.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {b.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{b.description}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {b.createdAt.replace('T', ' ').slice(0, 16)}
                      </td>
                      <td className="py-3 px-4">{b.createdBy}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {b.sizeEstimateBytes ? `${Math.round(b.sizeEstimateBytes / 1024)} KB` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ناجحة
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
