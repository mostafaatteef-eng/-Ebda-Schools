/**
 * ==============================================================================
 * Migration: MIG_SCOPE_008_REMOVE_SAMAT_PAYROLL
 * Scope Reduction: Complete Operational Removal of SAMAT and Payroll Modules
 * ==============================================================================
 * This migration safely archives any existing SAMAT and Payroll records into
 * a designated historical cold storage key ('ntss_archive_samat_payroll_backup_v1'),
 * cleanses active operational keys, and marks the migration as completed.
 */

export interface RetiredModuleArchivePayload {
  migratedAt: string;
  migrationVersion: 'MIG_SCOPE_008_REMOVE_SAMAT_PAYROLL';
  reason: 'Administrative decision to streamline system as Staff-Only School ERP without SAMAT and Payroll';
  archivedKeys: string[];
  data: Record<string, any>;
}

const SAMAT_KEYS = [
  'ntss_samat_programs_v1',
  'ntss_samat_program_grades_v1',
  'ntss_samat_competencies_v1',
  'ntss_samat_rubrics_v1',
  'ntss_samat_rubric_levels_v1',
  'ntss_samat_role_assignments_v1',
  'ntss_samat_score_definitions_v1',
  'ntss_samat_score_versions_v1',
  'ntss_samat_migrations_v1',
  'ntss_samat_settings_v1',
  'ntss_samat_sessions_v1',
  'ntss_samat_attendance_v1',
  'ntss_samat_assessments_v1',
  'ntss_samat_evidence_v1',
  'ntss_samat_appeals_v1',
  'ntss_samat_pdp_v1',
  'ntss_samat_mentoring_v1',
  'ntss_samat_challenges_v1',
  'ntss_samat_portfolio_v1',
  'ntss_samat_enabled_v1',
];

const PAYROLL_KEYS = [
  'ntss_payroll_v3',
  'ntss_payroll_snapshots_v3',
  'ntss_salary_history_v3',
];

const ARCHIVE_KEY = 'ntss_archive_samat_payroll_backup_v1';
const MIGRATION_FLAG_KEY = 'ntss_mig_scope_008_applied';

export function runMigrationScope008RemoveSamatPayroll(): {
  alreadyApplied: boolean;
  archivedKeysCount: number;
  message: string;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { alreadyApplied: false, archivedKeysCount: 0, message: 'SSR environment' };
  }

  const alreadyApplied = localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
  if (alreadyApplied) {
    return { alreadyApplied: true, archivedKeysCount: 0, message: 'Migration already executed' };
  }

  const archiveData: Record<string, any> = {};
  const archivedKeys: string[] = [];

  const allTargetKeys = [...SAMAT_KEYS, ...PAYROLL_KEYS];

  allTargetKeys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw !== null && raw !== undefined) {
      try {
        archiveData[key] = JSON.parse(raw);
      } catch {
        archiveData[key] = raw;
      }
      archivedKeys.push(key);
      // Remove from active operational keys
      localStorage.removeItem(key);
    }
  });

  // Also remove samat and payroll flags from general settings if present
  try {
    const settingsRaw = localStorage.getItem('ntss_settings_v3');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      let changed = false;
      if (parsed.samatEnabled !== undefined) {
        delete parsed.samatEnabled;
        changed = true;
      }
      if (parsed.payrollRules !== undefined) {
        delete parsed.payrollRules;
        changed = true;
      }
      if (changed) {
        localStorage.setItem('ntss_settings_v3', JSON.stringify(parsed));
      }
    }
  } catch (e) {
    console.warn('Settings cleansing warning:', e);
  }

  // Save non-destructive archive payload if any data was archived
  if (archivedKeys.length > 0) {
    const payload: RetiredModuleArchivePayload = {
      migratedAt: new Date().toISOString(),
      migrationVersion: 'MIG_SCOPE_008_REMOVE_SAMAT_PAYROLL',
      reason: 'Administrative decision to streamline system as Staff-Only School ERP without SAMAT and Payroll',
      archivedKeys,
      data: archiveData,
    };
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(payload));
  }

  // Mark migration as permanently applied
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

  return {
    alreadyApplied: false,
    archivedKeysCount: archivedKeys.length,
    message: `Migration completed: archived and detached ${archivedKeys.length} keys safely.`,
  };
}
