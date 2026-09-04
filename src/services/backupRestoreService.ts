import { User } from '../types';
import {
  BackupType,
  RestoreValidationReport,
  SystemBackupMetadata,
  SystemBackupPackage,
} from '../types_extended';
import { storageService } from './storageService';
import { STORAGE_KEYS } from './masterDataDefaults';
import { getCairoNowISO } from '../utils/egyptianTime';

export class BackupRestoreService {
  public static readonly SCHEMA_VERSION = '3.2.0';

  /**
   * Create System Backup with Secret Sanitization
   */
  public static createBackup(
    type: BackupType,
    description: string,
    currentUser: User | null
  ): { backupPackage: SystemBackupPackage; jsonString: string } {
    if (!currentUser || currentUser.role !== 'Admin') {
      throw new Error('403 Forbidden: عمليات النسخ الاحتياطي مقصورة فقط على مدير النظام الأعلى.');
    }

    const entitiesCount: Record<string, number> = {};
    const data: Record<string, any> = {};

    const extractEntity = (key: string, storageKey: string, sanitizeFn?: (items: any[]) => any[]) => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          let items = JSON.parse(raw);
          if (sanitizeFn) items = sanitizeFn(items);
          data[key] = items;
          entitiesCount[key] = Array.isArray(items) ? items.length : 1;
        } else {
          data[key] = [];
          entitiesCount[key] = 0;
        }
      } catch {
        data[key] = [];
        entitiesCount[key] = 0;
      }
    };

    // Sanitize Users: Strip password and tokens
    const sanitizeUsers = (users: any[]) => {
      return users.map(u => ({
        ...u,
        password: '[REDACTED_SECURITY_SECRET]',
        sessionToken: undefined,
        token: undefined,
      }));
    };

    // Sanitize Settings: Strip any private keys
    const sanitizeSettings = (settings: any) => {
      const sanitized = { ...settings };
      delete sanitized.apiSecret;
      delete sanitized.jwtSecret;
      return sanitized;
    };

    // Populate data based on Backup Type
    if (type === 'FULL' || type === 'CONFIG') {
      extractEntity('settings', STORAGE_KEYS.SETTINGS, sanitizeSettings);
      extractEntity('academicYears', STORAGE_KEYS.ACADEMIC_YEARS);
      extractEntity('masterData', STORAGE_KEYS.MASTER_DATA);
      extractEntity('users', STORAGE_KEYS.USERS, sanitizeUsers);
    }

    if (type === 'FULL' || type === 'ACADEMIC') {
      extractEntity('students', STORAGE_KEYS.STUDENTS);
      extractEntity('studentAttendance', STORAGE_KEYS.STUDENT_ATTENDANCE);
      extractEntity('classAttendance', STORAGE_KEYS.CLASS_ATTENDANCE);
      extractEntity('schedule', STORAGE_KEYS.SCHEDULE);
      extractEntity('homeworks', STORAGE_KEYS.HOMEWORKS);
      extractEntity('behaviorViolations', STORAGE_KEYS.BEHAVIOR_VIOLATIONS);
      extractEntity('behaviorCases', STORAGE_KEYS.BEHAVIOR_CASES);
      extractEntity('behaviorLedger', STORAGE_KEYS.BEHAVIOR_LEDGER);
    }

    if (type === 'FULL' || type === 'HR') {
      extractEntity('employees', STORAGE_KEYS.EMPLOYEES);
      extractEntity('attendance', STORAGE_KEYS.ATTENDANCE);
      extractEntity('leaves', STORAGE_KEYS.LEAVES);
    }

    if (type === 'FULL' || type === 'PAYROLL') {
      extractEntity('payroll', STORAGE_KEYS.PAYROLL);
      extractEntity('payrollSnapshots', STORAGE_KEYS.PAYROLL_SNAPSHOTS);
    }

    if (type === 'FULL') {
      extractEntity('auditLogs', STORAGE_KEYS.AUDIT_LOGS);
    }

    const backupId = `BCK-${type}-${Date.now()}`;
    const metadata: SystemBackupMetadata = {
      id: backupId,
      type,
      createdAt: getCairoNowISO(),
      createdBy: currentUser.name || currentUser.username,
      description: description || `نسخة احتياطية لنظام المدرسة (${type})`,
      schemaVersion: this.SCHEMA_VERSION,
      dataVersion: '1.0',
      status: 'SUCCESS',
      entitiesCount,
    };

    const backupPackage: SystemBackupPackage = {
      metadata,
      data,
      safetyHash: `SAFE-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    };

    const jsonString = JSON.stringify(backupPackage, null, 2);
    metadata.sizeEstimateBytes = new Blob([jsonString]).size;

    // Save to backup history
    this.saveBackupHistory(metadata);
    storageService.logAudit('SETTINGS', 'SETTINGS', `إنشاء نسخة احتياطية: ${type} - الحجم: ${Math.round(metadata.sizeEstimateBytes / 1024)} KB`);

    return { backupPackage, jsonString };
  }

  /**
   * Validate incoming backup file and build Impact Preview
   */
  public static validateBackupForRestore(backupPackage: any): RestoreValidationReport {
    const report: RestoreValidationReport = {
      isValid: false,
      schemaVersion: backupPackage?.metadata?.schemaVersion || 'Unknown',
      sourceCreatedDate: backupPackage?.metadata?.createdAt || 'Unknown',
      sourceCreatedBy: backupPackage?.metadata?.createdBy || 'Unknown',
      type: backupPackage?.metadata?.type || 'FULL',
      sheetsFound: [],
      missingRequiredSheets: [],
      duplicateKeysDetected: 0,
      incompatibilities: [],
      warnings: [],
      impactEstimate: {},
    };

    if (!backupPackage || typeof backupPackage !== 'object') {
      report.incompatibilities.push('ملف النسخة الاحتياطية غير صالح أو تالف بصرياً');
      return report;
    }

    if (!backupPackage.metadata || !backupPackage.data) {
      report.incompatibilities.push('هيكل ملف النسخة الاحتياطية يفتقد البيانات الوصفية الأساسية');
      return report;
    }

    report.sheetsFound = Object.keys(backupPackage.data);

    // Check entity counts & build impact estimate
    const currentStudents = storageService.getStudents().length;
    const currentEmployees = storageService.getEmployees().length;
    const currentAttendance = storageService.getAttendance().length;
    const currentStudentAttendance = storageService.getStudentAttendance().length;

    if (backupPackage.data.students) {
      report.impactEstimate['الطلاب'] = {
        currentCount: currentStudents,
        incomingCount: backupPackage.data.students.length,
        action: 'استبدال وتحديث',
      };
    }
    if (backupPackage.data.employees) {
      report.impactEstimate['الموظفون والمعلمون'] = {
        currentCount: currentEmployees,
        incomingCount: backupPackage.data.employees.length,
        action: 'استبدال وتحديث',
      };
    }
    if (backupPackage.data.attendance) {
      report.impactEstimate['حضور الموظفين'] = {
        currentCount: currentAttendance,
        incomingCount: backupPackage.data.attendance.length,
        action: 'استبدال وتحديث',
      };
    }
    if (backupPackage.data.studentAttendance) {
      report.impactEstimate['حضور الطلاب'] = {
        currentCount: currentStudentAttendance,
        incomingCount: backupPackage.data.studentAttendance.length,
        action: 'استبدال وتحديث',
      };
    }

    // Schema Check
    if (backupPackage.metadata.schemaVersion !== this.SCHEMA_VERSION) {
      report.warnings.push(`إصدار الملف (${backupPackage.metadata.schemaVersion}) يختلف عن إصدار النظام الحالي (${this.SCHEMA_VERSION})، ولكن الاستعادة مدعومة.`);
    }

    report.isValid = report.incompatibilities.length === 0;
    return report;
  }

  /**
   * Execute Restore with Pre-emptive Safety Backup
   */
  public static executeRestore(
    backupPackage: SystemBackupPackage,
    currentUser: User | null
  ): { success: boolean; safetyBackupId: string; restoredCount: number } {
    if (!currentUser || currentUser.role !== 'Admin') {
      throw new Error('403 Forbidden: استعادة النسخ الاحتياطية تتطلب صلاحيات الإدارة العليا.');
    }

    // 1. Mandatory Auto-Safety Backup before destructive restore
    const safety = this.createBackup('FULL', 'نسخة أمان تلقائية قبل استعادة البيانات', currentUser);
    const safetyBackupId = safety.backupPackage.metadata.id;
    this.saveBackupHistory(safety.backupPackage.metadata);

    // 2. Restore entities safely
    let restoredCount = 0;
    const restoreEntity = (key: string, storageKey: string) => {
      if (backupPackage.data[key] !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(backupPackage.data[key]));
        restoredCount++;
      }
    };

    restoreEntity('settings', STORAGE_KEYS.SETTINGS);
    restoreEntity('academicYears', STORAGE_KEYS.ACADEMIC_YEARS);
    restoreEntity('masterData', STORAGE_KEYS.MASTER_DATA);
    restoreEntity('students', STORAGE_KEYS.STUDENTS);
    restoreEntity('studentAttendance', STORAGE_KEYS.STUDENT_ATTENDANCE);
    restoreEntity('classAttendance', STORAGE_KEYS.CLASS_ATTENDANCE);
    restoreEntity('schedule', STORAGE_KEYS.SCHEDULE);
    restoreEntity('homeworks', STORAGE_KEYS.HOMEWORKS);
    restoreEntity('behaviorViolations', STORAGE_KEYS.BEHAVIOR_VIOLATIONS);
    restoreEntity('behaviorCases', STORAGE_KEYS.BEHAVIOR_CASES);
    restoreEntity('behaviorLedger', STORAGE_KEYS.BEHAVIOR_LEDGER);
    restoreEntity('employees', STORAGE_KEYS.EMPLOYEES);
    restoreEntity('attendance', STORAGE_KEYS.ATTENDANCE);
    restoreEntity('leaves', STORAGE_KEYS.LEAVES);
    restoreEntity('payroll', STORAGE_KEYS.PAYROLL);
    restoreEntity('payrollSnapshots', STORAGE_KEYS.PAYROLL_SNAPSHOTS);

    // Lockout Protection: Ensure at least one active Admin user exists
    const users = storageService.getUsers();
    const hasActiveAdmin = users.some(u => u.role === 'Admin' && u.status === 'Active');
    if (!hasActiveAdmin && currentUser) {
      storageService.saveUser(currentUser);
    }

    storageService.logAudit('SETTINGS', 'SETTINGS', `استعادة نسخة احتياطية ناجحة (${backupPackage.metadata.type}) - تم تأمين نسخة سابقة: ${safetyBackupId}`);

    return {
      success: true,
      safetyBackupId,
      restoredCount,
    };
  }

  public static getBackupHistory(): SystemBackupMetadata[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUP_HISTORY) || '[]');
    } catch {
      return [];
    }
  }

  private static saveBackupHistory(metadata: SystemBackupMetadata): void {
    try {
      const history = this.getBackupHistory();
      history.unshift(metadata);
      localStorage.setItem(STORAGE_KEYS.BACKUP_HISTORY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save backup metadata', e);
    }
  }

  /**
   * Trigger Download of Backup JSON File
   */
  public static downloadBackupFile(jsonString: string, filename: string): void {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
