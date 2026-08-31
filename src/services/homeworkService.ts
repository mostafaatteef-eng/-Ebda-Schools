import { Homework, HomeworkStatus, User } from '../types';
import { HomeworkQueryFilters } from './apiTypes';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO } from '../utils/egyptianTime';

export class HomeworkService {
  private static getStorageKey(): string {
    return STORAGE_KEYS.HOMEWORKS || 'ntss_homeworks_v3';
  }

  public static getHomeworks(filters?: HomeworkQueryFilters, currentUser?: User | null): Homework[] {
    const raw = localStorage.getItem(this.getStorageKey());
    let list: Homework[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (!filters && !currentUser) return list;

    return list.filter(hw => {
      // 1. If Parent / Student: Only show PUBLISHED homeworks
      if (currentUser && (currentUser.role === 'Parent' || currentUser.role === 'Viewer')) {
        if (hw.status !== 'Published') return false;
      }

      if (filters?.academicYearId && hw.academicYearId !== filters.academicYearId) return false;
      if (filters?.termId && hw.termId !== filters.termId) return false;
      if (filters?.grade && hw.grade !== filters.grade) return false;
      if (filters?.classroom && hw.classroom !== filters.classroom) return false;
      if (filters?.teacherId && hw.teacherId !== filters.teacherId) return false;
      if (filters?.subject && hw.subject !== filters.subject) return false;
      if (filters?.lessonInstanceId && hw.lessonInstanceId !== filters.lessonInstanceId) return false;
      if (filters?.status && hw.status !== filters.status) return false;
      if (filters?.isArchived !== undefined && Boolean(hw.isArchived) !== filters.isArchived) return false;

      return true;
    });
  }

  public static saveHomework(
    hw: Partial<Homework>,
    currentUser: User | null
  ): { success: boolean; data?: Homework; message?: string } {
    const list = this.getHomeworks();
    const now = getCairoNowISO();

    const prepared: Homework = {
      id: hw.id || `HW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      academicYearId: hw.academicYearId || 'AY-2026-2027',
      termId: hw.termId || 'TERM-1',
      lessonInstanceId: hw.lessonInstanceId || '',
      scheduleItemId: hw.scheduleItemId || '',
      subjectId: hw.subjectId || '',
      subject: hw.subject || 'المادة',
      teacherId: hw.teacherId || currentUser?.employeeId || currentUser?.id || 'TCH-001',
      teacherName: hw.teacherName || currentUser?.fullName || 'المعلم',
      gradeId: hw.gradeId || '',
      grade: hw.grade || '',
      classroomId: hw.classroomId || '',
      classroom: hw.classroom || '',
      targetStudentId: hw.targetStudentId || '',
      title: (hw.title || '').trim(),
      description: (hw.description || '').trim(),
      instructions: hw.instructions || '',
      assignedDate: hw.assignedDate || now.split('T')[0],
      dueDate: hw.dueDate || now.split('T')[0],
      dueTime: hw.dueTime || '23:59',
      link: hw.link || '',
      attachmentUrl: hw.attachmentUrl || '',
      status: hw.status || 'Published',
      createdBy: hw.createdBy || currentUser?.fullName || 'المعلم',
      createdAt: hw.createdAt || now,
      updatedBy: currentUser?.fullName,
      updatedAt: now,
      isArchived: hw.isArchived || false,
    };

    const idx = list.findIndex(h => h.id === prepared.id);
    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    return { success: true, data: prepared, message: 'تم حفظ الواجب المدرسي بنجاح' };
  }

  public static deleteHomework(id: string): { success: boolean } {
    const list = this.getHomeworks().filter(h => h.id !== id);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    return { success: true };
  }
}
