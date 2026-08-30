import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Student } from '../../types';
import { storageService } from '../../services/storageService';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'students' | 'employees';
  onImportComplete?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'result';

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'students',
  onImportComplete,
}) => {
  const [mode, setMode] = useState<'students' | 'employees'>(defaultMode);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<{ added: number; updated: number; ignored: number; errors: number }>({
    added: 0,
    updated: 0,
    ignored: 0,
    errors: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Student Fields
  const studentFieldDefs = [
    { key: 'name', label: 'اسم الطالب رباعي', required: true, aliases: ['الاسم', 'اسم الطالب', 'اسم الطالب رباعي', 'student name', 'name'] },
    { key: 'studentCode', label: 'كود الطالب / رقم الجلوس', required: false, aliases: ['الكود', 'كود الطالب', 'رقم الجلوس', 'code', 'student code', 'id'] },
    { key: 'nationalId', label: 'الرقم القومي للطالب', required: false, aliases: ['الرقم القومي', 'بطاقة', 'national id', 'ssn'] },
    { key: 'stage', label: 'المرحلة الدراسية', required: false, aliases: ['المرحلة', 'المرحلة الدراسية', 'stage'] },
    { key: 'grade', label: 'الصف الدراسي', required: true, aliases: ['الصف', 'الصف الدراسي', 'السنة', 'grade'] },
    { key: 'classroom', label: 'الفصل / الشعبة', required: true, aliases: ['الفصل', 'الشعبة', 'القاعة', 'classroom', 'class'] },
    { key: 'gender', label: 'النوع (ذكر / أنثى)', required: false, aliases: ['النوع', 'الجنس', 'gender'] },
    { key: 'parentName', label: 'اسم ولي الأمر', required: false, aliases: ['ولي الأمر', 'اسم ولي الأمر', 'parent name', 'guardian'] },
    { key: 'parentPhone', label: 'رقم هاتف ولي الأمر', required: false, aliases: ['تليفون ولي الأمر', 'موبايل ولي الأمر', 'هاتف ولي الأمر', 'parent phone', 'phone'] },
    { key: 'phone', label: 'هاتف الطالب', required: false, aliases: ['هاتف الطالب', 'موبايل الطالب', 'student phone'] },
    { key: 'address', label: 'العنوان', required: false, aliases: ['العنوان', 'السكن', 'address'] },
    { key: 'notes', label: 'ملاحظات', required: false, aliases: ['ملاحظات', 'notes', 'بيان'] },
  ];

  // Employee/Teacher Fields
  const employeeFieldDefs = [
    { key: 'name', label: 'اسم الموظف / المعلم', required: true, aliases: ['الاسم', 'اسم الموظف', 'اسم المعلم', 'name', 'full name'] },
    { key: 'id', label: 'الرقم الوظيفي / الكود', required: false, aliases: ['الكود', 'الرقم الوظيفي', 'كود الموظف', 'emp id', 'code', 'id'] },
    { key: 'jobTitle', label: 'المسمى الوظيفي / التخصص', required: true, aliases: ['الوظيفة', 'المسمى الوظيفي', 'التخصص', 'المادة', 'job title', 'role'] },
    { key: 'department', label: 'القسم / الإدارة', required: true, aliases: ['القسم', 'الإدارة', 'department', 'dept'] },
    { key: 'nationalId', label: 'الرقم القومي', required: false, aliases: ['الرقم القومي', 'بطاقة الرقم القومي', 'national id'] },
    { key: 'basicSalary', label: 'الراتب الأساسي (ج.م)', required: false, aliases: ['الراتب', 'المرتب', 'الأساسي', 'الراتب الأساسي', 'salary', 'basic salary'] },
    { key: 'phone', label: 'رقم الهاتف', required: false, aliases: ['الهاتف', 'الموبايل', 'رقم الهاتف', 'phone', 'mobile'] },
    { key: 'email', label: 'البريد الإلكتروني', required: false, aliases: ['البريد', 'الإيميل', 'email'] },
    { key: 'hireDate', label: 'تاريخ التعيين', required: false, aliases: ['تاريخ التعيين', 'التعيين', 'hire date'] },
  ];

  const currentFieldDefs = mode === 'students' ? studentFieldDefs : employeeFieldDefs;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length === 0) {
          alert('الملف فارغ، يرجى اختيار ملف يحتوي على بيانات');
          return;
        }

        const headers = (data[0] || []).map(h => String(h || '').trim()).filter(Boolean);
        const rows = data.slice(1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== ''));

        setRawHeaders(headers);
        setRawRows(rows);

        // Auto Mapping detection
        const autoMap: Record<string, string> = {};
        currentFieldDefs.forEach(field => {
          const match = headers.find(header => {
            const hClean = header.toLowerCase().replace(/[\s_\-]/g, '');
            return field.aliases.some(alias => hClean === alias.toLowerCase().replace(/[\s_\-]/g, ''));
          });
          if (match) {
            autoMap[field.key] = match;
          }
        });

        setColumnMapping(autoMap);
        setStep('mapping');
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من سلامة الملف وصيغته.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadSampleTemplate = () => {
    const settings = storageService.getSettings();
    const stages = settings.stages || [];
    const firstStage = stages[0];
    const firstGrade = firstStage?.grades[0];
    const secondGrade = firstStage?.grades[1] || firstStage?.grades[0];
    const departments = settings.departments || [];
    const jobTitles = settings.jobTitles || [];

    if (mode === 'students') {
      const sampleData = [
        {
          'اسم الطالب رباعي': 'أحمد محمد إبراهيم حسن',
          'كود الطالب': 'STD-1001',
          'الرقم القومي': '30805120102345',
          'المرحلة': firstStage?.name || 'المرحلة الثانوية',
          'الصف الدراسي': firstGrade?.name || 'الصف الأول الثانوي',
          'الفصل': firstGrade?.classrooms[0] || '1/1',
          'النوع': 'ذكر',
          'اسم ولي الأمر': 'محمد إبراهيم حسن',
          'رقم هاتف ولي الأمر': '01012345678',
          'هاتف الطالب': '01123456789',
          'العنوان': 'القاهرة - مصر الجديدة',
          'ملاحظات': 'طالب متفوق',
        },
        {
          'اسم الطالب رباعي': 'سارة طارق عبد الله علي',
          'كود الطالب': 'STD-1002',
          'الرقم القومي': '30908150109876',
          'المرحلة': firstStage?.name || 'المرحلة الثانوية',
          'الصف الدراسي': secondGrade?.name || 'الصف الثاني الثانوي',
          'الفصل': secondGrade?.classrooms[0] || '2/1',
          'النوع': 'أنثى',
          'اسم ولي الأمر': 'طارق عبد الله علي',
          'رقم هاتف ولي الأمر': '01298765432',
          'هاتف الطالب': '',
          'العنوان': 'الجيزة - الدقي',
          'ملاحظات': '',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
      XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب_مصر.xlsx');
    } else {
      const sampleData = [
        {
          'اسم الموظف': 'محمود عبد الرحمن سيد',
          'الرقم الوظيفي': 'EMP-201',
          'المسمى الوظيفي': jobTitles[0]?.title || 'معلم أول لغة عربية',
          'القسم': departments[0]?.name || 'هيئة التدريس والتعليم',
          'الرقم القومي': '28509140101234',
          'الراتب الأساسي': '12500',
          'رقم الهاتف': '01098765432',
          'البريد الإلكتروني': 'mahmoud@school.edu.eg',
          'تاريخ التعيين': '2022-09-01',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المعلمون_والموظفون');
      XLSX.writeFile(wb, 'نموذج_استيراد_المعلمين_والموظفين.xlsx');
    }
  };

  const handleValidateAndPreview = () => {
    const errors: string[] = [];
    const missingRequired = currentFieldDefs.filter(f => f.required && !columnMapping[f.key]);

    if (missingRequired.length > 0) {
      alert(`يرجى تحديد الأعمدة المقابلة للحقول الإلزامية: ${missingRequired.map(f => f.label).join('، ')}`);
      return;
    }

    // Check rows validation
    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      currentFieldDefs.forEach(field => {
        if (field.required) {
          const colName = columnMapping[field.key];
          const val = row[colName];
          if (!val || String(val).trim() === '') {
            errors.push(`صف ${rowNum}: حقل "${field.label}" فارغ`);
          }
        }
      });
    });

    setValidationErrors(errors);
    setStep('preview');
  };

  const executeImport = () => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        if (mode === 'students') {
          const studentsToImport: Student[] = rawRows.map((row, idx) => {
            const getVal = (key: string) => {
              const col = columnMapping[key];
              return col && row[col] !== undefined ? String(row[col]).trim() : '';
            };

            const rawGender = getVal('gender');
            const gender = rawGender.includes('أنثى') || rawGender.toLowerCase() === 'female' || rawGender.toLowerCase() === 'f' ? 'أنثى' : 'ذكر';

            return {
              id: getVal('studentCode') || `STD-${Date.now().toString().slice(-6)}-${idx + 1}`,
              studentCode: getVal('studentCode') || `C-${Math.floor(1000 + Math.random() * 9000)}`,
              name: getVal('name'),
              nationalId: getVal('nationalId') || undefined,
              gender,
              stage: getVal('stage') || 'المرحلة العامة',
              grade: getVal('grade'),
              classroom: getVal('classroom'),
              academicYear: '2025/2026',
              status: 'نشط',
              parentName: getVal('parentName') || 'ولي أمر الطالب',
              relationship: 'ولي أمر',
              parentPhone: getVal('parentPhone') || '',
              phone: getVal('phone') || '',
              address: getVal('address') || '',
              notes: getVal('notes') || '',
              initialBehaviorScore: 100,
              createdAt: new Date().toISOString(),
            };
          }).filter(s => s.name.length > 0);

          const result = storageService.bulkSaveStudents(studentsToImport);
          setImportStats({
            added: result.added,
            updated: result.updated,
            ignored: rawRows.length - (result.added + result.updated),
            errors: result.errors.length,
          });
        } else {
          // Employee mode
          let added = 0;
          let updated = 0;
          const currentEmployees = storageService.getEmployees();

          rawRows.forEach((row, idx) => {
            const getVal = (key: string) => {
              const col = columnMapping[key];
              return col && row[col] !== undefined ? String(row[col]).trim() : '';
            };

            const name = getVal('name');
            if (!name) return;

            const id = getVal('id') || `EMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
            const existingIdx = currentEmployees.findIndex(e => e.id === id || (getVal('nationalId') && e.nationalId === getVal('nationalId')));

            const empObj: Employee = {
              id,
              name,
              jobTitle: getVal('jobTitle') || 'معلم / موظف',
              department: getVal('department') || 'هيئة التدريس والتعليم',
              nationalId: getVal('nationalId') || undefined,
              basicSalary: Number(getVal('basicSalary')) || 8000,
              phone: getVal('phone') || undefined,
              email: getVal('email') || undefined,
              hireDate: getVal('hireDate') || new Date().toISOString().split('T')[0],
              status: 'Active',
              workingHours: 7,
              workStartTime: '07:30',
              workEndTime: '14:30',
              daysOff: ['الجمعة', 'السبت'],
            };

            if (existingIdx >= 0) {
              currentEmployees[existingIdx] = { ...currentEmployees[existingIdx], ...empObj };
              updated++;
            } else {
              currentEmployees.push(empObj);
              added++;
            }
            storageService.saveEmployee(empObj);
          });

          setImportStats({
            added,
            updated,
            ignored: 0,
            errors: 0,
          });
        }

        setStep('result');
        if (onImportComplete) onImportComplete();
      } catch (err) {
        console.error('Import execution error:', err);
        alert('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-l from-teal-500/10 via-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#008e8b] text-white flex items-center justify-center shadow-lg shadow-teal-700/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                مركز استيراد البيانات الذكي (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                استيراد وتحديث بيانات الطلاب والمعلمين والموظفين من ملفات Excel بسهولة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full ${step === 'upload' ? 'bg-[#008e8b] text-white' : 'bg-slate-200 text-slate-700'}`}>
              1. رفع الملف
            </span>
            <span className="text-slate-300">←</span>
            <span className={`px-3 py-1 rounded-full ${step === 'mapping' ? 'bg-[#008e8b] text-white' : 'bg-slate-200 text-slate-700'}`}>
              2. مطابقة الأعمدة
            </span>
            <span className="text-slate-300">←</span>
            <span className={`px-3 py-1 rounded-full ${step === 'preview' ? 'bg-[#008e8b] text-white' : 'bg-slate-200 text-slate-700'}`}>
              3. المعاينة والفحص
            </span>
            <span className="text-slate-300">←</span>
            <span className={`px-3 py-1 rounded-full ${step === 'result' ? 'bg-[#008e8b] text-white' : 'bg-slate-200 text-slate-700'}`}>
              4. نتيجة الاستيراد
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">نوع البيانات:</span>
            <div className="inline-flex bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('students');
                  setStep('upload');
                  setRawRows([]);
                }}
                className={`px-3 py-1 rounded-md transition-all ${mode === 'students' ? 'bg-white text-[#008e8b] font-bold shadow-xs' : 'text-slate-600'}`}
              >
                الطلاب
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('employees');
                  setStep('upload');
                  setRawRows([]);
                }}
                className={`px-3 py-1 rounded-md transition-all ${mode === 'employees' ? 'bg-white text-[#008e8b] font-bold shadow-xs' : 'text-slate-600'}`}
              >
                المعلمون والموظفون
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6 text-center py-6">
              <div className="max-w-xl mx-auto border-2 border-dashed border-teal-300 hover:border-[#008e8b] bg-teal-50/40 rounded-3xl p-8 transition-colors flex flex-col items-center justify-center">
                <UploadCloud className="w-16 h-16 text-[#008e8b] mb-4 animate-pulse" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  اختر أو اسحب ملف Excel (.xlsx / .xls) أو .csv
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-6">
                  يقبل النظام ملفات Excel بأي ترتيب للأعمدة وسيتم التعرف عليها آلياً
                </p>

                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>تحديد ملف من الجهاز</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-300"
                >
                  <Download className="w-4 h-4 text-[#008e8b]" />
                  <span>تحميل نموذج Excel الجاهز ({mode === 'students' ? 'الطلاب' : 'المعلمين'})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-5">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#008e8b] shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 leading-relaxed">
                  تم اكتشاف <strong>{rawHeaders.length}</strong> عمود في الملف ({fileName}) بإجمالي <strong>{rawRows.length}</strong> سجل.
                  قم بمطابقة كل حقل في النظام مع العمود المقابل له في ملفك.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFieldDefs.map(field => (
                  <div key={field.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{field.label}</span>
                        {field.required && <span className="text-rose-500 font-bold">*</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">حقل: {field.key}</div>
                    </div>

                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                      className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b] min-w-[180px]"
                    >
                      <option value="">— اختر العمود —</option>
                      {rawHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">تنبيهات التحقق من البيانات ({validationErrors.length})</div>
                    <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto space-y-0.5">
                      {validationErrors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {validationErrors.length > 5 && <li>وغيرها {validationErrors.length - 5} ملاحظة أخرى...</li>}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>معاينة لأول {Math.min(10, rawRows.length)} سجلات جاهزة للاستيراد:</span>
                <span className="text-[#008e8b]">إجمالي السجلات: {rawRows.length}</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-72">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">#</th>
                      {currentFieldDefs.filter(f => columnMapping[f.key]).map(f => (
                        <th key={f.key} className="p-2.5 border-b border-slate-200 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        {currentFieldDefs.filter(f => columnMapping[f.key]).map(f => (
                          <td key={f.key} className="p-2.5 text-slate-800 whitespace-nowrap">
                            {row[columnMapping[f.key]] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Result */}
          {step === 'result' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">اكتمل الاستيراد بنجاح!</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-2xl font-bold text-emerald-700 font-mono">{importStats.added}</div>
                  <div className="text-xs text-emerald-800 mt-1 font-semibold">سجلات جديدة مضافة</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="text-2xl font-bold text-blue-700 font-mono">{importStats.updated}</div>
                  <div className="text-xs text-blue-800 mt-1 font-semibold">سجلات تم تحديثها</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-2xl font-bold text-slate-600 font-mono">{importStats.ignored}</div>
                  <div className="text-xs text-slate-700 mt-1 font-semibold">تم تجاهلها</div>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-2xl font-bold text-rose-700 font-mono">{importStats.errors}</div>
                  <div className="text-xs text-rose-800 mt-1 font-semibold">أخطاء</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع للملف</span>
              </button>
            )}
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تعديل المطابقة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 'upload' && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
            )}

            {step === 'mapping' && (
              <button
                type="button"
                onClick={handleValidateAndPreview}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <span>متابعة للمعاينة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={executeImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>بدء الاستيراد الفعلي الآن ({rawRows.length} سجل)</span>
              </button>
            )}

            {step === 'result' && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                إغلاق وفتح البيانات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
