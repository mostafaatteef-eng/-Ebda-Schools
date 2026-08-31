import { AppNotification, NotificationPriority, NotificationType, PendingAction, UserRole } from '../types';
import { getCairoCurrentDate, getCairoNowISO } from '../utils/egyptianTime';

export class NotificationEngine {
  /**
   * Evaluates system state and derives dynamic unhandled Pending Actions for the given user role
   */
  public static generatePendingActions(
    role: UserRole,
    userId: string,
    context: {
      studentsCount: number;
      unrecordedAttendanceCount: number;
      absentOverLimitCount: number;
      pendingSubstitutionsCount: number;
      draftHomeworkCount: number;
      pendingBehaviorFollowupsCount: number;
      payrollDraftCount: number;
      syncFailedCount: number;
      missingLessonsCount: number;
      activeAcademicYearNeedsReview: boolean;
    }
  ): PendingAction[] {
    const actions: PendingAction[] = [];
    const today = getCairoCurrentDate();

    // 1. Admin Actions
    if (role === 'Admin') {
      if (context.syncFailedCount > 0) {
        actions.push({
          id: 'PA-ADM-SYNC-FAIL',
          type: 'SYNC_ERROR',
          title: `توجد (${context.syncFailedCount}) عمليات مزامنة سحابية تحتاج إعادة المحاولة`,
          description: 'فشلت بعض العمليات السحابية بسبب انقطاع الاتصال المؤقت، يرجى مراجعة سجل المزامنة.',
          priority: 'HIGH',
          dueDate: today,
          actionUrl: 'sync_modal',
          actionLabel: 'مزامنة الآن',
          count: context.syncFailedCount,
        });
      }

      if (context.payrollDraftCount > 0) {
        actions.push({
          id: 'PA-ADM-PAYROLL',
          type: 'PAYROLL_REVIEW',
          title: `مسير رواتب جاهز للمراجعة والاعتماد النهائي`,
          description: 'تم احتساب مستحقات الشهر والخصومات بناءً على لقطة الحضور، بانتظار اعتماد المدير.',
          priority: 'URGENT',
          dueDate: today,
          actionUrl: 'payroll',
          actionLabel: 'فتح مسير الرواتب',
          count: context.payrollDraftCount,
        });
      }

      if (context.pendingBehaviorFollowupsCount > 0) {
        actions.push({
          id: 'PA-ADM-BEH-CASES',
          type: 'BEHAVIOR_CASE',
          title: `توجد (${context.pendingBehaviorFollowupsCount}) حالات سلوكية تتطلب متابعة الإدارة`,
          description: 'متابعة قرارات مجلس الانضباط والتواصل مع أولياء الأمور.',
          priority: 'NORMAL',
          dueDate: today,
          actionUrl: 'behavior',
          actionLabel: 'فتح سجل السلوك',
          count: context.pendingBehaviorFollowupsCount,
        });
      }
    }

    // 2. Student Affairs Actions
    if (role === 'StudentAffairs' || role === 'Admin') {
      if (context.unrecordedAttendanceCount > 0) {
        actions.push({
          id: 'PA-STU-ATT-UNREC',
          type: 'STUDENT_ATTENDANCE',
          title: `يوجد (${context.unrecordedAttendanceCount}) طلاب لم يُسجل حضورهم اليوم`,
          description: 'يرجى إكمال رصد دفاتر الحضور واعتماد إحصائية اليوم الدراسي.',
          priority: 'HIGH',
          dueDate: today,
          actionUrl: 'student_attendance',
          actionLabel: 'رصد الحضور اليومي',
          count: context.unrecordedAttendanceCount,
        });
      }

      if (context.absentOverLimitCount > 0) {
        actions.push({
          id: 'PA-STU-ABS-ALERT',
          type: 'STUDENT_ABSENCE',
          title: `(${context.absentOverLimitCount}) طلاب تجاوزوا حد أيام الغياب المسموح به`,
          description: 'يتطلب إرسال إنذارات رسمية والتواصل مع أولياء الأمور حسب اللائحة.',
          priority: 'URGENT',
          dueDate: today,
          actionUrl: 'students',
          actionLabel: 'مراجعة شؤون الطلاب',
          count: context.absentOverLimitCount,
        });
      }
    }

    // 3. Teacher Affairs Actions
    if (role === 'TeacherAffairs' || role === 'Admin') {
      if (context.pendingSubstitutionsCount > 0) {
        actions.push({
          id: 'PA-TCH-SUB',
          type: 'SCHEDULE_SUBSTITUTION',
          title: `توجد (${context.pendingSubstitutionsCount}) حصص فارغة تحتاج لمعلمين احتياطي اليوم`,
          description: 'تم تسجيل غياب معلمين وتوجد حصص مجدولة بانتظار التوزيع الفوري.',
          priority: 'URGENT',
          dueDate: today,
          actionUrl: 'teacher_portal',
          actionLabel: 'جدول الاحتياطي',
          count: context.pendingSubstitutionsCount,
        });
      }
    }

    // 4. Teacher Actions
    if (role === 'Teacher') {
      if (context.missingLessonsCount > 0) {
        actions.push({
          id: 'PA-TCH-LESSON-MISSING',
          type: 'LESSON_CONTENT_MISSING',
          title: `لديك (${context.missingLessonsCount}) حصص تم تدريسها بدون تسجيل المحتوى والواجب`,
          description: 'قم بتدوين عنوان الدرس والواجب ونقاط الشرح ليطلع عليها الطلاب وأولياء الأمور.',
          priority: 'NORMAL',
          dueDate: today,
          actionUrl: 'teacher_portal',
          actionLabel: 'تسجيل الدرس والواجب',
          count: context.missingLessonsCount,
        });
      }

      if (context.draftHomeworkCount > 0) {
        actions.push({
          id: 'PA-TCH-HW-DRAFT',
          type: 'HOMEWORK_DRAFT',
          title: `لديك (${context.draftHomeworkCount}) واجبات محفوظة كمسودة بانتظار النشر`,
          description: 'لن يرى الطلاب وأولياء الأمور الواجب حتى يتم نشره رسمياً.',
          priority: 'NORMAL',
          dueDate: today,
          actionUrl: 'teacher_portal',
          actionLabel: 'نشر الواجبات',
          count: context.draftHomeworkCount,
        });
      }
    }

    // 5. Social Specialist Actions
    if (role === 'SocialSpecialist' || role === 'Admin') {
      if (context.pendingBehaviorFollowupsCount > 0) {
        actions.push({
          id: 'PA-SOC-FOLLOWUP',
          type: 'BEHAVIOR_FOLLOWUP',
          title: `(${context.pendingBehaviorFollowupsCount}) حالات سلوكية مستحقة للمتابعة والجلسات اليوم`,
          description: 'متابعة التعهدات، وتوثيق استدعاءات أولياء الأمور، وإجراءات تعديل السلوك.',
          priority: 'HIGH',
          dueDate: today,
          actionUrl: 'behavior',
          actionLabel: 'فتح سجل الإرشاد',
          count: context.pendingBehaviorFollowupsCount,
        });
      }
    }

    return actions;
  }
}
