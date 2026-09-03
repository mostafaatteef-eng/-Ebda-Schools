import { User } from '../types';
import { GlobalSearchResultItem, SearchCategory } from '../types_extended';
import { storageService } from './storageService';

export interface GroupedSearchResults {
  students: GlobalSearchResultItem[];
  employees: GlobalSearchResultItem[];
  classrooms: GlobalSearchResultItem[];
  behavior: GlobalSearchResultItem[];
  totalResults: number;
}

export class SearchService {
  /**
   * Arabic Text Normalization Utility
   */
  public static normalizeArabic(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      // Remove diacritics / Tashkeel
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove Tatweel
      .replace(/\u0640/g, '')
      // Normalize Alef forms
      .replace(/[أإآ]/g, 'ا')
      // Normalize Ta Marbuta
      .replace(/ة/g, 'ه')
      // Normalize Ya / Alef Maksura
      .replace(/ى/g, 'ي')
      // Collapse whitespace
      .replace(/\s+/g, ' ');
  }

  /**
   * Role-Scoped Global Search Engine
   */
  public static search(
    rawQuery: string,
    currentUser: User | null,
    maxPerGroup: number = 10
  ): GroupedSearchResults {
    const q = this.normalizeArabic(rawQuery);
    if (!q || q.length < 2) {
      return {
        students: [],
        employees: [],
        classrooms: [],
        behavior: [],
        totalResults: 0,
      };
    }

    const role = currentUser?.role || 'Viewer';
    const grouped: GroupedSearchResults = {
      students: [],
      employees: [],
      classrooms: [],
      behavior: [],
      totalResults: 0,
    };

    // 1. Search Students (Admin, StudentAffairs, SocialSpecialist, Teacher, Supervisor, Parent)
    const canViewStudents = ['Admin', 'StudentAffairs', 'SocialSpecialist', 'Supervisor', 'Teacher', 'Parent'].includes(role);
    if (canViewStudents) {
      const allStudents = storageService.getStudents();
      let accessibleStudents = allStudents;

      // Parent constraint: strictly own children
      if (role === 'Parent' && currentUser?.id) {
        // Find parent's nationalId or phone or children links
        accessibleStudents = allStudents.filter(s => 
          s.parentId === currentUser.id || s.parentPhone === currentUser.username
        );
      }

      for (const s of accessibleStudents) {
        if (grouped.students.length >= maxPerGroup) break;
        const normName = this.normalizeArabic(s.name);
        const normCode = this.normalizeArabic(s.studentCode || '');
        const normNationalId = this.normalizeArabic(s.nationalId || '');
        const normPhone = this.normalizeArabic(s.parentPhone || s.phone || '');

        if (
          normName.includes(q) ||
          normCode.includes(q) ||
          normNationalId.includes(q) ||
          normPhone.includes(q)
        ) {
          grouped.students.push({
            id: s.id,
            category: 'STUDENTS',
            categoryLabel: 'الطلاب والشعب',
            title: s.name,
            subtitle: `${s.grade} - ${s.classroom} | كود: ${s.studentCode}`,
            badge: s.status,
            actionTab: 'students',
            entityId: s.id,
            raw: s,
          });
        }
      }
    }

    // 2. Search Employees / Teachers (Admin, TeacherAffairs, HR, Supervisor)
    const canViewEmployees = ['Admin', 'TeacherAffairs', 'HR', 'Supervisor'].includes(role);
    if (canViewEmployees) {
      const allEmployees = storageService.getEmployees();
      for (const e of allEmployees) {
        if (grouped.employees.length >= maxPerGroup) break;
        const normName = this.normalizeArabic(e.name);
        const normId = this.normalizeArabic(e.id);
        const normJob = this.normalizeArabic(e.jobTitle || '');
        const normDept = this.normalizeArabic(e.department || '');
        const normNationalId = this.normalizeArabic(e.nationalId || '');

        if (
          normName.includes(q) ||
          normId.includes(q) ||
          normJob.includes(q) ||
          normDept.includes(q) ||
          normNationalId.includes(q)
        ) {
          grouped.employees.push({
            id: e.id,
            category: 'EMPLOYEES',
            categoryLabel: 'المعلمون والموظفون',
            title: e.name,
            subtitle: `${e.jobTitle} - ${e.department} | رقم: ${e.id}`,
            badge: e.status === 'Active' ? 'نشط' : 'معطل',
            actionTab: 'employees',
            entityId: e.id,
            raw: e,
          });
        }
      }
    }

    // 3. Search Classrooms / Grades (Admin, StudentAffairs, TeacherAffairs, Teacher, Supervisor)
    const canViewClasses = ['Admin', 'StudentAffairs', 'TeacherAffairs', 'Teacher', 'Supervisor'].includes(role);
    if (canViewClasses) {
      const settings = storageService.getSettings();
      const classrooms = settings.classrooms || [];
      for (const cls of classrooms) {
        if (grouped.classrooms.length >= maxPerGroup) break;
        const clsName = typeof cls === 'string' ? cls : (cls.displayName || cls.classroomNumber || cls.id);
        const clsId = typeof cls === 'string' ? cls : cls.id;
        const normCls = this.normalizeArabic(clsName);
        if (normCls.includes(q)) {
          grouped.classrooms.push({
            id: clsId,
            category: 'CLASSROOMS',
            categoryLabel: 'الفصول والقاعات',
            title: `فصل: ${clsName}`,
            subtitle: 'جدول الحصص وقيد الفصل وسجل الحضور',
            badge: 'فصل مدرسي',
            actionTab: 'schedule',
            entityId: clsId,
            raw: cls,
          });
        }
      }
    }

    // 4. Search Behavior Cases & Violations (Admin, SocialSpecialist, BehaviorOfficer, StudentAffairs)
    const canViewBehavior = ['Admin', 'SocialSpecialist', 'BehaviorOfficer', 'StudentAffairs'].includes(role);
    if (canViewBehavior) {
      const violations = storageService.getBehaviorViolations();
      for (const v of violations) {
        if (grouped.behavior.length >= maxPerGroup) break;
        const normStudent = this.normalizeArabic(v.studentName);
        const normViolation = this.normalizeArabic(v.violationName);
        const normAction = this.normalizeArabic(v.actionTaken || '');

        if (normStudent.includes(q) || normViolation.includes(q) || normAction.includes(q)) {
          grouped.behavior.push({
            id: v.id,
            category: 'BEHAVIOR',
            categoryLabel: 'الانضباط والحالات السلوكية',
            title: `${v.studentName} - ${v.violationName}`,
            subtitle: `التاريخ: ${v.date} | الصف: ${v.grade} | الإجراء: ${v.actionTaken || 'تنبيه'}`,
            badge: v.degree || v.severity || 'مخالفة',
            actionTab: 'behavior',
            entityId: v.id,
            raw: v,
          });
        }
      }
    }

    grouped.totalResults =
      grouped.students.length +
      grouped.employees.length +
      grouped.classrooms.length +
      grouped.behavior.length;

    return grouped;
  }

  /**
   * Execute flattened and filtered search
   */
  public static executeSearch(
    rawQuery: string,
    currentUser: User | null,
    options?: { category?: SearchCategory; limit?: number }
  ): GlobalSearchResultItem[] {
    const limit = options?.limit || 20;
    const category = options?.category || 'ALL';
    const grouped = this.search(rawQuery, currentUser, limit);

    let list: GlobalSearchResultItem[] = [];
    if (category === 'ALL') {
      list = [...grouped.students, ...grouped.employees, ...grouped.classrooms, ...grouped.behavior];
    } else if (category === 'STUDENTS') {
      list = grouped.students;
    } else if (category === 'EMPLOYEES') {
      list = grouped.employees;
    } else if (category === 'CLASSROOMS' || category === 'SCHEDULE') {
      list = grouped.classrooms;
    } else if (category === 'BEHAVIOR') {
      list = grouped.behavior;
    }

    return list.slice(0, limit);
  }
}
