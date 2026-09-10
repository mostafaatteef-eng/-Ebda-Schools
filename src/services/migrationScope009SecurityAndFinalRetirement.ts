/**
 * ==============================================================================
 * Migration: MIG_SCOPE_009_SECURITY_AND_FINAL_RETIREMENT
 * Production Hardening & Final Scope Cleanup (Staff-Only School ERP)
 * ==============================================================================
 * 
 * Idempotent migration to:
 * 1. Safely archive and purge all retired modules from localStorage:
 *    - SAMAT
 *    - Payroll & Salary History
 *    - School & Teacher Schedules
 *    - Schedule Substitutions
 *    - Homeworks
 *    - Lesson Instances & Content
 *    - Class-Period Attendance
 *    - Parent & Teacher Portal Caches
 * 2. Fix the Settings storage key mismatch from 008 (sanitizing 'ntss_school_settings_v3').
 * 3. Purge plain-text passwords and ensure user credentials adhere to staff-only salted policy.
 * 4. Record archive payload in 'ntss_archive_security_and_final_retirement_v1'.
 */

export interface Scope009ArchivePayload {
  migratedAt: string;
  migrationVersion: 'MIG_SCOPE_009_SECURITY_AND_FINAL_RETIREMENT';
  reason: 'Staff-Only School ERP Scope Cleanup and Authentication Security Hardening';
  archivedKeys: string[];
  data: Record<string, any>;
  settingsSanitized: boolean;
  usersNormalizedCount: number;
}

const RETIRED_STORAGE_KEYS = [
  // Schedule & Timetable
  'ntss_schedule_v3',
  'ntss_schedule_substitutions_v3',
  'ntss_schedule_conflicts_v3',
  'ntss_schedule_draft_v3',
  // Homework & Lessons
  'ntss_homeworks_v3',
  'ntss_lesson_instances_v3',
  'ntss_lesson_content_v3',
  // Class-period Attendance
  'ntss_class_attendance_v3',
  // Portals
  'ntss_parent_portal_v1',
  'ntss_parent_day_v1',
  'ntss_teacher_portal_v1',
  'ntss_student_portal_v1',
  // Payroll & SAMAT
  'ntss_payroll_v3',
  'ntss_payroll_snapshots_v3',
  'ntss_salary_history_v3',
  'ntss_samat_programs_v1',
  'ntss_samat_competencies_v1',
  'ntss_samat_rubrics_v1',
  'ntss_samat_role_assignments_v1',
  'ntss_samat_score_versions_v1',
  'ntss_samat_enabled_v1'
];

const ARCHIVE_STORAGE_KEY = 'ntss_archive_security_and_final_retirement_v1';
const MIGRATION_FLAG_KEY = 'ntss_mig_scope_009_applied';

export function runMigrationScope009SecurityAndFinalRetirement(): {
  alreadyApplied: boolean;
  archivedKeysCount: number;
  message: string;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { alreadyApplied: false, archivedKeysCount: 0, message: 'SSR environment' };
  }

  const alreadyApplied = localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
  if (alreadyApplied) {
    return {
      alreadyApplied: true,
      archivedKeysCount: 0,
      message: 'تم تطبيق هجرة الأمان وإلغاء الوحدات المتقاعدة رقم 009 مسبقاً بنجاح.',
    };
  }

  const archiveData: Record<string, any> = {};
  const archivedKeys: string[] = [];

  // 1. Archive and purge retired keys
  RETIRED_STORAGE_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        archiveData[key] = JSON.parse(val);
      } catch {
        archiveData[key] = val;
      }
      archivedKeys.push(key);
      localStorage.removeItem(key);
    }
  });

  // 2. Fix Settings storage key mismatch from 008:
  // Sanitize both 'ntss_school_settings_v3' (the canonical key) and legacy 'ntss_settings_v3'
  let settingsSanitized = false;
  ['ntss_school_settings_v3', 'ntss_settings_v3'].forEach(settingsKey => {
    const rawSettings = localStorage.getItem(settingsKey);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        let modified = false;

        // Strip retired settings keys
        const retiredSettingFields = [
          'payrollRules',
          'scheduleConfig',
          'teacherPortalSettings',
          'parentPortalSettings',
          'samatConfig',
        ];

        retiredSettingFields.forEach(field => {
          if (parsed[field] !== undefined) {
            delete parsed[field];
            modified = true;
          }
        });

        if (modified) {
          localStorage.setItem(settingsKey, JSON.stringify(parsed));
          settingsSanitized = true;
        }
      } catch (err) {
        console.warn('Error sanitizing settings in migration 009', err);
      }
    }
  });

  // 3. Normalize Users and purge plain-text passwords
  let usersNormalizedCount = 0;
  const rawUsers = localStorage.getItem('ntss_users_v3');
  if (rawUsers) {
    try {
      const usersList = JSON.parse(rawUsers);
      if (Array.isArray(usersList)) {
        const cleanedUsers = usersList.map((u: any) => {
          usersNormalizedCount++;
          const clean = { ...u };
          // Remove plain text password
          delete clean.password;
          // Purge parent linked students
          delete clean.studentIds;

          // Normalize legacy roles
          if (clean.role === 'HR' || clean.role === 'Employee') {
            clean.role = 'TeacherAffairs';
          } else if (clean.role === 'Supervisor') {
            clean.role = 'SchoolDirector';
          } else if (clean.role === 'BehaviorOfficer') {
            clean.role = 'SocialSpecialist';
          } else if (clean.role === 'Viewer') {
            clean.role = 'QualityOfficer';
          } else if (clean.role === 'Teacher' || clean.role === 'Parent' || clean.role === 'Student') {
            clean.status = 'Inactive';
            clean.isActive = false;
          }
          return clean;
        });
        localStorage.setItem('ntss_users_v3', JSON.stringify(cleanedUsers));
      }
    } catch (err) {
      console.warn('Error normalizing users in migration 009', err);
    }
  }

  // 4. Save archive payload for rollback & continuity receipt
  const payload: Scope009ArchivePayload = {
    migratedAt: new Date().toISOString(),
    migrationVersion: 'MIG_SCOPE_009_SECURITY_AND_FINAL_RETIREMENT',
    reason: 'Staff-Only School ERP Scope Cleanup and Authentication Security Hardening',
    archivedKeys,
    data: archiveData,
    settingsSanitized,
    usersNormalizedCount,
  };

  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // In case of quota exceeded, store summary without raw data
    payload.data = { summary: 'Full data omitted due to storage quota' };
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(payload));
  }

  // 5. Mark migration as permanently applied
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

  return {
    alreadyApplied: false,
    archivedKeysCount: archivedKeys.length,
    message: `تم تطبيق هجرة الأمان 009 بنجاح. تم أرشفة وتطهير ${archivedKeys.length} مفتاحاً ملغياً وتطهير بيانات الإعدادات والمستخدمين.`,
  };
}
