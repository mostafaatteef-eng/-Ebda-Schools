import { User } from '../types';
import { storageService } from '../services/storageService';

/**
 * Resolves the primary landing route for any user based strictly on their role.
 * Never defaults to cached or previous user navigation states.
 */
export function resolveDefaultRouteForCurrentUser(user: User | null): string {
  if (!user) return 'dashboard';

  switch (user.role) {
    case 'Admin':
    case 'SchoolDirector':
      return 'dashboard';
    case 'StudentAffairs':
      return 'students';
    case 'TeacherAffairs':
    case 'HR':
      return 'employees';
    case 'SocialSpecialist':
    case 'BehaviorOfficer':
      return 'behavior';
    case 'TrainingOfficer':
      return 'employees';
    case 'QualityOfficer':
      return 'reports';
    case 'Supervisor':
      return 'dashboard';
    case 'Viewer':
      return 'reports';
    case 'Teacher':
      return 'teacher_portal';
    case 'Parent':
      return 'parent_day_view';
    default:
      return 'dashboard';
  }
}

/**
 * Clears any transient navigation cache, selected entity filters, or previous session navigation memory
 */
export function clearPreviousNavigationState(): void {
  try {
    sessionStorage.removeItem('ntss_active_tab');
    sessionStorage.removeItem('ntss_selected_student');
    sessionStorage.removeItem('ntss_selected_employee');
    sessionStorage.removeItem('ntss_selected_teacher');
    sessionStorage.removeItem('ntss_parent_selected_child');
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Strict Route Guard validation ensuring users never access forbidden tabs
 */
export function canAccessTab(user: User | null, tab: string): boolean {
  if (!user) return false;

  // SAMAT and Payroll modules are completely retired and decommissioned from the system
  if (tab === 'samat' || tab === 'payroll') {
    return false;
  }

  const settings = storageService.getSettings();

  // Hide Teacher Portal and Parent Portals if their accounts/features are disabled
  if (tab === 'teacher_portal' && !settings.teacherAccountsEnabled && user.role !== 'Teacher') {
    return false;
  }
  if ((tab === 'parent_portal' || tab === 'parent_day_view') && !settings.parentAccountsEnabled && user.role !== 'Parent') {
    return false;
  }

  // 1. Admin and School Director have access to all operational views
  if (user.role === 'Admin' || user.role === 'SchoolDirector') return true;

  // 2. Strict Admin-Only Modules (Forbidden to ALL other roles)
  const adminOnlyTabs = [
    'users',
    'settings',
    'operations',
    'audit',
    'master_data',
    'backup',
    'import_center',
    'system_health',
  ];
  if (adminOnlyTabs.includes(tab)) {
    return false;
  }

  // 3. Parent Role Isolation (if enabled)
  if (user.role === 'Parent') {
    return tab === 'parent_day_view' || tab === 'parent_portal';
  }

  // 4. Teacher Role Isolation (if enabled)
  if (user.role === 'Teacher') {
    return tab === 'teacher_portal';
  }

  // 5. Student Affairs Role Isolation
  if (user.role === 'StudentAffairs') {
    const allowed = ['students', 'student_attendance', 'reports'];
    return allowed.includes(tab);
  }

  // 6. Teacher Affairs / HR Role Isolation
  if (user.role === 'TeacherAffairs' || user.role === 'HR') {
    const allowed = ['employees', 'daily_attendance', 'monthly_matrix', 'leaves', 'reports'];
    return allowed.includes(tab);
  }

  // 7. Social Specialist Role Isolation
  if (user.role === 'SocialSpecialist' || user.role === 'BehaviorOfficer') {
    const allowed = ['behavior', 'reports'];
    return allowed.includes(tab);
  }

  // 8. Training Officer
  if (user.role === 'TrainingOfficer') {
    const allowed = ['dashboard', 'employees', 'daily_attendance', 'leaves', 'reports'];
    return allowed.includes(tab);
  }

  // 10. Quality Officer
  if (user.role === 'QualityOfficer') {
    const allowed = [
      'dashboard',
      'students',
      'student_attendance',
      'behavior',
      'employees',
      'daily_attendance',
      'monthly_matrix',
      'leaves',
      'reports',
      'audit',
      'system_health',
    ];
    return allowed.includes(tab);
  }

  // 11. Supervisor
  if (user.role === 'Supervisor') {
    const allowed = [
      'dashboard',
      'students',
      'student_attendance',
      'behavior',
      'employees',
      'daily_attendance',
      'monthly_matrix',
      'reports',
    ];
    return allowed.includes(tab);
  }

  // 12. Viewer
  if (user.role === 'Viewer') {
    const allowed = ['dashboard', 'reports'];
    return allowed.includes(tab);
  }

  return false;
}
