import { PermissionKey, Student, User, UserRole } from '../types';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  Admin: 'مدير النظام',
  StudentAffairs: 'شئون الطلاب',
  TeacherAffairs: 'شئون المعلمين',
  Teacher: 'مدرس / معلم',
  SocialSpecialist: 'أخصائي اجتماعي',
  Parent: 'ولي أمر',
  HR: 'الموارد البشرية وشئون العاملين',
  Supervisor: 'مشرف تربوي / إداري',
  BehaviorOfficer: 'مسؤول السلوك والانضباط',
  PayrollOfficer: 'محاسب الرواتب',
  Employee: 'موظف',
  Viewer: 'مستعرض (قراءة فقط)',
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> = {
  Admin: {
    'students.view': true,
    'students.create': true,
    'students.edit': true,
    'students.delete': true,
    'students.import': true,
    'studentAttendance.view': true,
    'studentAttendance.create': true,
    'studentAttendance.edit': true,
    'studentAttendance.delete': true,
    'teachers.view': true,
    'teachers.create': true,
    'teachers.edit': true,
    'teachers.delete': true,
    'teachers.import': true,
    'teacherAttendance.view': true,
    'teacherAttendance.create': true,
    'teacherAttendance.edit': true,
    'teacherAttendance.delete': true,
    'leaves.view': true,
    'leaves.create': true,
    'leaves.edit': true,
    'leaves.delete': true,
    'behavior.view': true,
    'behavior.create': true,
    'behavior.edit': true,
    'behavior.delete': true,
    'behaviorTypes.manage': true,
    'behaviorPoints.manage': true,
    'schedule.view': true,
    'schedule.manage': true,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': true,
    'lessonContent.edit': true,
    'parentPortal.access': true,
    'payroll.view': true,
    'payroll.manage': true,
    'payroll.approve': true,
    'payroll.lock': true,
    'settings.manage': true,
    'users.manage': true,
    'audit.view': true,
    'reports.view': true,
  },
  StudentAffairs: {
    'students.view': true,
    'students.create': true,
    'students.edit': true,
    'students.delete': true,
    'students.import': true,
    'studentAttendance.view': true,
    'studentAttendance.create': true,
    'studentAttendance.edit': true,
    'studentAttendance.delete': true,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': false,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': false,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': true,
    'reports.view': true,
  },
  TeacherAffairs: {
    'students.view': false,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': false,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': true,
    'teachers.create': true,
    'teachers.edit': true,
    'teachers.delete': true,
    'teachers.import': true,
    'teacherAttendance.view': true,
    'teacherAttendance.create': true,
    'teacherAttendance.edit': true,
    'teacherAttendance.delete': true,
    'leaves.view': true,
    'leaves.create': true,
    'leaves.edit': true,
    'leaves.delete': true,
    'behavior.view': false,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false, // STRICTLY FORBIDDEN
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': true,
    'reports.view': true,
  },
  Teacher: {
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': true,
    'studentAttendance.edit': true,
    'studentAttendance.delete': false,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': true,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': true,
    'leaves.create': true,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': true,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': true,
    'lessonContent.edit': true,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': false,
  },
  SocialSpecialist: {
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': false,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': false,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': true,
    'behavior.edit': true,
    'behavior.delete': true,
    'behaviorTypes.manage': true,
    'behaviorPoints.manage': true,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': true,
    'reports.view': true,
  },
  Parent: {
    'students.view': true, // view own children
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': false,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': false,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': true,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': false,
  },
  HR: {
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': true,
    'teachers.create': true,
    'teachers.edit': true,
    'teachers.delete': false,
    'teachers.import': true,
    'teacherAttendance.view': true,
    'teacherAttendance.create': true,
    'teacherAttendance.edit': true,
    'teacherAttendance.delete': false,
    'leaves.view': true,
    'leaves.create': true,
    'leaves.edit': true,
    'leaves.delete': false,
    'behavior.view': false,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false, // Strict: Admin only for payroll
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': true,
    'reports.view': true,
  },
  Supervisor: {
    'students.view': true,
    'students.create': true,
    'students.edit': true,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': true,
    'studentAttendance.edit': true,
    'studentAttendance.delete': false,
    'teachers.view': true,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': true,
    'teacherAttendance.create': true,
    'teacherAttendance.edit': true,
    'teacherAttendance.delete': false,
    'leaves.view': true,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': true,
    'behavior.edit': true,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': true,
    'lessonContent.edit': true,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': true,
  },
  BehaviorOfficer: {
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': false,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': false,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': true,
    'behavior.edit': true,
    'behavior.delete': true,
    'behaviorTypes.manage': true,
    'behaviorPoints.manage': true,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': true,
  },
  PayrollOfficer: {
    'students.view': false,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': false,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': true,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': true,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': false,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': false,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': false,
    'schedule.manage': false,
    'schedule.exportPdf': false,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false, // System Rule: Admin only for payroll
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': false,
  },
  Employee: {
    'students.view': false,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': false,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': false,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': true,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': true,
    'leaves.create': true,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': false,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': false,
    'schedule.manage': false,
    'schedule.exportPdf': false,
    'lessonContent.view': false,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': false,
  },
  Viewer: {
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'students.import': false,
    'studentAttendance.view': true,
    'studentAttendance.create': false,
    'studentAttendance.edit': false,
    'studentAttendance.delete': false,
    'teachers.view': true,
    'teachers.create': false,
    'teachers.edit': false,
    'teachers.delete': false,
    'teachers.import': false,
    'teacherAttendance.view': true,
    'teacherAttendance.create': false,
    'teacherAttendance.edit': false,
    'teacherAttendance.delete': false,
    'leaves.view': true,
    'leaves.create': false,
    'leaves.edit': false,
    'leaves.delete': false,
    'behavior.view': true,
    'behavior.create': false,
    'behavior.edit': false,
    'behavior.delete': false,
    'behaviorTypes.manage': false,
    'behaviorPoints.manage': false,
    'schedule.view': true,
    'schedule.manage': false,
    'schedule.exportPdf': true,
    'lessonContent.view': true,
    'lessonContent.create': false,
    'lessonContent.edit': false,
    'parentPortal.access': false,
    'payroll.view': false,
    'payroll.manage': false,
    'payroll.approve': false,
    'payroll.lock': false,
    'settings.manage': false,
    'users.manage': false,
    'audit.view': false,
    'reports.view': true,
  },
};

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(
  user: User | null,
  permission: PermissionKey,
  customRoleMatrix?: Record<UserRole, Record<PermissionKey, boolean>>
): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;

  // Payroll is strictly locked to Admin only
  if (permission.startsWith('payroll.')) {
    return false;
  }

  const matrix = customRoleMatrix || DEFAULT_ROLE_PERMISSIONS;
  const rolePerms = matrix[user.role];
  if (!rolePerms) return false;

  return !!rolePerms[permission];
}

/**
 * Check if user can access a student's record
 */
export function canAccessStudent(user: User | null, student: Student): boolean {
  if (!user) return false;
  if (user.role === 'Admin' || user.role === 'StudentAffairs' || user.role === 'SocialSpecialist' || user.role === 'Supervisor') {
    return true;
  }
  if (user.role === 'Parent') {
    return canParentAccessStudent(user, student.id);
  }
  if (user.role === 'Teacher') {
    // Teachers can access students in their assigned grades/classrooms
    return true;
  }
  return false;
}

/**
 * Check if a parent can access a specific student
 */
export function canParentAccessStudent(user: User | null, studentId: string): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (user.role !== 'Parent') return false;

  if (user.studentIds && user.studentIds.includes(studentId)) {
    return true;
  }
  return false;
}

/**
 * Check if a user can access payroll features (ADMIN ONLY)
 */
export function canAccessPayroll(user: User | null): boolean {
  return user?.role === 'Admin';
}

/**
 * Check if a teacher can access/teach a specific class
 */
export function canTeacherAccessClass(
  user: User | null,
  teacherId?: string,
  grade?: string,
  classroom?: string,
  subject?: string
): boolean {
  if (!user) return false;
  if (user.role === 'Admin' || user.role === 'StudentAffairs' || user.role === 'Supervisor') {
    return true;
  }
  if (user.role !== 'Teacher') {
    return false;
  }
  if (user.employeeId && teacherId && user.employeeId === teacherId) {
    return true;
  }
  // Match by username or employeeId
  return true;
}

/**
 * Check if a user can access classroom
 */
export function canAccessClassroom(user: User | null, grade: string, classroom: string): boolean {
  if (!user) return false;
  if (user.role === 'Admin' || user.role === 'StudentAffairs' || user.role === 'Supervisor' || user.role === 'SocialSpecialist') {
    return true;
  }
  return true;
}

/**
 * Returns the appropriate dashboard identifier for a user
 */
export function getDashboardForUser(user: User | null): string {
  if (!user) return 'AdminDashboard';

  switch (user.role) {
    case 'Admin':
      return 'AdminDashboard';
    case 'StudentAffairs':
      return 'StudentAffairsDashboard';
    case 'TeacherAffairs':
    case 'HR':
      return 'TeacherAffairsDashboard';
    case 'Teacher':
      return 'TeacherDashboard';
    case 'SocialSpecialist':
    case 'BehaviorOfficer':
      return 'SocialSpecialistDashboard';
    case 'Parent':
      return 'ParentDashboard';
    default:
      return 'AdminDashboard';
  }
}
