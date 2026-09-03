import { Employee, Student, User } from '../types';
import {
  ImportBatchRecord,
  ImportDiffRow,
  ImportEntityType,
  ImportFieldDefinition,
  ImportMode,
  ImportSummaryStats,
  ImportValidationIssue,
} from '../types_extended';
import { storageService } from './storageService';
import { STORAGE_KEYS } from './masterDataDefaults';
import { getCairoNowISO } from '../utils/egyptianTime';
import * as XLSX from 'xlsx';

export class ImportCenterService {
  /**
   * Field Definitions per Entity with Arabic Aliases
   */
  public static readonly FIELD_DEFINITIONS: Record<ImportEntityType, ImportFieldDefinition[]> = {
    STUDENTS: [
      { key: 'name', label: 'اسم الطالب', required: true, aliases: ['اسم الطالب', 'الاسم', 'اسم التلميذ', 'student name', 'name'] },
      { key: 'studentCode', label: 'كود الطالب', required: false, aliases: ['كود الطالب', 'رقم الجلوس', 'رقم الطالب', 'student code', 'code'] },
      { key: 'nationalId', label: 'الرقم القومي', required: false, aliases: ['الرقم القومي', 'رقم الهوية', 'بطاقة الرقم القومي', 'national id'] },
      { key: 'grade', label: 'الصف الدراسي', required: true, aliases: ['الصف', 'المرحلة', 'الصف الدراسي', 'grade'] },
      { key: 'classroom', label: 'الفصل / الشعبة', required: true, aliases: ['الفصل', 'الشعبة', 'القاعة', 'classroom', 'class'] },
      { key: 'gender', label: 'النوع', required: false, aliases: ['النوع', 'الجنس', 'gender'] },
      { key: 'parentName', label: 'اسم ولي الأمر', required: false, aliases: ['اسم ولي الأمر', 'ولي الأمر', 'الوالد', 'parent name'] },
      { key: 'parentPhone', label: 'رقم هاتف ولي الأمر', required: false, aliases: ['هاتف ولي الأمر', 'رقم ولي الأمر', 'موبايل ولي الأمر', 'parent phone', 'phone'] },
      { key: 'status', label: 'حالة القيد', required: false, aliases: ['الحالة', 'حالة القيد', 'حالة الطالب', 'status'] },
    ],
    EMPLOYEES: [
      { key: 'name', label: 'اسم الموظف', required: true, aliases: ['اسم الموظف', 'الاسم', 'اسم المعلم', 'employee name', 'name'] },
      { key: 'nationalId', label: 'الرقم القومي', required: false, aliases: ['الرقم القومي', 'رقم الهوية', 'national id'] },
      { key: 'department', label: 'القسم / الإدارة', required: true, aliases: ['القسم', 'الإدارة', 'department'] },
      { key: 'jobTitle', label: 'المسمى الوظيفي', required: true, aliases: ['الوظيفة', 'المسمى الوظيفي', 'التخصص', 'job title'] },
      { key: 'phone', label: 'رقم الجوال', required: false, aliases: ['الهاتف', 'الموبايل', 'رقم الجوال', 'phone'] },
      { key: 'hireDate', label: 'تاريخ التعيين', required: false, aliases: ['تاريخ التعيين', 'تاريخ العمل', 'hire date'] },
      { key: 'status', label: 'حالة العمل', required: false, aliases: ['الحالة', 'حالة الموظف', 'status'] },
    ],
    TEACHERS: [
      { key: 'name', label: 'اسم المعلم', required: true, aliases: ['اسم المعلم', 'الاسم', 'teacher name', 'name'] },
      { key: 'nationalId', label: 'الرقم القومي', required: false, aliases: ['الرقم القومي', 'رقم الهوية', 'national id'] },
      { key: 'department', label: 'القسم / المادة', required: true, aliases: ['القسم', 'المادة', 'department'] },
      { key: 'jobTitle', label: 'المسمى الوظيفي', required: true, aliases: ['المسمى الوظيفي', 'الوظيفة', 'job title'] },
      { key: 'phone', label: 'رقم الهاتف', required: false, aliases: ['الهاتف', 'الموبايل', 'phone'] },
      { key: 'status', label: 'الحالة', required: false, aliases: ['الحالة', 'status'] },
    ],
    PARENTS: [
      { key: 'parentName', label: 'اسم ولي الأمر', required: true, aliases: ['اسم ولي الأمر', 'ولي الأمر', 'الاسم', 'parent name'] },
      { key: 'parentPhone', label: 'رقم الهاتف', required: true, aliases: ['رقم الهاتف', 'الموبايل', 'هاتف ولي الأمر', 'phone'] },
      { key: 'studentCode', label: 'كود الطالب التابع', required: true, aliases: ['كود الطالب', 'رقم الطالب', 'student code'] },
      { key: 'nationalId', label: 'رقم الهوية / القومي', required: false, aliases: ['الرقم القومي', 'الهوية', 'national id'] },
    ],
    MASTER_DATA: [
      { key: 'category', label: 'الفئة', required: true, aliases: ['الفئة', 'النوع الرئيسي', 'category'] },
      { key: 'typeKey', label: 'مفتاح التصنيف', required: true, aliases: ['مفتاح التصنيف', 'النوع', 'type'] },
      { key: 'code', label: 'الكود', required: true, aliases: ['الكود', 'الرمز', 'code'] },
      { key: 'nameAr', label: 'الاسم بالعربية', required: true, aliases: ['الاسم', 'الاسم بالعربية', 'name'] },
    ],
  };

  /**
   * Parse uploaded file buffer or ArrayBuffer using XLSX
   */
  public static parseSpreadsheet(data: ArrayBuffer): { headers: string[]; rows: Record<string, any>[] } {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!jsonData || jsonData.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(jsonData[0]);
    return { headers, rows: jsonData };
  }

  /**
   * Suggest auto-mapping between file headers and target fields
   */
  public static suggestMappings(
    headers: string[],
    entityType: ImportEntityType
  ): Record<string, string> {
    const definitions = this.FIELD_DEFINITIONS[entityType];
    const mappings: Record<string, string> = {};

    headers.forEach(h => {
      const cleanHeader = h.trim().toLowerCase();
      const matchedField = definitions.find(def =>
        def.aliases.some(alias => cleanHeader === alias.toLowerCase())
      );
      if (matchedField) {
        mappings[h] = matchedField.key;
      }
    });

    return mappings;
  }

  /**
   * Validate and Diff against existing Database
   */
  public static analyzeImport(
    entityType: ImportEntityType,
    rows: Record<string, any>[],
    mappings: Record<string, string>,
    mode: ImportMode
  ): { diffs: ImportDiffRow[]; stats: ImportSummaryStats; issues: ImportValidationIssue[] } {
    const definitions = this.FIELD_DEFINITIONS[entityType];
    const requiredKeys = definitions.filter(d => d.required).map(d => d.key);
    
    // Existing database maps
    const existingStudents = storageService.getStudents();
    const existingEmployees = storageService.getEmployees();

    const diffs: ImportDiffRow[] = [];
    const issues: ImportValidationIssue[] = [];
    const seenFileKeys = new Set<string>();

    let newCount = 0;
    let updateCount = 0;
    let noChangeCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    rows.forEach((rawRow, idx) => {
      const rowNum = idx + 2; // 1-based, accounting for header
      const mappedData: Record<string, any> = {};

      // Apply mappings
      Object.entries(mappings).forEach(([fileCol, systemKey]) => {
        if (systemKey && rawRow[fileCol] !== undefined) {
          mappedData[systemKey] = String(rawRow[fileCol]).trim();
        }
      });

      // 1. Required Field Validations
      const rowIssues: string[] = [];
      requiredKeys.forEach(reqKey => {
        if (!mappedData[reqKey]) {
          const fieldDef = definitions.find(d => d.key === reqKey);
          const msg = `الحقل الإلزامي (${fieldDef?.label || reqKey}) مفقود`;
          rowIssues.push(msg);
          issues.push({ rowNumber: rowNum, field: reqKey, value: '', message: msg, severity: 'ERROR' });
        }
      });

      // 2. Identify existing record in DB
      let matchedRecord: any = null;
      let identifier = '';

      if (entityType === 'STUDENTS') {
        const code = mappedData.studentCode;
        const nationalId = mappedData.nationalId;
        const name = mappedData.name;

        if (code) {
          matchedRecord = existingStudents.find(s => s.studentCode === code);
          identifier = code;
        }
        if (!matchedRecord && nationalId) {
          matchedRecord = existingStudents.find(s => s.nationalId === nationalId);
          identifier = nationalId;
        }
        if (!matchedRecord && name) {
          identifier = name;
        }
      } else if (entityType === 'EMPLOYEES' || entityType === 'TEACHERS') {
        const id = mappedData.id;
        const nationalId = mappedData.nationalId;
        const name = mappedData.name;

        if (id) {
          matchedRecord = existingEmployees.find(e => e.id === id);
          identifier = id;
        }
        if (!matchedRecord && nationalId) {
          matchedRecord = existingEmployees.find(e => e.nationalId === nationalId);
          identifier = nationalId;
        }
        if (!matchedRecord && name) {
          identifier = name;
        }
      }

      // Check duplicate within file
      if (identifier && seenFileKeys.has(identifier)) {
        const msg = `تكرار نفس المعرّف (${identifier}) أكثر من مرة داخل نفس الملف`;
        rowIssues.push(msg);
        issues.push({ rowNumber: rowNum, field: 'identifier', value: identifier, message: msg, severity: 'CONFLICT' });
      } else if (identifier) {
        seenFileKeys.add(identifier);
      }

      // Classification Logic
      let classification: ImportDiffRow['classification'] = 'NEW';
      const changes: Record<string, { oldValue: any; newValue: any }> = {};

      if (rowIssues.some(i => i.includes('مفقود'))) {
        classification = 'ERROR';
        errorCount++;
      } else if (rowIssues.some(i => i.includes('تكرار'))) {
        classification = 'CONFLICT';
        conflictCount++;
      } else if (matchedRecord) {
        // Record exists: check for changes
        let hasChanges = false;
        Object.keys(mappedData).forEach(key => {
          const oldVal = matchedRecord[key] !== undefined ? String(matchedRecord[key]).trim() : '';
          const newVal = String(mappedData[key]).trim();
          if (oldVal !== newVal) {
            changes[key] = { oldValue: oldVal, newValue: newVal };
            hasChanges = true;
          }
        });

        if (mode === 'ADD_ONLY') {
          classification = 'CONFLICT';
          rowIssues.push('السجل موجود مسبقاً، ونمط الاستيراد محدد للإضافة فقط');
          conflictCount++;
        } else if (hasChanges) {
          classification = 'UPDATE';
          updateCount++;
        } else {
          classification = 'NO_CHANGE';
          noChangeCount++;
        }
      } else {
        // Record is new
        if (mode === 'UPDATE_ONLY') {
          classification = 'CONFLICT';
          rowIssues.push('السجل غير موجود، ونمط الاستيراد محدد للتحديث فقط');
          conflictCount++;
        } else {
          classification = 'NEW';
          newCount++;
        }
      }

      diffs.push({
        rowNumber: rowNum,
        targetId: matchedRecord?.id,
        identifier: identifier || `صف #${rowNum}`,
        displayName: mappedData.name || mappedData.parentName || `سجل صف ${rowNum}`,
        classification,
        issues: rowIssues,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        incomingData: mappedData,
      });
    });

    const stats: ImportSummaryStats = {
      totalRows: rows.length,
      newCount,
      updateCount,
      noChangeCount,
      conflictCount,
      errorCount,
    };

    return { diffs, stats, issues };
  }

  /**
   * Execute Import in Chunks with Progress Callback
   */
  public static async executeImport(
    entityType: ImportEntityType,
    diffs: ImportDiffRow[],
    mode: ImportMode,
    fileName: string,
    allowedUpdateFields?: string[],
    currentUser: User | null = null,
    onProgress?: (progressPercent: number) => void
  ): Promise<ImportBatchRecord> {
    const batchId = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const affectedIds: string[] = [];
    const failedRows: { rowNumber: number; data: any; reason: string }[] = [];

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const totalValid = diffs.length;
    let processed = 0;

    for (const diff of diffs) {
      processed++;
      if (onProgress && processed % 10 === 0) {
        onProgress(Math.round((processed / totalValid) * 100));
      }

      if (diff.classification === 'ERROR' || diff.classification === 'CONFLICT') {
        errorCount++;
        failedRows.push({
          rowNumber: diff.rowNumber,
          data: diff.incomingData,
          reason: (diff.issues || []).join('; ') || 'خطأ في التحقق من صحة السطر',
        });
        continue;
      }

      if (diff.classification === 'NO_CHANGE') {
        skippedCount++;
        continue;
      }

      try {
        if (entityType === 'STUDENTS') {
          if (diff.classification === 'NEW') {
            const newStudent: Student = {
              id: diff.incomingData.studentCode || `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              studentCode: diff.incomingData.studentCode || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
              name: diff.incomingData.name,
              nationalId: diff.incomingData.nationalId || '',
              grade: diff.incomingData.grade,
              classroom: diff.incomingData.classroom,
              gender: (diff.incomingData.gender as any) || 'ذكر',
              status: (diff.incomingData.status as any) || 'نشط',
              parentName: diff.incomingData.parentName || '',
              parentPhone: diff.incomingData.parentPhone || '',
            };
            storageService.saveStudent(newStudent);
            affectedIds.push(newStudent.id);
            addedCount++;
          } else if (diff.classification === 'UPDATE' && diff.targetId) {
            const current = storageService.getStudents().find(s => s.id === diff.targetId);
            if (current) {
              const updatedData: Record<string, any> = { ...current };
              Object.entries(diff.incomingData).forEach(([k, v]) => {
                if (!allowedUpdateFields || allowedUpdateFields.includes(k)) {
                  updatedData[k] = v;
                }
              });
              storageService.saveStudent(updatedData as Student);
              affectedIds.push(current.id);
              updatedCount++;
            }
          }
        } else if (entityType === 'EMPLOYEES' || entityType === 'TEACHERS') {
          if (diff.classification === 'NEW') {
            const newEmp: Employee = {
              id: diff.incomingData.id || `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: diff.incomingData.name,
              nationalId: diff.incomingData.nationalId || '',
              department: diff.incomingData.department,
              jobTitle: diff.incomingData.jobTitle,
              phone: diff.incomingData.phone || '',
              hireDate: diff.incomingData.hireDate || getCairoNowISO().split('T')[0],
              status: (diff.incomingData.status as any) || 'Active',
              workingHours: 7,
              workStartTime: '07:30',
              workEndTime: '14:30',
              daysOff: ['الجمعة', 'السبت'],
            };
            storageService.saveEmployee(newEmp);
            affectedIds.push(newEmp.id);
            addedCount++;
          } else if (diff.classification === 'UPDATE' && diff.targetId) {
            const current = storageService.getEmployees().find(e => e.id === diff.targetId);
            if (current) {
              const updatedData: Record<string, any> = { ...current };
              Object.entries(diff.incomingData).forEach(([k, v]) => {
                if (!allowedUpdateFields || allowedUpdateFields.includes(k)) {
                  updatedData[k] = v;
                }
              });
              storageService.saveEmployee(updatedData as Employee);
              affectedIds.push(current.id);
              updatedCount++;
            }
          }
        }
      } catch (err: any) {
        errorCount++;
        failedRows.push({
          rowNumber: diff.rowNumber,
          data: diff.incomingData,
          reason: err.message || 'حدث خطأ أثناء حفظ السجل في قاعدة البيانات',
        });
      }
    }

    if (onProgress) onProgress(100);

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      entityType,
      fileName,
      mode,
      totalRows: diffs.length,
      addedCount,
      updatedCount,
      skippedCount,
      errorCount,
      conflictCount: 0,
      selectedUpdateFields: allowedUpdateFields,
      affectedIds,
      rollbackPossible: addedCount > 0 || updatedCount > 0,
      createdBy: currentUser?.name || currentUser?.username || 'مدير النظام',
      createdAt: getCairoNowISO(),
      status: errorCount > 0 ? (addedCount > 0 || updatedCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED') : 'SUCCESS',
      failedRows: failedRows.length > 0 ? failedRows : undefined,
    };

    // Save batch record to history
    this.saveBatchRecord(batchRecord);
    storageService.logAudit('IMPORT', 'STUDENT', `عملية استيراد ذكية: ${fileName} - تم إضافة ${addedCount} وتحديث ${updatedCount}`);

    return batchRecord;
  }

  /**
   * Save Batch Record to Registry
   */
  public static saveBatchRecord(batch: ImportBatchRecord): void {
    try {
      const all: ImportBatchRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.IMPORT_BATCHES) || '[]');
      all.unshift(batch);
      localStorage.setItem(STORAGE_KEYS.IMPORT_BATCHES, JSON.stringify(all.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save import batch record', e);
    }
  }

  public static getBatchHistory(): ImportBatchRecord[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.IMPORT_BATCHES) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Rollback an Import Batch
   */
  public static rollbackBatch(batchId: string, currentUser: User | null): boolean {
    const batches = this.getBatchHistory();
    const batch = batches.find(b => b.id === batchId);
    if (!batch || !batch.rollbackPossible || batch.rolledBack) {
      return false;
    }

    if (batch.entityType === 'STUDENTS') {
      const students = storageService.getStudents();
      // Remove newly added students from this batch
      const remaining = students.filter(s => !batch.affectedIds.includes(s.id));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remaining));
    } else if (batch.entityType === 'EMPLOYEES' || batch.entityType === 'TEACHERS') {
      const employees = storageService.getEmployees();
      const remaining = employees.filter(e => !batch.affectedIds.includes(e.id));
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(remaining));
    }

    batch.rolledBack = true;
    batch.rolledBackAt = getCairoNowISO();
    batch.rolledBackBy = currentUser?.name || currentUser?.username || 'مدير النظام';
    batch.status = 'ROLLED_BACK';

    localStorage.setItem(STORAGE_KEYS.IMPORT_BATCHES, JSON.stringify(batches));
    storageService.logAudit('IMPORT', 'STUDENT', `تراجع عن دفعة استيراد: ${batch.fileName} (${batchId})`);

    return true;
  }

  /**
   * Export Failed Rows to Excel with reason column
   */
  public static exportFailedRows(failedRows: { rowNumber: number; data: any; reason: string }[], fileName: string): void {
    if (!failedRows || failedRows.length === 0) return;

    const data = failedRows.map(f => ({
      'رقم السطر': f.rowNumber,
      'سبب الفشل / الخطأ': f.reason,
      ...f.data,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'صفوف_غير_مكتملة');
    XLSX.writeFile(wb, `أخطاء_${fileName}_${getCairoNowISO().split('T')[0]}.xlsx`);
  }
}
