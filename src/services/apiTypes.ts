import {
  AcademicYear,
  AttendanceRecord,
  AuditLogEntry,
  BehaviorCase,
  BehaviorScoreLedger,
  BehaviorType,
  BehaviorViolation,
  Employee,
  Homework,
  LeaveRecord,
  LessonContent,
  LessonInstance,
  MasterDataItem,
  PayrollAttendanceSnapshot,
  PayrollRecord,
  PositiveBehaviorType,
  ScheduleItem,
  ScheduleSubstitution,
  Student,
  StudentAttendanceRecord,
  StudentEnrollment,
  SystemSettings,
  User,
  UserRole,
} from '../types';
import { AppNotification, PendingAction, SavedReportFilter, SyncQueueItem } from '../types_extended';
import { getCairoNowISO } from '../utils/egyptianTime';

/* =========================================================================
 * Specialized Query Parameters & Filters
 * ========================================================================= */
export interface StudentQueryFilters {
  academicYearId?: string;
  gradeId?: string;
  grade?: string;
  classroomId?: string;
  classroom?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StudentAttendanceQueryFilters {
  date?: string;
  fromDate?: string;
  toDate?: string;
  grade?: string;
  classroom?: string;
  studentId?: string;
  status?: string;
}

export interface TeacherAttendanceQueryFilters {
  date?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  employeeId?: string;
  status?: string;
}

export interface HomeworkQueryFilters {
  academicYearId?: string;
  termId?: string;
  grade?: string;
  classroom?: string;
  teacherId?: string;
  subject?: string;
  lessonInstanceId?: string;
  status?: string;
  isArchived?: boolean;
}

export interface LessonContentQueryFilters {
  date?: string;
  grade?: string;
  classroom?: string;
  teacherId?: string;
  subject?: string;
}

export interface BehaviorQueryFilters {
  studentId?: string;
  grade?: string;
  classroom?: string;
  fromDate?: string;
  toDate?: string;
  severity?: string;
  status?: string;
}

export interface ParentDayViewData {
  student: Student;
  date: string;
  attendance: StudentAttendanceRecord | null;
  daySchedule: Array<{
    periodNumber: number;
    startTime: string;
    endTime: string;
    subject: string;
    teacherName: string;
    lessonContent: LessonContent | null;
    isSubstituted: boolean;
    substituteTeacherName?: string;
  }>;
  dueHomeworks: Homework[];
  recentViolations: BehaviorViolation[];
  recentPositiveScores: BehaviorScoreLedger[];
  recentNotifications: AppNotification[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  requestId?: string;
  serverTime?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
