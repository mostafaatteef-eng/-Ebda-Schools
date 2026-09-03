import { ConflictRuleConfig, ScheduleConflict, ScheduleConflictResult, ScheduleItem, ScheduleSubstitution } from '../types';

export class ScheduleConflictService {
  public static validateScheduleItem(
    candidate: ScheduleItem,
    allScheduleItems: ScheduleItem[],
    rules: ConflictRuleConfig = {
      blockTeacherDoubleBooking: true,
      blockClassroomDoubleBooking: true,
      blockRoomDoubleBooking: true,
      warnMaxDailySubjectLimit: true,
      maxDailySubjectLimit: 2,
      maxTeacherDailyPeriods: 5,
      maxConsecutiveTeacherPeriods: 3,
    },
    substitutions: ScheduleSubstitution[] = []
  ): ScheduleConflictResult {
    const conflicts: ScheduleConflict[] = [];
    const day = candidate.dayOfWeek || candidate.dayName || '';
    const period = candidate.periodNumber;

    // Filter out the item itself if updating
    const existing = allScheduleItems.filter(
      s => s.id !== candidate.id && s.isActive !== false && s.status !== 'Archived' && s.status !== 'Suspended'
    );

    // 1. Teacher Double Booking
    if (rules.blockTeacherDoubleBooking !== false && candidate.teacherId) {
      const teacherClash = existing.find(
        s =>
          s.teacherId === candidate.teacherId &&
          (s.dayOfWeek === day || s.dayName === day) &&
          s.periodNumber === period
      );

      if (teacherClash) {
        conflicts.push({
          type: 'TEACHER_DOUBLE_BOOKING',
          severity: 'BLOCK',
          message: `المعلم (${candidate.teacherName || candidate.teacherId}) لديه حصة مسجلة بالفعل في نفس التوقيت للفصل (${teacherClash.grade} - ${teacherClash.classroom}) بمادة (${teacherClash.subject}).`,
          conflictingItemIds: [teacherClash.id],
          dayName: day,
          periodNumber: period,
        });
      }
    }

    // 2. Classroom Double Booking
    if (rules.blockClassroomDoubleBooking !== false && candidate.grade && candidate.classroom) {
      const classClash = existing.find(
        s =>
          s.grade === candidate.grade &&
          s.classroom === candidate.classroom &&
          (s.dayOfWeek === day || s.dayName === day) &&
          s.periodNumber === period
      );

      if (classClash) {
        conflicts.push({
          type: 'CLASSROOM_DOUBLE_BOOKING',
          severity: 'BLOCK',
          message: `الفصل (${candidate.grade} - ${candidate.classroom}) مسند إليه بالفعل مادة (${classClash.subject}) مع المعلم (${classClash.teacherName}) في الحصة رقم ${period}.`,
          conflictingItemIds: [classClash.id],
          dayName: day,
          periodNumber: period,
        });
      }
    }

    // 3. Room / Lab Location Double Booking
    const candidateRoom = candidate.roomId || candidate.locationId || candidate.roomNumber;
    if (rules.blockRoomDoubleBooking !== false && candidateRoom) {
      const roomClash = existing.find(
        s =>
          (s.roomId === candidateRoom || s.locationId === candidateRoom || (s.roomNumber && s.roomNumber === candidateRoom)) &&
          (s.dayOfWeek === day || s.dayName === day) &&
          s.periodNumber === period
      );

      if (roomClash) {
        conflicts.push({
          type: 'ROOM_DOUBLE_BOOKING',
          severity: 'BLOCK',
          message: `القاعة / المعمل (${candidateRoom}) محجوزة بالفعل في نفس الحصة لفصل (${roomClash.grade} - ${roomClash.classroom}).`,
          conflictingItemIds: [roomClash.id],
          dayName: day,
          periodNumber: period,
        });
      }
    }

    // 4. Max Daily Subject Repetition Warning
    if (rules.warnMaxDailySubjectLimit !== false && candidate.subject && candidate.grade && candidate.classroom) {
      const sameSubjectTodayCount = existing.filter(
        s =>
          s.grade === candidate.grade &&
          s.classroom === candidate.classroom &&
          (s.dayOfWeek === day || s.dayName === day) &&
          s.subject === candidate.subject
      ).length + 1;

      const limit = rules.maxDailySubjectLimit || 2;
      if (sameSubjectTodayCount > limit) {
        conflicts.push({
          type: 'MAX_SUBJECT_EXCEEDED',
          severity: 'WARNING',
          message: `تنبيه: مادة (${candidate.subject}) تكررت ${sameSubjectTodayCount} مرات في نفس اليوم لهذا الفصل (الحد الموصى به: ${limit} حصص).`,
          conflictingItemIds: [],
          dayName: day,
          periodNumber: period,
        });
      }
    }

    const hasBlocking = conflicts.some(c => c.severity === 'BLOCK');
    const hasWarnings = conflicts.some(c => c.severity === 'WARNING');

    return {
      hasConflicts: conflicts.length > 0,
      hasBlockingConflicts: hasBlocking,
      hasWarnings,
      conflicts,
      messages: conflicts.map(c => c.message),
    };
  }

  public static auditEntireSchedule(
    items: ScheduleItem[],
    rules?: ConflictRuleConfig
  ): ScheduleConflictResult {
    const allConflicts: ScheduleConflict[] = [];

    const activeItems = items.filter(
      i => i.isActive !== false && i.status !== 'Archived' && i.status !== 'Suspended'
    );

    for (let i = 0; i < activeItems.length; i++) {
      const current = activeItems[i];
      const others = activeItems.filter((_, idx) => idx !== i);
      const res = this.validateScheduleItem(current, others, rules);
      for (const conf of res.conflicts) {
        // Avoid duplicate mirrored conflicts
        const exists = allConflicts.some(
          c =>
            c.type === conf.type &&
            c.dayName === conf.dayName &&
            c.periodNumber === conf.periodNumber &&
            (c.message === conf.message || (c.conflictingItemIds.includes(current.id) && conf.conflictingItemIds.includes(c.conflictingItemIds[0])))
        );
        if (!exists) {
          allConflicts.push(conf);
        }
      }
    }

    return {
      hasConflicts: allConflicts.length > 0,
      hasBlockingConflicts: allConflicts.some(c => c.severity === 'BLOCK'),
      hasWarnings: allConflicts.some(c => c.severity === 'WARNING'),
      conflicts: allConflicts,
      messages: allConflicts.map(c => c.message),
    };
  }
}
