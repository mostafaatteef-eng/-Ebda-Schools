import {
  Employee,
  Homework,
  LessonContent,
  LessonInstance,
  ScheduleConflictResult,
  ScheduleItem,
  ScheduleSubstitution,
  User,
} from '../types';
import { STORAGE_KEYS } from './storageServiceConstants';
import { storageService } from './storageService';
import { ScheduleConflictService } from './scheduleConflictService';
import { getCairoCurrentDate, getCairoNowISO, getEgyptianDayName } from '../utils/egyptianTime';

export interface TeacherDayContext {
  date: string;
  dayName: string;
  teacherId: string;
  teacherName: string;
  periods: Array<{
    periodNumber: number;
    startTime: string;
    endTime: string;
    scheduleItem?: ScheduleItem;
    substitution?: ScheduleSubstitution;
    isSubstituted: boolean;
    isSubstitutionForOther: boolean;
    effectiveSubject: string;
    effectiveGrade: string;
    effectiveClassroom: string;
    effectiveRoom: string;
    lessonInstance?: LessonInstance;
    lessonContent?: LessonContent;
    homework?: Homework;
    deliveryStatus: string;
  }>;
}

export class ScheduleService {
  public static getSchedule(): ScheduleItem[] {
    return storageService.getSchedule();
  }

  public static getSubstitutions(date?: string): ScheduleSubstitution[] {
    return storageService.getSubstitutions(date ? { date } : undefined);
  }

  public static getLessonInstances(date?: string): LessonInstance[] {
    return storageService.getLessonInstances(date ? { date } : undefined);
  }

  public static getLessonContents(): LessonContent[] {
    return storageService.getLessonContents();
  }

  /**
   * Save a schedule item with conflict validation
   */
  public static saveScheduleItem(
    item: ScheduleItem,
    forceBypassWarnings = false
  ): { success: boolean; conflictResult?: ScheduleConflictResult; data?: ScheduleItem; message?: string } {
    const all = this.getSchedule();
    const conflictResult = ScheduleConflictService.validateScheduleItem(item, all);

    if (conflictResult.hasBlockingConflicts && !forceBypassWarnings) {
      return {
        success: false,
        conflictResult,
        message: conflictResult.messages.join(' | '),
      };
    }

    const now = getCairoNowISO();
    const prepared: ScheduleItem = {
      ...item,
      id: item.id || `SCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: item.status || 'Active',
      isActive: item.isActive !== false,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };

    storageService.saveScheduleItem(prepared);
    return {
      success: true,
      conflictResult,
      data: prepared,
      message: 'تم حفظ الحصة في الجدول بنجاح',
    };
  }

  /**
   * Builds the comprehensive operational daily context for any teacher
   */
  public static getTeacherDayContext(
    teacherId: string,
    date = getCairoCurrentDate()
  ): TeacherDayContext {
    const dayName = getEgyptianDayName(date);
    const scheduleConfig = storageService.getScheduleConfig();
    const periodCount = scheduleConfig.periodCount || 7;
    const scheduleItems = this.getSchedule().filter(
      s => s.isActive !== false && (s.dayOfWeek === dayName || s.dayName === dayName)
    );
    const substitutions = this.getSubstitutions(date);
    const lessonInstances = this.getLessonInstances(date);
    const lessonContents = this.getLessonContents();
    const allHomeworks = storageService.getHomeworks();
    const employees = storageService.getEmployees();
    const teacher = employees.find(e => e.id === teacherId || e.employeeNumber === teacherId);
    const teacherName = teacher?.name || 'المعلم';

    const periods: TeacherDayContext['periods'] = [];

    for (let p = 1; p <= periodCount; p++) {
      // 1. Original scheduled item for this teacher
      const originalItem = scheduleItems.find(
        s => s.teacherId === teacherId && s.periodNumber === p
      );

      // 2. Is there a substitution WHERE this teacher was replaced by someone else?
      const subOut = substitutions.find(
        sub =>
          sub.originalTeacherId === teacherId &&
          sub.periodNumber === p &&
          sub.status !== 'Cancelled'
      );

      // 3. Is there a substitution WHERE this teacher is covering FOR someone else?
      const subIn = substitutions.find(
        sub =>
          sub.substituteTeacherId === teacherId &&
          sub.periodNumber === p &&
          sub.status !== 'Cancelled'
      );

      // 4. Default timing
      const periodTime = scheduleConfig.periodTimes?.[p - 1] || {
        startTime: `0${7 + p}:45`,
        endTime: `0${8 + p}:30`,
      };

      if (subIn) {
        // Teacher is covering as a substitute!
        const instance = lessonInstances.find(
          i => i.periodNumber === p && (i.scheduleItemId === subIn.scheduleItemId || i.classroomId === subIn.classroomId)
        );
        const content = lessonContents.find(
          c => c.date === date && c.periodNumber === p && c.teacherId === teacherId
        );
        const hw = allHomeworks.find(
          h => h.assignedDate === date && h.subject === subIn.subject && h.classroom === subIn.classroom
        );

        periods.push({
          periodNumber: p,
          startTime: originalItem?.startTime || periodTime.startTime,
          endTime: originalItem?.endTime || periodTime.endTime,
          scheduleItem: undefined,
          substitution: subIn,
          isSubstituted: false,
          isSubstitutionForOther: true,
          effectiveSubject: subIn.subject,
          effectiveGrade: subIn.grade,
          effectiveClassroom: subIn.classroom,
          effectiveRoom: 'فصل المادة',
          lessonInstance: instance,
          lessonContent: content,
          homework: hw,
          deliveryStatus: instance?.deliveryStatus || (content ? 'Delivered' : 'Scheduled'),
        });
      } else if (originalItem) {
        if (subOut) {
          // Teacher is relieved for this period by substitute
          periods.push({
            periodNumber: p,
            startTime: originalItem.startTime || periodTime.startTime,
            endTime: originalItem.endTime || periodTime.endTime,
            scheduleItem: originalItem,
            substitution: subOut,
            isSubstituted: true,
            isSubstitutionForOther: false,
            effectiveSubject: originalItem.subject,
            effectiveGrade: originalItem.grade,
            effectiveClassroom: originalItem.classroom,
            effectiveRoom: originalItem.roomNumber || 'قاعة دراسية',
            deliveryStatus: 'Substituted',
          });
        } else {
          // Regular scheduled class
          const instance = lessonInstances.find(
            i => i.periodNumber === p && (i.scheduleItemId === originalItem.id || (i.grade === originalItem.grade && i.classroom === originalItem.classroom))
          );
          const content = lessonContents.find(
            c => c.date === date && c.periodNumber === p && (c.teacherId === teacherId || c.scheduleItemId === originalItem.id)
          );
          const hw = allHomeworks.find(
            h => h.assignedDate === date && h.subject === originalItem.subject && h.classroom === originalItem.classroom
          );

          periods.push({
            periodNumber: p,
            startTime: originalItem.startTime || periodTime.startTime,
            endTime: originalItem.endTime || periodTime.endTime,
            scheduleItem: originalItem,
            substitution: undefined,
            isSubstituted: false,
            isSubstitutionForOther: false,
            effectiveSubject: originalItem.subject,
            effectiveGrade: originalItem.grade,
            effectiveClassroom: originalItem.classroom,
            effectiveRoom: originalItem.roomNumber || 'قاعة دراسية',
            lessonInstance: instance,
            lessonContent: content,
            homework: hw,
            deliveryStatus: instance?.deliveryStatus || (content ? 'Delivered' : 'Scheduled'),
          });
        }
      } else {
        // Free period (حصة فراغ)
        periods.push({
          periodNumber: p,
          startTime: periodTime.startTime,
          endTime: periodTime.endTime,
          isSubstituted: false,
          isSubstitutionForOther: false,
          effectiveSubject: 'حصة فراغ / إشراف',
          effectiveGrade: '-',
          effectiveClassroom: '-',
          effectiveRoom: '-',
          deliveryStatus: 'Scheduled',
        });
      }
    }

    return {
      date,
      dayName,
      teacherId,
      teacherName,
      periods,
    };
  }
}
