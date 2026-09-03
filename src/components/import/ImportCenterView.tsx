import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  History,
  RotateCcw,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { User } from '../../types';
import {
  ImportBatchRecord,
  ImportDiffRow,
  ImportEntityType,
  ImportMode,
  ImportSummaryStats,
} from '../../types_extended';
import { ImportCenterService } from '../../services/importCenterService';
import * as XLSX from 'xlsx';

interface ImportCenterViewProps {
  currentUser: User | null;
}

type WizardStep = 'ENTITY_SELECT' | 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'EXECUTING' | 'RESULT';

export const ImportCenterView: React.FC<ImportCenterViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'HISTORY'>('WIZARD');

  // Wizard state
  const [step, setStep] = useState<WizardStep>('ENTITY_SELECT');
  const [entityType, setEntityType] = useState<ImportEntityType>('STUDENTS');
  const [mode, setMode] = useState<ImportMode>('ADD_UPDATE');
  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [allowedUpdateFields, setAllowedUpdateFields] = useState<string[]>([]);
  
  // Analysis results
  const [diffs, setDiffs] = useState<ImportDiffRow[]>([]);
  const [stats, setStats] = useState<ImportSummaryStats | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'NEW' | 'UPDATE' | 'NO_CHANGE' | 'CONFLICT' | 'ERROR'>('ALL');

  // Progress & Execution
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionResult, setExecutionResult] = useState<ImportBatchRecord | null>(null);
  const [batchHistory, setBatchHistory] = useState<ImportBatchRecord[]>(() =>
    ImportCenterService.getBatchHistory()
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Template Download helper
  const handleDownloadTemplate = (type: ImportEntityType) => {
    const defs = ImportCenterService.FIELD_DEFINITIONS[type];
    const sampleRow: Record<string, string> = {};
    defs.forEach(d => {
      sampleRow[d.label] = d.required ? 'قيمة إلزامية' : 'اختياري';
    });
    const ws = XLSX.utils.json_to_sheet([sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب_الاستيراد');
    XLSX.writeFile(wb, `قالب_استيراد_${type}.xlsx`);
  };

  // 2. File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        const { headers, rows } = ImportCenterService.parseSpreadsheet(buffer);
        setFileHeaders(headers);
        setRawRows(rows);

        // Auto suggest mappings
        const suggested = ImportCenterService.suggestMappings(headers, entityType);
        setColumnMappings(suggested);

        // Pre-select all update fields
        const allTargetFields = ImportCenterService.FIELD_DEFINITIONS[entityType].map(f => f.key);
        setAllowedUpdateFields(allTargetFields);

        setStep('MAPPING');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Analyze and transition to Preview
  const handleRunAnalysis = () => {
    const { diffs: computedDiffs, stats: computedStats } = ImportCenterService.analyzeImport(
      entityType,
      rawRows,
      columnMappings,
      mode
    );
    setDiffs(computedDiffs);
    setStats(computedStats);
    setStep('PREVIEW');
  };

  // 4. Run Execution
  const handleExecuteImport = async () => {
    setStep('EXECUTING');
    setExecutionProgress(0);

    const result = await ImportCenterService.executeImport(
      entityType,
      diffs,
      mode,
      fileName,
      allowedUpdateFields,
      currentUser,
      progress => setExecutionProgress(progress)
    );

    setExecutionResult(result);
    setBatchHistory(ImportCenterService.getBatchHistory());
    setStep('RESULT');
  };

  // 5. Rollback batch
  const handleRollback = (batchId: string) => {
    if (confirm('هل أنت متأكد من التراجع عن دفعة الاستيراد هذه؟ سيتم حذف السجلات الجديدة أو إعادة البيانات السابقة.')) {
      const ok = ImportCenterService.rollbackBatch(batchId, currentUser);
      if (ok) {
        alert('تم التراجع عن الدفعة بنجاح.');
        setBatchHistory(ImportCenterService.getBatchHistory());
      } else {
        alert('تعذر التراجع عن هذه الدفعة.');
      }
    }
  };

  // Reset wizard
  const handleResetWizard = () => {
    setStep('ENTITY_SELECT');
    setFileName('');
    setFileHeaders([]);
    setRawRows([]);
    setColumnMappings({});
    setDiffs([]);
    setStats(null);
    setExecutionResult(null);
  };

  const definitions = ImportCenterService.FIELD_DEFINITIONS[entityType];
  const filteredDiffs = diffs.filter(d => {
    if (previewFilter === 'ALL') return true;
    return d.classification === previewFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">مركز استيراد وتحديث البيانات الذكي (Import Center)</h1>
            <p className="text-xs text-slate-500 mt-1">
              استيراد جماعي مرن ومطابقة ذكية للطلاب والمعلمين مع فحص الفروق والتراجع الآمن
            </p>
          </div>
        </div>

        {/* Top Mode Toggles */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('WIZARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'WIZARD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>معالج الاستيراد والتحديث</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>سجل الدفعات والتراجع ({batchHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'HISTORY' ? (
        /* History & Rollback View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">سجل عمليات الاستيراد السابقة</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك مراجعة كافة الدفعات التي تم استيرادها والتراجع الفوري عنها إذا دعت الحاجة
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">رقم الدفعة</th>
                  <th className="py-3 px-4">نوع الكيان</th>
                  <th className="py-3 px-4">اسم الملف</th>
                  <th className="py-3 px-4 text-center">إجمالي الصفوف</th>
                  <th className="py-3 px-4 text-center">جديد</th>
                  <th className="py-3 px-4 text-center">محدث</th>
                  <th className="py-3 px-4 text-center">أخطاء</th>
                  <th className="py-3 px-4">تاريخ التنفيذ</th>
                  <th className="py-3 px-4">المنفذ</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {batchHistory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      لا توجد دفعات استيراد سابقة مسجلة.
                    </td>
                  </tr>
                ) : (
                  batchHistory.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="py-3 px-4">{b.entityType}</td>
                      <td className="py-3 px-4 text-slate-800">{b.fileName}</td>
                      <td className="py-3 px-4 text-center">{b.totalRows}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">+{b.addedCount}</td>
                      <td className="py-3 px-4 text-center text-teal-600 font-bold">{b.updatedCount}</td>
                      <td className="py-3 px-4 text-center text-rose-500 font-bold">{b.errorCount}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{b.createdAt.replace('T', ' ').slice(0, 16)}</td>
                      <td className="py-3 px-4">{b.createdBy}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            b.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'ROLLED_BACK'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200 line-through'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status === 'SUCCESS' ? 'مكتمل' : b.status === 'ROLLED_BACK' ? 'تم التراجع' : 'جزئي'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.rollbackPossible && !b.rolledBack && (
                          <button
                            onClick={() => handleRollback(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>تراجع</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Wizard Steps Container */
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between max-w-2xl mx-auto border-b border-slate-100 pb-4 text-xs font-bold">
            <div className={`flex items-center gap-2 ${step === 'ENTITY_SELECT' ? 'text-teal-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">1</span>
              <span>نوع البيانات</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-2 ${step === 'UPLOAD' ? 'text-teal-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">2</span>
              <span>رفع الملف</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-2 ${step === 'MAPPING' ? 'text-teal-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">3</span>
              <span>المطابقة</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-2 ${step === 'PREVIEW' ? 'text-teal-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">4</span>
              <span>فحص الفروق</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-2 ${step === 'RESULT' ? 'text-teal-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">5</span>
              <span>النتيجة</span>
            </div>
          </div>

          {/* STEP 1: ENTITY SELECT */}
          {step === 'ENTITY_SELECT' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-slate-800">اختر نوع البيانات ونمط الاستيراد</h2>
                <p className="text-xs text-slate-500">حدد الكيان المطلوب إدخاله أو تحديثه في قاعدة بيانات المدرسة</p>
              </div>

              {/* Entity Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: 'STUDENTS' as ImportEntityType, title: 'بيانات الطلاب وقيد الفصول', desc: 'الاسم، كود الطالب، الصف، الفصل، الرقم القومي، ولي الأمر', icon: GraduationCap },
                  { type: 'EMPLOYEES' as ImportEntityType, title: 'المعلمون والموظفون', desc: 'الاسم، الرقم الوظيفي، القسم، المسمى، الهاتف، تاريخ التعيين', icon: Users },
                  { type: 'TEACHERS' as ImportEntityType, title: 'المعلمون وتوزيع المواد', desc: 'سجل أعضاء هيئة التدريس والأقسام الأكاديمية', icon: Users },
                  { type: 'PARENTS' as ImportEntityType, title: 'أولياء الأمور وبيانات التواصل', desc: 'ربط أولياء الأمور بأبنائهم الطلاب وأرقام الطوارئ', icon: Users },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = entityType === item.type;
                  return (
                    <div
                      key={item.type}
                      onClick={() => setEntityType(item.type)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mode Selection */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">نمط معالجة البيانات المكررة:</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'ADD_UPDATE' as ImportMode, label: 'إضافة وتحديث معاً (موصى به)', desc: 'إضافة الجديد وتعديل الموجود' },
                    { id: 'ADD_ONLY' as ImportMode, label: 'إضافة الجديد فقط', desc: 'تجاهل الموجود' },
                    { id: 'UPDATE_ONLY' as ImportMode, label: 'تحديث الموجود فقط', desc: 'تجاهل السجلات الجديدة' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        mode === m.id
                          ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>{m.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadTemplate(entityType)}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل قالب إكسيل جاهز للملء ({entityType})</span>
                </button>

                <button
                  onClick={() => setStep('UPLOAD')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  <span>التالي: اختيار الملف</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD FILE */}
          {step === 'UPLOAD' && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-slate-800">رفع ملف البيانات (Excel / CSV)</h2>
                <p className="text-xs text-slate-500">يدعم الملفات بصيغة .xlsx و .xls و .csv بترميز UTF-8</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-3xl p-10 text-center cursor-pointer bg-slate-50 hover:bg-teal-50/20 transition-all space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">اسحب الملف وأفلته هنا أو انقر للتصفح</div>
                  <div className="text-xs text-slate-400 mt-1">حجم أقصى 10MB</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep('ENTITY_SELECT')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  السابق
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MAPPING */}
          {step === 'MAPPING' && (
            <div className="max-w-3xl mx-auto space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">مطابقة أعمدة الملف مع حقول النظام</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الملف: <strong>{fileName}</strong> (تم رصد {rawRows.length} سطر و {fileHeaders.length} عمود)
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadTemplate(entityType)}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  تحميل القالب النموذجي
                </button>
              </div>

              {/* Column Mapping Grid */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-2 text-xs font-bold text-slate-500 px-3 pb-2 border-b border-slate-200">
                  <div>اسم العمود في ملف الإكسيل</div>
                  <div>الحقل المقابل في نظام المدرسة</div>
                </div>

                {fileHeaders.map(colHeader => (
                  <div key={colHeader} className="grid grid-cols-2 gap-4 items-center px-3 py-1.5 bg-white rounded-xl border border-slate-200/60">
                    <div className="text-xs font-bold text-slate-800 truncate">{colHeader}</div>
                    <select
                      value={columnMappings[colHeader] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setColumnMappings(prev => ({ ...prev, [colHeader]: val }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- تجاهل هذا العمود --</option>
                      {definitions.map(def => (
                        <option key={def.key} value={def.key}>
                          {def.label} {def.required ? '(إلزامي)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Update Mask Fields (Which fields to overwrite on update) */}
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 space-y-2">
                <div className="text-xs font-bold text-amber-900">
                  تحديد الحقول المسموح بتحديثها في السجلات الموجودة مسبقاً:
                </div>
                <p className="text-[11px] text-amber-700">
                  يمكنك إلغاء تحديد بعض الحقول لحمايتها من التعديل (مثلاً إذا أردت تحديث أرقام الهواتف فقط دون المساس بالفصل أو الحالة):
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {definitions.map(def => {
                    const isAllowed = allowedUpdateFields.includes(def.key);
                    return (
                      <button
                        key={def.key}
                        onClick={() => {
                          if (isAllowed) {
                            setAllowedUpdateFields(prev => prev.filter(k => k !== def.key));
                          } else {
                            setAllowedUpdateFields(prev => [...prev, def.key]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isAllowed
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isAllowed && <Check className="w-3 h-3" />}
                        <span>{def.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep('UPLOAD')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  السابق
                </button>
                <button
                  onClick={handleRunAnalysis}
                  className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs"
                >
                  <span>فحص ومطابقة الفروق (Diff Preview)</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & DIFF */}
          {step === 'PREVIEW' && stats && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">نتائج الفحص والتحليل والمطابقة المسبقة</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    راجع حالة السجلات والتعديلات التفصيلية (Old Value → New Value) قبل تأكيد الحفظ في النظام
                  </p>
                </div>

                {stats.errorCount > 0 && (
                  <button
                    onClick={() =>
                      ImportCenterService.exportFailedRows(
                        diffs
                          .filter(d => d.classification === 'ERROR')
                          .map(d => ({ rowNumber: d.rowNumber, data: d.incomingData, reason: (d.issues || []).join('; ') })),
                        fileName
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير أخطاء الفحص ({stats.errorCount} صف)</span>
                  </button>
                )}
              </div>

              {/* Stats Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                {[
                  { id: 'ALL' as const, label: 'الكل', count: stats.totalRows, color: 'bg-slate-100 text-slate-800' },
                  { id: 'NEW' as const, label: 'إضافة جديد', count: stats.newCount, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                  { id: 'UPDATE' as const, label: 'تحديث سجل', count: stats.updateCount, color: 'bg-teal-50 text-teal-700 border border-teal-200' },
                  { id: 'NO_CHANGE' as const, label: 'بلا تغيير', count: stats.noChangeCount, color: 'bg-slate-50 text-slate-500 border border-slate-200' },
                  { id: 'CONFLICT' as const, label: 'تعارضات', count: stats.conflictCount, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
                  { id: 'ERROR' as const, label: 'أخطاء إدخال', count: stats.errorCount, color: 'bg-rose-50 text-rose-700 border border-rose-200' },
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setPreviewFilter(b.id)}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      previewFilter === b.id ? 'ring-2 ring-slate-900 shadow-xs' : 'opacity-85 hover:opacity-100'
                    } ${b.color}`}
                  >
                    <div className="text-lg font-black">{b.count}</div>
                    <div className="text-[11px] font-bold mt-0.5">{b.label}</div>
                  </button>
                ))}
              </div>

              {/* Detailed Diff Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-right text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-14">السطر</th>
                        <th className="py-2.5 px-3">الاسم / السجل</th>
                        <th className="py-2.5 px-3">المعرف</th>
                        <th className="py-2.5 px-3 text-center">التصنيف</th>
                        <th className="py-2.5 px-4">الفروق والتعديلات (Old Value → New Value)</th>
                        <th className="py-2.5 px-3">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredDiffs.map(d => (
                        <tr key={d.rowNumber} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 text-center font-mono text-slate-400">{d.rowNumber}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{d.displayName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{d.identifier}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                d.classification === 'NEW'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : d.classification === 'UPDATE'
                                  ? 'bg-teal-100 text-teal-800'
                                  : d.classification === 'ERROR'
                                  ? 'bg-rose-100 text-rose-800'
                                  : d.classification === 'CONFLICT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {d.classification === 'NEW'
                                ? 'جديد'
                                : d.classification === 'UPDATE'
                                ? 'تحديث'
                                : d.classification === 'ERROR'
                                ? 'خطأ'
                                : d.classification === 'CONFLICT'
                                ? 'تعارض'
                                : 'مطابق'}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {d.changes ? (
                              <div className="space-y-1">
                                {Object.entries(d.changes).map(([k, c]: [string, any]) => (
                                  <div key={k} className="text-[11px] flex items-center gap-2">
                                    <span className="text-slate-500 font-bold">{k}:</span>
                                    <span className="line-through text-rose-600 bg-rose-50 px-1 rounded">{c.oldValue || 'فارغ'}</span>
                                    <span className="text-slate-400">←</span>
                                    <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">{c.newValue}</span>
                                  </div>
                                ))}
                              </div>
                            ) : d.classification === 'NEW' ? (
                              <span className="text-emerald-600 text-[11px]">سيتم إنشاء السجل لأول مرة</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-rose-600 text-[11px] font-bold">
                            {(d.issues || []).join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep('MAPPING')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  السابق (تعديل المطابقة)
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={stats.newCount === 0 && stats.updateCount === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تأكيد واعتماد الاستيراد والتحديث</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: EXECUTING PROGRESS */}
          {step === 'EXECUTING' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center animate-pulse">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">جاري حفظ البيانات في قاعدة بيانات المدرسة...</h3>
                <p className="text-xs text-slate-500 mt-1">يتم معالجة السجلات وتحديث العلاقات وتأمين سجل الرقابة</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${executionProgress}%` }}
                />
              </div>
              <div className="text-xs font-bold text-teal-700">{executionProgress}% مكتمل</div>
            </div>
          )}

          {/* STEP 6: RESULT SUMMARY */}
          {step === 'RESULT' && executionResult && (
            <div className="max-w-xl mx-auto py-6 space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">اكتملت عملية الاستيراد بنجاح!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  رقم الدفعة المعتمدة: <strong className="font-mono text-slate-700">{executionResult.id}</strong>
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-xl font-black text-emerald-700">+{executionResult.addedCount}</div>
                  <div className="text-[11px] font-bold text-emerald-800 mt-0.5">جديد أضيف</div>
                </div>
                <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100">
                  <div className="text-xl font-black text-teal-700">{executionResult.updatedCount}</div>
                  <div className="text-[11px] font-bold text-teal-800 mt-0.5">سجل تم تحديثه</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xl font-black text-slate-600">{executionResult.skippedCount}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">تطابق وتجاهل</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="text-xl font-black text-rose-600">{executionResult.errorCount}</div>
                  <div className="text-[11px] font-bold text-rose-800 mt-0.5">أخطاء لم تكتمل</div>
                </div>
              </div>

              {executionResult.failedRows && executionResult.failedRows.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-right space-y-2">
                  <div className="text-xs font-bold text-rose-800">
                    تنبيه: يوجد {executionResult.failedRows.length} سطر لم يتم حفظها بسبب أخطاء في البيانات
                  </div>
                  <button
                    onClick={() =>
                      ImportCenterService.exportFailedRows(executionResult.failedRows!, fileName)
                    }
                    className="flex items-center gap-2 text-xs font-bold text-rose-700 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الصفوف غير المكتملة في ملف إكسيل مستقل</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleResetWizard}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  بدء عملية استيراد أخرى
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  سجل الدفعات والتراجع
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
