import { AttendanceRecord, AuditLogEntry, Employee, LeaveRecord, SystemSettings, User } from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  companyName: 'نظام إدارة الحضور والانصراف والموارد البشرية',
  officialStartTime: '09:00',
  officialEndTime: '17:00',
  gracePeriodMinutes: 15,
  standardDailyHours: 8,
  weekendDays: ['الجمعة', 'السبت'],
  overtimeRate: 1.5,
  annualLeaveAllowance: 21,
  sickLeaveAllowance: 15,
  emergencyLeaveAllowance: 6,
  autoCalculateStatus: true,
  googleSheetsUrl: '',
  googleAppsScriptUrl:
    ((import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
    'https://script.google.com/macros/s/AKfycbzw0kggQMGHdusMyKZOuqMC8eLiBzGccm7e7tdZbnMjvyBDqXPgI5f0tiJPKMFYAoln/exec',
  googleSheetWebAppUrl:
    ((import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
    'https://script.google.com/macros/s/AKfycbzw0kggQMGHdusMyKZOuqMC8eLiBzGccm7e7tdZbnMjvyBDqXPgI5f0tiJPKMFYAoln/exec',
  googleClientId: '',
  spreadsheetId: ((import.meta as any).env?.VITE_SPREADSHEET_ID as string) || '',
  autoSyncIntervalMinutes: 5,
  enableAuditLog: true,
};

// Production: No hardcoded demo employees - clean empty state
export const INITIAL_EMPLOYEES: Employee[] = [];

// Production: No hardcoded demo users - users are loaded from Google Sheets Users tab
export const INITIAL_USERS: User[] = [];

// Production: No hardcoded demo leaves
export const INITIAL_LEAVES: LeaveRecord[] = [];

// Production: No hardcoded demo audit logs
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

// Production: No mock attendance generator
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  return [];
}
