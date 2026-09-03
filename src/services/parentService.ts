/**
 * Parent Service (بوابة ولي الأمر واليوم الدراسي)
 * Backend-Authoritative Aggregator with Strict Security, Data Sanitization, and Deduplication
 */

import {
  Student,
  User,
  StudentAttendanceRecord,
  ClassAttendanceRecord,
  ScheduleItem,
  LessonContent,
  Homework,
  ScheduleSubstitution,
  BehaviorViolation,
  BehaviorScoreLedger,
  AppNotification,
  ParentPortalSettings,
} from '../types';
import { storageService } from './storageService';
import { NotificationService } from './notificationService';
import {
  getCairoCurrentDate,
  getEgyptianDayName,
  formatEgyptianDate,
  getCairoNowISO,
} from '../utils/egyptianTime';

export interface ParentSafeStudent {
  id: string;
  code: string;
  name: string;
  nationalIdMasked: string;
  grade: string;
  classroom: string;
  gender: string;
  status: string;
  academicYear: string;
  parentName?: string;
  parentPhone?: string;
  relationship?: string;
}

export interface ParentSchedulePeriodView {
  id: string;
  periodNumber: number;
  periodName: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName?: string;
  room?: string;
  deliveryStatus: 'Delivered' | 'Scheduled' | 'Cancelled' | 'Substituted';
  lessonContent?: {
    id: string;
    title: string;
    summary: string;
    bookPages?: string;
    learningObjectives?: string[];
    resources?: { title: string; url: string; type: string }[];
  };
  homework?: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: string;
  };
  isSubstituted?: boolean;
  substituteTeacherName?: string;
  substitutionReason?: string;
  classAttendanceStatus?: 'حاضر' | 'غائب' | 'متأخر' | 'لم يرصد';
}

export interface ParentDayViewData {
  student: ParentSafeStudent;
  date: string;
  dayName: string;
  formattedDate: string;
  attendance: {
    status: 'حاضر' | 'غائب' | 'متأخر' | 'إذن' | 'عطلة' | 'لم يرصد';
    statusText: string;
    checkInTime?: string;
    checkOutTime?: string;
    lateMinutes?: number;
    excuseReason?: string;
    isExcused?: boolean;
    isApproved?: boolean;
    isLocked?: boolean;
  };
  classAttendanceMismatch: {
    hasMismatch: boolean;
    missedPeriods: number[];
    message?: string;
  };
  schedule: ParentSchedulePeriodView[];
  homeworks: {
    dueToday: Homework[];
    upcoming: Homework[];
    pastDue: Homework[];
    totalCount: number;
  };
  behavior: {
    currentScore?: number;
    scoreLevel: string;
    statusColor: string;
    recentPositiveAwards: any[];
    recentViolations: any[];
    hasOpenCase: boolean;
    caseStatusMessage?: string;
  };
  recentNotifications: AppNotification[];
  settings: ParentPortalSettings;
  lastSyncedAt: string;
  isAdminPreview?: boolean;
}

export interface ParentAttendanceSummary {
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  totalLateMinutes: number;
  attendanceRate: number; // 0 to 100 %
  records: StudentAttendanceRecord[];
}

export class ParentService {
  /**
   * Mask national ID for security and privacy (e.g. 29901011234567 -> *******4567)
   */
  public static maskNationalId(nationalId?: string): string {
    if (!nationalId) return '';
    const clean = nationalId.trim();
    if (clean.length <= 4) return '****';
    const lastFour = clean.slice(-4);
    return `${'*'.repeat(Math.min(clean.length - 4, 8))}${lastFour}`;
  }

  /**
   * Sanitizes student profile for parent view (strips sensitive internal fields)
   */
  public static sanitizeStudentForParent(student: Student, relationship?: string): ParentSafeStudent {
    return {
      id: student.id,
      code: student.studentCode || (student as any).code || student.id,
      name: student.name,
      nationalIdMasked: this.maskNationalId(student.nationalId),
      grade: student.grade,
      classroom: student.classroom,
      gender: student.gender,
      status: student.status,
      academicYear: student.academicYear,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      relationship: relationship || 'ولي أمر',
    };
  }

  /**
   * Backend-enforced authorization check: can this user access this student?
   */
  public static isParentAuthorizedForStudent(
    currentUser: User | null,
    studentId: string
  ): { authorized: boolean; reason?: string; isAdminPreview?: boolean } {
    if (!currentUser) {
      return { authorized: false, reason: 'يجب تسجيل الدخول أولاً' };
    }

    // Admin has preview authorization for any student
    if (currentUser.role === 'Admin') {
      return { authorized: true, isAdminPreview: true };
    }

    // Only Parent role can access parent endpoints
    if (currentUser.role !== 'Parent') {
      return { authorized: false, reason: 'هذه البوابة مخصصة لأولياء الأمور فقط' };
    }

    // Direct studentIds array check on user profile
    if (currentUser.studentIds && currentUser.studentIds.includes(studentId)) {
      return { authorized: true, isAdminPreview: false };
    }

    // Secondary match: Check student record directly in storage
    const allStudents = storageService.getStudents();
    const student = allStudents.find(s => s.id === studentId);
    if (!student) {
      return { authorized: false, reason: 'الطالب غير موجود بالنظام' };
    }

    const matchesParentId = (student as any).parentId === currentUser.id;
    const matchesPhone = (currentUser as any).phone && student.parentPhone === (currentUser as any).phone;
    const matchesEmail = currentUser.email && student.parentEmail === currentUser.email;

    if (matchesParentId || matchesPhone || matchesEmail) {
      return { authorized: true, isAdminPreview: false };
    }

    return { authorized: false, reason: 'غير مصرح بالوصول لبيانات هذا الطالب' };
  }

  /**
   * Returns sanitized list of linked students for the authenticated parent.
   * If user is Admin, returns all students for preview purposes.
   */
  public static getMyLinkedStudents(currentUser: User | null): ParentSafeStudent[] {
    if (!currentUser) return [];

    const allStudents = storageService.getStudents();

    if (currentUser.role === 'Admin') {
      return allStudents.map(s => this.sanitizeStudentForParent(s, 'معاينة الإدارة'));
    }

    if (currentUser.role !== 'Parent') {
      return [];
    }

    const linked = allStudents.filter(s => {
      if (currentUser.studentIds && currentUser.studentIds.includes(s.id)) return true;
      if ((s as any).parentId === currentUser.id) return true;
      if ((currentUser as any).phone && s.parentPhone === (currentUser as any).phone) return true;
      if (currentUser.email && s.parentEmail === currentUser.email) return true;
      return false;
    });

    return linked.map(s => this.sanitizeStudentForParent(s, 'ولي أمر'));
  }

  /**
   * Aggregates and returns complete single-day view for a child
   */
  public static getParentDayView(
    studentId: string,
    targetDate?: string,
    currentUser: User | null = storageService.getCurrentUser()
  ): { success: boolean; data?: ParentDayViewData; error?: string } {
    const auth = this.isParentAuthorizedForStudent(currentUser, studentId);
    if (!auth.authorized) {
      return { success: false, error: auth.reason || 'غير مصرح بالوصول' };
    }

    const allStudents = storageService.getStudents();
    const studentRaw = allStudents.find(s => s.id === studentId);
    if (!studentRaw) {
      return { success: false, error: 'لم يتم العثور على سجل الطالب المطلوب' };
    }

    const settings = storageService.getSettings();
    const parentSettings: ParentPortalSettings = settings.parentPortalSettings || {
      showAttendance: true,
      showCheckInTime: true,
      showCheckOutTime: true,
      showLateMinutes: true,
      showAttendanceRate: true,
      showAbsenceReason: true,
      showClassAttendance: true,
      showBehavior: true,
      showBehaviorPoints: true,
      showBehaviorScore: true,
      showPositiveBehavior: true,
      showBehaviorCaseStatus: true,
      showViolationDescription: true,
      showTeacherName: true,
      showSubstituteTeacherName: true,
      showLessonContent: true,
      showHomework: true,
      showLearningLinks: true,
      showWeeklySchedule: true,
      homeworkUpcomingDays: 7,
      enableNotifications: true,
      notifyOnAbsence: true,
      notifyOnLate: true,
      notifyOnHomework: true,
      notifyOnBehaviorViolation: true,
      notifyOnPositiveBehavior: true,
      notifyOnScheduleSubstitution: true,
    };

    const date = targetDate || getCairoCurrentDate();
    const dayName = getEgyptianDayName(date);
    const formattedDate = `${dayName}، ${formatEgyptianDate(date)}`;
    const student = this.sanitizeStudentForParent(studentRaw);

    // 1. School Daily Attendance
    const allAttendance = storageService.getStudentAttendance();
    const attendanceRecord = allAttendance.find(a => a.studentId === studentId && a.date === date);

    let attStatus: 'حاضر' | 'غائب' | 'متأخر' | 'إذن' | 'عطلة' | 'لم يرصد' = 'لم يرصد';
    let attStatusText = 'لم يُرصد بعد';

    if (attendanceRecord) {
      if (attendanceRecord.status === 'حاضر') {
        attStatus = 'حاضر';
        attStatusText = 'حاضر باليوم الدراسي';
      } else if (attendanceRecord.status === 'متأخر') {
        attStatus = 'متأخر';
        attStatusText = `متأخر (${attendanceRecord.lateMinutes || 0} دقيقة)`;
      } else if (attendanceRecord.status === 'غائب') {
        attStatus = 'غائب';
        attStatusText = attendanceRecord.absenceReason ? 'غائب بعذر مقبول' : 'غائب بدون عذر';
      } else if (attendanceRecord.status === 'مأذونية' || attendanceRecord.status === 'إذن') {
        attStatus = 'إذن';
        attStatusText = 'حاصل على إذن خروج/مأذونية';
      }
    }

    // 2. Class-by-Class Attendance (Period Attendance) & Mismatch Detection
    const classAttendanceList = storageService.getClassAttendance({
      date,
      studentId,
    });

    const missedPeriods: number[] = [];
    classAttendanceList.forEach(ca => {
      if (ca.status === 'غائب') {
        missedPeriods.push(ca.periodNumber);
      }
    });

    const hasMismatch =
      (attStatus === 'حاضر' && missedPeriods.length > 0) ||
      (attStatus === 'غائب' && classAttendanceList.some(ca => ca.status === 'حاضر'));

    let mismatchMessage: string | undefined = undefined;
    if (hasMismatch) {
      if (missedPeriods.length > 0) {
        mismatchMessage = `تنبيه: الطالب مسجل حضور بالمدرسة لكنه غائب عن الحصص (${missedPeriods.join(', ')})`;
      }
    }

    // 3. Today's Schedule and Lesson Content
    const allSchedules = storageService.getSchedule();
    const studentSchedules = allSchedules
      .filter(
        s =>
          s.grade === studentRaw.grade &&
          (!s.classroom || s.classroom === studentRaw.classroom) &&
          (s.dayName === dayName || s.dayOfWeek === dayName)
      )
      .sort((a, b) => a.periodNumber - b.periodNumber);

    // Published Lesson Contents for today
    const allLessonContents = storageService.getLessonContents();
    const lessonContentsToday = allLessonContents.filter(
      l =>
        l.grade === studentRaw.grade &&
        (!l.classroom || l.classroom === studentRaw.classroom) &&
        l.date === date &&
        (l.status === 'Published' || (l as any).published === true) &&
        (l as any).isVisibleToParent !== false
    );

    // Homeworks for today and upcoming
    const allHomeworks = storageService
      .getHomeworks()
      .filter(
        h =>
          h.grade === studentRaw.grade &&
          (!h.classroom || h.classroom === studentRaw.classroom) &&
          (h.status === 'Published' || (h as any).published === true)
      );

    // Substitutions for today
    const allSubstitutions = storageService.getSubstitutions({
      date,
    });

    // Build timeline periods
    const scheduleItems: ParentSchedulePeriodView[] = studentSchedules.map(slot => {
      // Check lesson content
      const matchedLesson = lessonContentsToday.find(
        l => l.periodNumber === slot.periodNumber || l.subject === slot.subject
      );

      // Check homework
      const matchedHomework = allHomeworks.find(
        h => h.subject === slot.subject && h.assignedDate === date
      );

      // Check substitution
      const matchedSub = allSubstitutions.find(
        sub =>
          sub.periodNumber === slot.periodNumber &&
          (sub.originalTeacherName === slot.teacherName || sub.originalTeacherId === slot.teacherId)
      );

      // Check class attendance
      const matchedClassAtt = classAttendanceList.find(c => c.periodNumber === slot.periodNumber);

      let deliveryStatus: 'Delivered' | 'Scheduled' | 'Cancelled' | 'Substituted' = 'Scheduled';
      if (matchedSub) {
        deliveryStatus = 'Substituted';
      } else if (matchedLesson) {
        deliveryStatus = 'Delivered';
      }

      return {
        id: slot.id,
        periodNumber: slot.periodNumber,
        periodName: `الحصة ${slot.periodNumber}`,
        startTime: slot.startTime || '',
        endTime: slot.endTime || '',
        subject: slot.subject,
        teacherName: parentSettings.showTeacherName ? slot.teacherName : undefined,
        room: (slot as any).room || slot.roomNumber,
        deliveryStatus,
        lessonContent:
          parentSettings.showLessonContent && matchedLesson
            ? {
                id: matchedLesson.id,
                title: matchedLesson.title || matchedLesson.lessonTitle || '',
                summary: matchedLesson.summary || (matchedLesson as any).content || '',
                bookPages: matchedLesson.bookPages || (matchedLesson as any).pages,
                learningObjectives: (matchedLesson as any).objectives || [],
                resources: parentSettings.showLearningLinks ? (matchedLesson as any).resources || [] : [],
              }
            : undefined,
        homework:
          parentSettings.showHomework && matchedHomework
            ? {
                id: matchedHomework.id,
                title: matchedHomework.title,
                description: matchedHomework.description,
                dueDate: matchedHomework.dueDate,
                status: matchedHomework.status,
              }
            : undefined,
        isSubstituted: !!matchedSub,
        substituteTeacherName:
          parentSettings.showSubstituteTeacherName && matchedSub ? matchedSub.substituteTeacherName : undefined,
        substitutionReason: matchedSub?.reason,
        classAttendanceStatus: (matchedClassAtt?.status as any) || 'لم يرصد',
      };
    });

    // 4. Homework Categorization
    const dueToday = allHomeworks.filter(h => h.dueDate === date);
    const upcoming = allHomeworks.filter(h => h.dueDate > date);
    const pastDue = allHomeworks.filter(h => h.dueDate < date);

    // 5. Behavior & Positive Points
    const behaviorViolations = storageService
      .getBehaviorViolations()
      .filter(v => v.studentId === studentId && v.status === 'معتمدة' && (v as any).isVisibleToParent !== false);

    const behaviorLedger = storageService
      .getBehaviorLedger(studentId)
      .filter(entry => (entry as any).type === 'CREDIT' || (entry.points && entry.points > 0));

    const behaviorScore = storageService.calculateStudentBehaviorScore(studentId);

    // Check if active case exists (show generic badge if enabled)
    const allCases = storageService.getBehaviorCases({ studentId });
    const hasOpenCase = allCases.some(c => c.status === 'NEW' || c.status === 'IN_PROGRESS');

    // 6. Recent Notifications for Parent & Student
    const notifications = NotificationService.getNotifications('Parent', currentUser?.id, studentId).slice(0, 5);

    return {
      success: true,
      data: {
        student,
        date,
        dayName,
        formattedDate,
        attendance: {
          status: attStatus,
          statusText: attStatusText,
          checkInTime: parentSettings.showCheckInTime ? attendanceRecord?.checkInTime : undefined,
          checkOutTime: parentSettings.showCheckOutTime ? attendanceRecord?.checkOutTime : undefined,
          lateMinutes: parentSettings.showLateMinutes ? attendanceRecord?.lateMinutes : undefined,
          excuseReason: parentSettings.showAbsenceReason ? attendanceRecord?.absenceReason : undefined,
          isExcused: !!attendanceRecord?.absenceReason,
          isApproved: !!attendanceRecord?.approvedBy,
          isLocked: !!attendanceRecord?.lockedBy,
        },
        classAttendanceMismatch: {
          hasMismatch,
          missedPeriods,
          message: mismatchMessage,
        },
        schedule: scheduleItems,
        homeworks: {
          dueToday,
          upcoming,
          pastDue,
          totalCount: allHomeworks.length,
        },
        behavior: {
          currentScore: parentSettings.showBehaviorScore ? behaviorScore.currentScore : undefined,
          scoreLevel: behaviorScore.statusText,
          statusColor: behaviorScore.statusColor,
          recentPositiveAwards: parentSettings.showPositiveBehavior ? behaviorLedger.slice(0, 3) : [],
          recentViolations: parentSettings.showBehavior ? behaviorViolations.slice(0, 3) : [],
          hasOpenCase: parentSettings.showBehaviorCaseStatus ? hasOpenCase : false,
          caseStatusMessage: hasOpenCase ? 'يوجد ملف متابعة تربوية نشط مع الأخصائي الاجتماعي' : undefined,
        },
        recentNotifications: notifications,
        settings: parentSettings,
        lastSyncedAt: getCairoNowISO(),
        isAdminPreview: auth.isAdminPreview || false,
      },
    };
  }

  /**
   * Attendance statistics summary for parent
   */
  public static getParentAttendanceSummary(
    studentId: string,
    currentUser: User | null = storageService.getCurrentUser()
  ): { success: boolean; data?: ParentAttendanceSummary; error?: string } {
    const auth = this.isParentAuthorizedForStudent(currentUser, studentId);
    if (!auth.authorized) {
      return { success: false, error: auth.reason };
    }

    const allRecords = storageService.getStudentAttendance().filter(a => a.studentId === studentId);
    const presentDays = allRecords.filter(a => a.status === 'حاضر').length;
    const lateDays = allRecords.filter(a => a.status === 'متأخر').length;
    const absentDays = allRecords.filter(a => a.status === 'غائب').length;
    const excusedDays = allRecords.filter(a => a.status === 'غائب' && (!!a.absenceReason || (a as any).isExcused)).length;
    const totalLateMinutes = allRecords.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);

    const totalSchoolDays = allRecords.length;
    const attendedDays = presentDays + lateDays;
    const attendanceRate = totalSchoolDays > 0 ? Math.round((attendedDays / totalSchoolDays) * 100) : 100;

    return {
      success: true,
      data: {
        totalSchoolDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        totalLateMinutes,
        attendanceRate,
        records: allRecords.sort((a, b) => b.date.localeCompare(a.date)),
      },
    };
  }
}
