import { User } from '../types';

/**
 * Resolves the primary landing route for any user based strictly on their role.
 * Never defaults to cached or previous user navigation states.
 */
export function resolveDefaultRouteForCurrentUser(user: User | null): string {
  if (!user) return 'dashboard';

  switch (user.role) {
    case 'Admin':
      return 'dashboard';
    case 'StudentAffairs':
      return 'students';
    case 'TeacherAffairs':
    case 'HR':
      return 'employees';
    case 'Teacher':
      return 'teacher_portal';
    case 'SocialSpecialist':
    case 'BehaviorOfficer':
      return 'behavior';
    case 'Parent':
      return 'parent_day_view';
    case 'Supervisor':
      return 'dashboard';
    case 'Viewer':
      return 'reports';
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

  // 1. Admin has access to all operational views
  if (user.role === 'Admin') return true;

  // 2. Strict Admin-Only Modules (Forbidden to ALL other roles)
  const adminOnlyTabs = [
    'payroll',
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

  // 3. Parent Role Isolation
  if (user.role === 'Parent') {
    return tab === 'parent_day_view' || tab === 'parent_portal';
  }

  // 4. Teacher Role Isolation
  if (user.role === 'Teacher') {
    // Teachers are strictly restricted to the Teacher Portal
    // (which includes Today's timeline, weekly schedule, homework, substitutions, own leaves, notifications)
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

  // 8. Supervisor
  if (user.role === 'Supervisor') {
    const allowed = [
      'dashboard',
      'students',
      'student_attendance',
      'behavior',
      'teacher_portal',
      'employees',
      'daily_attendance',
      'monthly_matrix',
      'reports',
    ];
    return allowed.includes(tab);
  }

  // 9. Viewer
  if (user.role === 'Viewer') {
    const allowed = ['dashboard', 'reports'];
    return allowed.includes(tab);
  }

  return false;
}
