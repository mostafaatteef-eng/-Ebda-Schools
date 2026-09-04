import { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'مدير النظام',
  StudentAffairs: 'مسئول شئون الطلاب والقيد',
  TeacherAffairs: 'مسئول شئون المعلمين والعاملين',
  Teacher: 'معلم',
  SocialSpecialist: 'أخصائي اجتماعي',
  Parent: 'ولي أمر',
  HR: 'مسئول شئون المعلمين والعاملين',
  Supervisor: 'مشرف تربوي',
  BehaviorOfficer: 'مسؤول الانضباط المدرسي',
  PayrollOfficer: 'محاسب الرواتب',
  Employee: 'موظف',
  Viewer: 'مستعرض (قراءة فقط)',
};

export const STATUS_LABELS: Record<string, string> = {
  Pending: 'قيد المراجعة',
  Approved: 'معتمد',
  Rejected: 'مرفوض',
  Published: 'منشور',
  Draft: 'مسودة',
  Scheduled: 'مجدول',
  Delivered: 'تم التنفيذ',
  Substituted: 'مغطاة ببديل',
  Cancelled: 'ملغى',
  Closed: 'مغلق',
  Archived: 'مؤرشف',
  Active: 'نشط',
  Inactive: 'معطل',
  Transferred: 'منقول',
  Enrolled: 'مقيد',
  'معلقة': 'قيد المراجعة',
  'مقبولة': 'معتمدة',
  'مرفوضة': 'مرفوضة',
  'حاضر': 'حاضر',
  'غائب': 'غائب',
  'متأخر': 'متأخر',
  'مأذونية': 'إذن رسمي',
  'إجازة': 'إجازة رسمية',
};

export const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'لوحة التحكم والمتابعة العامة',
    subtitle: 'مؤشرات الأداء التشغيلي للمدرسة ونسب الحضور والانضباط',
  },
  students: {
    title: 'سجلات وبيانات الطلاب والقيد',
    subtitle: 'إدارة ملفات الطلاب وقيد الفصول والترحيل الأكاديمي',
  },
  student_attendance: {
    title: 'رصد حضور وغياب الطلاب',
    subtitle: 'الرصد اليومي والحصصي لدفاتر الغياب والتأخيرات',
  },
  behavior: {
    title: 'لائحة الانضباط المدرسي والخدمة الاجتماعية',
    subtitle: 'متابعة المخالفات السلوكية والحالات الاجتماعية والسلوك الإيجابي',
  },
  teacher_portal: {
    title: 'بوابة المعلم واليوم الدراسي',
    subtitle: 'حصص اليوم والجدول الأسبوعي وتحضير الدروس والواجبات',
  },
  parent_day_view: {
    title: 'بوابة ولي الأمر — اليوم الدراسي لابنك',
    subtitle: 'متابعة حية للحضور والحصص المشروحة والواجبات والسلوك اليومي',
  },
  parent_portal: {
    title: 'بوابة ولي الأمر الشاملة',
    subtitle: 'السجل التراكمي للحضور والواجبات والملاحظات والجدول الأسبوعي',
  },
  employees: {
    title: 'سجلات المعلمين وهيئة التدريس والعاملين',
    subtitle: 'قاعدة بيانات الكادر التعليمي والإداري وتوزيع الأقسام',
  },
  daily_attendance: {
    title: 'دفتر دوام وحضور العاملين اليومي',
    subtitle: 'سجل بصمة الحضور والانصراف والتأخيرات الصباحية',
  },
  monthly_matrix: {
    title: 'المصفوفة الشهرية لدوام العاملين',
    subtitle: 'الكشف الشهري لحضور وغياب المعلمين والموظفين وإغلاق الفترات',
  },
  leaves: {
    title: 'إدارة الإجازات والأذونات الرسمية',
    subtitle: 'طلبات الإجازات الاعتيادية والمرضية والعارضة والأذونات واعتمادها',
  },
  payroll: {
    title: 'محرك ومسير الرواتب والاستحقاقات',
    subtitle: 'حساب مفردات المرتبات والخصومات والبدلات (خاص بالإدارة)',
  },
  reports: {
    title: 'مركز التقارير والإحصائيات المدرسية',
    subtitle: 'استخراج الكشوف الرسمية لوزارة التربية والتعليم والتقارير الدورية',
  },
  users: {
    title: 'إدارة المستخدمين والصلاحيات',
    subtitle: 'التحكم في حسابات المعلمين وأولياء الأمور والصلاحيات الأمنية',
  },
  audit: {
    title: 'سجل العمليات والرقابة الأمنية',
    subtitle: 'تتبع كافة التعديلات وعمليات الدخول والحذف بالنظام',
  },
  settings: {
    title: 'إعدادات النظام والمدرسة',
    subtitle: 'تهيئة العام الدراسي والمراحل والفصول ومواعيد الحصص',
  },
};

export function getEgyptianRoleLabel(role?: string | null): string {
  if (!role) return 'مستخدم';
  return ROLE_LABELS[role as UserRole] || role;
}

export function getEgyptianStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return STATUS_LABELS[status] || status;
}
