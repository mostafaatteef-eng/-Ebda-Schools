import {
  AttendanceRecord,
  Employee,
  LeaveRecord,
  PayrollRecord,
  Student,
  StudentAttendanceRecord,
  SystemSettings,
  User,
} from '../types';
import {
  PayrollAttendanceSnapshot,
  ReportColumn,
  ReportDefinition,
  ReportFilterDef,
  ReportModule,
  ReportQueryResult,
  SavedReportFilter,
} from '../types_extended';
import { storageService } from './storageService';
import { STORAGE_KEYS } from './masterDataDefaults';
import { formatEgyptianCurrency, formatEgyptianDate, getCairoCurrentDate, getCairoNowISO } from '../utils/egyptianTime';
import * as XLSX from 'xlsx';

export class ReportService {
  /**
   * Complete Registry of System Reports
   */
  public static readonly REPORT_DEFINITIONS: ReportDefinition[] = [
    /* =========================================================================
     * 1. تقارير شؤون الطلاب (Student Reports)
     * ========================================================================= */
    {
      id: 'REP-STU-01',
      key: 'student_directory',
      name: 'دليل الطلاب وقيد الفصول',
      module: 'STUDENTS',
      description: 'سجل شامل لبيانات الطلاب حسب العام الدراسي والصف والفصل وحالة القيد',
      requiredPermission: 'students.view',
      availableFilters: [
        { key: 'academicYear', label: 'العام الدراسي', type: 'select', defaultValue: '2025/2026' },
        { key: 'grade', label: 'الصف الدراسي', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل / الشعبة', type: 'select', defaultValue: 'ALL' },
        { key: 'status', label: 'حالة الطالب', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'نشط', label: 'نشط ومقيد' }, { value: 'منقول', label: 'منقول' }, { value: 'مفصول', label: 'مفصول' }] },
        { key: 'search', label: 'بحث بالاسم / الكود', type: 'text', placeholder: 'اسم الطالب أو كود الطالب...' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center', width: '50px' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'name', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'gender', label: 'النوع', isDefaultVisible: true, align: 'center' },
        { key: 'parentName', label: 'ولي الأمر', isDefaultVisible: true },
        { key: 'parentPhone', label: 'هاتف التواصل', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'الحالة', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'CSV', 'PRINT'],
      defaultSort: { column: 'name', direction: 'asc' },
      isActive: true,
    },
    {
      id: 'REP-STU-02',
      key: 'student_daily_attendance',
      name: 'سجل الحضور والغياب اليومي للطلاب',
      module: 'STUDENTS',
      description: 'بيان حضور وغياب وتأخر الطلاب على مستوى المدرسة في تاريخ محدد',
      requiredPermission: 'studentAttendance.view',
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date', defaultValue: getCairoCurrentDate() },
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
        { key: 'status', label: 'حالة الحضور', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'حاضر', label: 'حاضر' }, { value: 'غائب', label: 'غائب' }, { value: 'متأخر', label: 'متأخر' }, { value: 'إذن', label: 'إذن معتمد' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center', width: '50px' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'date', label: 'التاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'حالة الحضور', isDefaultVisible: true, align: 'center' },
        { key: 'lateMinutes', label: 'دقائق التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'excused', label: 'عذر معتمد', isDefaultVisible: true, align: 'center' },
        { key: 'notes', label: 'ملاحظات', isDefaultVisible: true },
      ],
      exportFormats: ['EXCEL', 'PDF', 'CSV', 'PRINT'],
      defaultSort: { column: 'studentName', direction: 'asc' },
      isActive: true,
    },
    {
      id: 'REP-STU-03',
      key: 'student_monthly_attendance',
      name: 'المصفوفة الشهرية لحضور الطلاب',
      module: 'STUDENTS',
      description: 'إحصائية تراكمية شهرية لنسب حضور وغياب كل طالب',
      requiredPermission: 'studentAttendance.view',
      availableFilters: [
        { key: 'month', label: 'الشهر', type: 'month', defaultValue: String(new Date().getMonth() + 1) },
        { key: 'year', label: 'السنة', type: 'year', defaultValue: String(new Date().getFullYear()) },
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center', width: '50px' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'presentDays', label: 'أيام الحضور', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'absentDays', label: 'أيام الغياب', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'lateDays', label: 'أيام التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'attendanceRate', label: 'نسبة الالتزام', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-STU-04',
      key: 'student_absence_report',
      name: 'تقرير غياب الطلاب والإنذارات',
      module: 'STUDENTS',
      description: 'رصد الطلاب الأكثر غياباً وحالات الغياب بدون عذر لإصدار إنذارات شؤون الطلاب',
      requiredPermission: 'studentAttendance.view',
      availableFilters: [
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
        { key: 'minDays', label: 'الحد الأدنى لأيام الغياب', type: 'number', defaultValue: 3 },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center', width: '50px' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'absentDaysCount', label: 'إجمالي الغياب', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'unexcusedDays', label: 'بدون عذر', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'excusedDays', label: 'بعذر رسمي', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'parentPhone', label: 'هاتف ولي الأمر', isDefaultVisible: true, align: 'center' },
        { key: 'warningStatus', label: 'حالة الإنذار', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      defaultSort: { column: 'absentDaysCount', direction: 'desc' },
      isActive: true,
    },
    {
      id: 'REP-STU-05',
      key: 'student_late_report',
      name: 'تقرير التأخير الصباحي للطلاب',
      module: 'STUDENTS',
      description: 'حصر الطلاب المتأخرين صباحاً وإجمالي دقائق التأخير والتكرار',
      requiredPermission: 'studentAttendance.view',
      availableFilters: [
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'lateCount', label: 'مرات التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'totalLateMinutes', label: 'إجمالي دقائق التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'recentLateDate', label: 'آخر تأخير', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      defaultSort: { column: 'lateCount', direction: 'desc' },
      isActive: true,
    },
    {
      id: 'REP-STU-06',
      key: 'class_attendance_report',
      name: 'حضور الحصص الأكاديمية (Class Attendance)',
      module: 'STUDENTS',
      description: 'حضور الحصص المسجل بواسطة معلمي المواد خلال اليوم الدراسي',
      requiredPermission: 'classAttendance.view',
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date', defaultValue: getCairoCurrentDate() },
        { key: 'subject', label: 'المادة', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'date', label: 'التاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'periodNumber', label: 'الحصة', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'subject', label: 'المادة', isDefaultVisible: true },
        { key: 'teacherName', label: 'المعلم الراصد', isDefaultVisible: true },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'status', label: 'حالة الحضور', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-STU-07',
      key: 'student_attendance_exceptions',
      name: 'تقرير فروق وتناقضات الحضور (Attendance Exceptions)',
      module: 'STUDENTS',
      description: 'كشف التناقضات بين طابور الصباح وحصص الفصول (حاضر مدرسة / غائب حصة والعكس)',
      requiredPermission: 'studentAttendance.view',
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date', defaultValue: getCairoCurrentDate() },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'studentCode', label: 'كود الطالب', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'schoolStatus', label: 'دوام المدرسة العام', isDefaultVisible: true, align: 'center' },
        { key: 'classStatus', label: 'حالة الحصة المسجلة', isDefaultVisible: true, align: 'center' },
        { key: 'discrepancyType', label: 'نوع التناقض', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },

    /* =========================================================================
     * 2. التقارير الأكاديمية والجدول والواجبات (Academic Reports)
     * ========================================================================= */
    {
      id: 'REP-ACAD-01',
      key: 'schedule_by_classroom',
      name: 'الجدول الدراسي حسب الفصول',
      module: 'ACADEMIC',
      description: 'توزيع الحصص والمواد الأسبوعية لكل فصل دراسي',
      requiredPermission: 'schedule.view',
      availableFilters: [
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
        { key: 'dayOfWeek', label: 'اليوم', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'dayOfWeek', label: 'اليوم', isDefaultVisible: true, align: 'center' },
        { key: 'periodNumber', label: 'الحصة', isDefaultVisible: true, align: 'center' },
        { key: 'subject', label: 'المادة الدراسية', isDefaultVisible: true },
        { key: 'teacherName', label: 'المعلم المسند', isDefaultVisible: true },
        { key: 'room', label: 'القاعة / المعمل', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-ACAD-02',
      key: 'schedule_by_teacher',
      name: 'نصاب وجدول المعلمين الأسبوعي',
      module: 'ACADEMIC',
      description: 'حصر حصص وجدول كل معلم وتوزيع الأيام والقاعات',
      requiredPermission: 'schedule.view',
      availableFilters: [
        { key: 'teacherName', label: 'المعلم', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'teacherName', label: 'اسم المعلم', isDefaultVisible: true },
        { key: 'dayOfWeek', label: 'اليوم', isDefaultVisible: true, align: 'center' },
        { key: 'periodNumber', label: 'الحصة', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'subject', label: 'المادة', isDefaultVisible: true },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-ACAD-03',
      key: 'lessons_execution_report',
      name: 'تنفيذ الحصص وحصص الاحتياط',
      module: 'ACADEMIC',
      description: 'متابعة الحصص المنفذة، التي لم ترصد، الملغاة، وحصص الاحتياط والبدائل',
      requiredPermission: 'schedule.view',
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date', defaultValue: getCairoCurrentDate() },
        { key: 'executionStatus', label: 'حالة الحصة', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'منفذة', label: 'منفذة ومرصودة' }, { value: 'لم_ترصد', label: 'لم تسجل بعد' }, { value: 'ملغاة', label: 'ملغاة' }, { value: 'احتياط', label: 'حصة احتياط وبديل' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'date', label: 'التاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'periodNumber', label: 'الحصة', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'subject', label: 'المادة', isDefaultVisible: true },
        { key: 'teacherName', label: 'المعلم الأساسي', isDefaultVisible: true },
        { key: 'substituteTeacher', label: 'معلم الاحتياط', isDefaultVisible: true },
        { key: 'executionStatus', label: 'الحالة التنفيذية', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-ACAD-04',
      key: 'homework_monitoring_report',
      name: 'متابعة الواجبات المدرسية المنشورة',
      module: 'ACADEMIC',
      description: 'رصد الواجبات المدرسية المرفوعة للطلاب حسب المادة والفصل وتاريخ التسليم',
      requiredPermission: 'schedule.view',
      availableFilters: [
        { key: 'subject', label: 'المادة', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'title', label: 'عنوان الواجب', isDefaultVisible: true },
        { key: 'subject', label: 'المادة', isDefaultVisible: true },
        { key: 'classroom', label: 'الفصل المستهدف', isDefaultVisible: true, align: 'center' },
        { key: 'teacherName', label: 'المعلم الناشر', isDefaultVisible: true },
        { key: 'assignedDate', label: 'تاريخ النشر', isDefaultVisible: true, align: 'center' },
        { key: 'dueDate', label: 'موعد التسليم', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'الحالة', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },

    /* =========================================================================
     * 3. تقارير الانضباط والسلوك والتربية الاجتماعية (Behavior Reports)
     * ========================================================================= */
    {
      id: 'REP-BEH-01',
      key: 'violations_analysis',
      name: 'تحليل مخالفات لائحة الانضباط المدرسي',
      module: 'BEHAVIOR',
      description: 'حصر المخالفات السلوكية حسب الطالب والصف والفصل ونوع المخالفة ومكانها',
      requiredPermission: 'behavior.view',
      availableFilters: [
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
        { key: 'classroom', label: 'الفصل', type: 'select', defaultValue: 'ALL' },
        { key: 'severityLevel', label: 'مستوى المخالفة', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'الدرجة الأولى', label: 'الدرجة الأولى (بسيطة)' }, { value: 'الدرجة الثانية', label: 'الدرجة الثانية (متوسطة)' }, { value: 'الدرجة الثالثة', label: 'الدرجة الثالثة (جسيمة)' }, { value: 'الدرجة الرابعة', label: 'الدرجة الرابعة (شديدة الخطورة)' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'date', label: 'التاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'violationName', label: 'المخالفة', isDefaultVisible: true },
        { key: 'pointsDeducted', label: 'الخصم', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'actionTaken', label: 'الإجراء المتخذ', isDefaultVisible: true },
        { key: 'recordedBy', label: 'سجلت بواسطة', isDefaultVisible: true },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-BEH-02',
      key: 'behavior_cases_overview',
      name: 'سجل الحالات والمتابعات الاجتماعية',
      module: 'BEHAVIOR',
      description: 'متابعة الحالات السلوكية المفتوحة لدى الأخصائي الاجتماعي والتواصل مع أولياء الأمور',
      requiredPermission: 'behavior.view',
      availableFilters: [
        { key: 'status', label: 'حالة الملف', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'مفتوحة', label: 'مفتوحة وقيد المتابعة' }, { value: 'مغلقة', label: 'مغلقة' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'caseCode', label: 'كود الحالة', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'summary', label: 'ملخص الحالة والتشخيص', isDefaultVisible: true },
        { key: 'specialistName', label: 'الأخصائي المسؤول', isDefaultVisible: true },
        { key: 'parentContacted', label: 'تم التواصل مع الوالد', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'الحالة', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-BEH-03',
      key: 'positive_behavior_report',
      name: 'سجل السلوك الإيجابي ونقاط التميز',
      module: 'BEHAVIOR',
      description: 'حصر الطلاب المتميزين سلوكياً وأخلاقياً ونقاط التعزيز المكتسبة',
      requiredPermission: 'behavior.view',
      availableFilters: [
        { key: 'grade', label: 'الصف', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'studentName', label: 'اسم الطالب', isDefaultVisible: true },
        { key: 'grade', label: 'الصف', isDefaultVisible: true, align: 'center' },
        { key: 'classroom', label: 'الفصل', isDefaultVisible: true, align: 'center' },
        { key: 'positiveAction', label: 'السلوك المتميز / المبادرة', isDefaultVisible: true },
        { key: 'pointsAwarded', label: 'نقاط التميز', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'date', label: 'التاريخ', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },

    /* =========================================================================
     * 4. تقارير شؤون المعلمين والموظفين (HR Reports - NO SALARY DATA)
     * ========================================================================= */
    {
      id: 'REP-HR-01',
      key: 'employee_directory',
      name: 'دليل المعلمين والموظفين والهيكل الوظيفي',
      module: 'HR',
      description: 'سجل شامل للعاملين بالمدرسة، الأقسام، المسميات الوظيفية، وأرقام التواصل (بدون رواتب)',
      requiredPermission: 'teachers.view',
      availableFilters: [
        { key: 'department', label: 'القسم / الإدارة', type: 'select', defaultValue: 'ALL' },
        { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'Active', options: [{ value: 'ALL', label: 'الكل' }, { value: 'Active', label: 'على رأس العمل (نشط)' }, { value: 'Inactive', label: 'منقطع / غير نشط' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'id', label: 'الرقم الوظيفي', isDefaultVisible: true, align: 'center' },
        { key: 'name', label: 'اسم المعلم / الموظف', isDefaultVisible: true },
        { key: 'jobTitle', label: 'المسمى الوظيفي', isDefaultVisible: true },
        { key: 'department', label: 'القسم', isDefaultVisible: true },
        { key: 'phone', label: 'رقم الهاتف', isDefaultVisible: true, align: 'center' },
        { key: 'hireDate', label: 'تاريخ التعيين', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'حالة العمل', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-HR-02',
      key: 'employee_daily_attendance',
      name: 'سجل الدوام اليومي للعاملين والمدرسين',
      module: 'HR',
      description: 'حركات الحضور والانصراف، مواعيد البصمة، والتأخيرات اليومية لموظفي المدرسة',
      requiredPermission: 'teacherAttendance.view',
      availableFilters: [
        { key: 'date', label: 'التاريخ', type: 'date', defaultValue: getCairoCurrentDate() },
        { key: 'department', label: 'القسم', type: 'select', defaultValue: 'ALL' },
        { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'الكل' }, { value: 'حاضر', label: 'حاضر في الموعد' }, { value: 'متأخر', label: 'متأخر' }, { value: 'غائب', label: 'غائب' }, { value: 'إجازة', label: 'في إجازة رسمية' }] },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'employeeId', label: 'كود الموظف', isDefaultVisible: true, align: 'center' },
        { key: 'employeeName', label: 'الاسم', isDefaultVisible: true },
        { key: 'department', label: 'القسم', isDefaultVisible: true },
        { key: 'checkIn', label: 'وقت الحضور', isDefaultVisible: true, align: 'center' },
        { key: 'checkOut', label: 'وقت الانصراف', isDefaultVisible: true, align: 'center' },
        { key: 'status', label: 'حالة الدوام', isDefaultVisible: true, align: 'center' },
        { key: 'lateMinutes', label: 'دقائق التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'earlyLeaveMinutes', label: 'خروج مبكر (دقيقة)', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'overtimeHours', label: 'ساعات إضافية', isDefaultVisible: true, align: 'center', isNumeric: true },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-HR-03',
      key: 'employee_monthly_attendance',
      name: 'المصفوفة الشهرية لدوام الموظفين',
      module: 'HR',
      description: 'إجمالي أيام العمل الفعلي، الغياب، الإجازات، وساعات العمل الشهرية لكل موظف',
      requiredPermission: 'teacherAttendance.view',
      availableFilters: [
        { key: 'month', label: 'الشهر', type: 'month', defaultValue: String(new Date().getMonth() + 1) },
        { key: 'year', label: 'السنة', type: 'year', defaultValue: String(new Date().getFullYear()) },
        { key: 'department', label: 'القسم', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'employeeId', label: 'الرقم الوظيفي', isDefaultVisible: true, align: 'center' },
        { key: 'employeeName', label: 'اسم الموظف', isDefaultVisible: true },
        { key: 'department', label: 'القسم', isDefaultVisible: true },
        { key: 'presentDays', label: 'أيام الحضور', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'lateDays', label: 'مرات التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'totalLateMinutes', label: 'إجمالي دقائق التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'absentDays', label: 'أيام الغياب', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'leaveDays', label: 'أيام الإجازات', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'overtimeHours', label: 'ساعات إضافي', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'attendanceRate', label: 'نسبة الالتزام', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-HR-04',
      key: 'employee_leaves_permissions_report',
      name: 'سجل الإجازات وتصاريح العمل الرسمية',
      module: 'HR',
      description: 'حصر الإجازات الاعتيادية والمرضية وأذونات العمل المعتمدة لكل موظف',
      requiredPermission: 'leaves.view',
      availableFilters: [
        { key: 'leaveType', label: 'نوع الإجازة', type: 'select', defaultValue: 'ALL' },
        { key: 'status', label: 'حالة الطلب', type: 'select', defaultValue: 'ALL' },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'employeeName', label: 'اسم الموظف', isDefaultVisible: true },
        { key: 'department', label: 'القسم', isDefaultVisible: true },
        { key: 'leaveType', label: 'النوع', isDefaultVisible: true, align: 'center' },
        { key: 'startDate', label: 'من تاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'endDate', label: 'إلى تاريخ', isDefaultVisible: true, align: 'center' },
        { key: 'daysCount', label: 'الأيام', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'status', label: 'الحالة', isDefaultVisible: true, align: 'center' },
        { key: 'approvedBy', label: 'المعتمد', isDefaultVisible: true },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },

    /* =========================================================================
     * 5. تقارير الرواتب والمحرك المالي (Payroll Reports - STRICT ADMIN ONLY)
     * ========================================================================= */
    {
      id: 'REP-PAY-01',
      key: 'payroll_summary',
      name: 'الملخص المالي الشامل لمسير الرواتب',
      module: 'PAYROLL',
      description: 'كشف مالي إجمالي للرواتب الأساسية، الاستحقاقات، الاستقطاعات، وصافي المنصرف شهرياً',
      adminOnly: true,
      availableFilters: [
        { key: 'month', label: 'الشهر', type: 'month', defaultValue: String(new Date().getMonth() + 1) },
        { key: 'year', label: 'السنة', type: 'year', defaultValue: String(new Date().getFullYear()) },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'employeeId', label: 'الرقم الوظيفي', isDefaultVisible: true, align: 'center' },
        { key: 'employeeName', label: 'اسم الموظف', isDefaultVisible: true },
        { key: 'department', label: 'القسم', isDefaultVisible: true },
        { key: 'basicSalary', label: 'الأساسي (ج.م)', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'totalAllowances', label: 'البدلات والمكافآت', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'overtimeAmount', label: 'الأجر الإضافي', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'grossSalary', label: 'إجمالي الاستحقاق', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'absenceDeduction', label: 'خصم الغياب', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'lateDeduction', label: 'خصم التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'totalDeductions', label: 'إجمالي الاستقطاع', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'netSalary', label: 'صافي الراتب (ج.م)', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'status', label: 'حالة الصرف', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
    {
      id: 'REP-PAY-02',
      key: 'payroll_snapshot_audit',
      name: 'سجل لقطات الحضور المثبتة للمسير (Snapshots)',
      module: 'PAYROLL',
      description: 'مراجعة الأرقام المعتمدة المؤثرة على الرواتب والمغلقة تأمينياً ضد التعديل',
      adminOnly: true,
      availableFilters: [
        { key: 'month', label: 'الشهر', type: 'month', defaultValue: String(new Date().getMonth() + 1) },
        { key: 'year', label: 'السنة', type: 'year', defaultValue: String(new Date().getFullYear()) },
      ],
      availableColumns: [
        { key: 'index', label: 'م', isDefaultVisible: true, align: 'center' },
        { key: 'employeeId', label: 'الرقم الوظيفي', isDefaultVisible: true, align: 'center' },
        { key: 'employeeName', label: 'اسم الموظف', isDefaultVisible: true },
        { key: 'workingDays', label: 'أيام العمل', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'presentDays', label: 'الحضور الفعلي', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'absentDays', label: 'أيام الغياب', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'lateMinutes', label: 'دقائق التأخير', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'overtimeHours', label: 'ساعات الإضافي', isDefaultVisible: true, align: 'center', isNumeric: true },
        { key: 'isLocked', label: 'حالة القفل', isDefaultVisible: true, align: 'center' },
      ],
      exportFormats: ['EXCEL', 'PDF', 'PRINT'],
      isActive: true,
    },
  ];

  /**
   * Security Guard: Ensure payroll reports are accessed exclusively by Admins
   */
  public static requirePayrollAdmin(currentUser: User | null): boolean {
    if (!currentUser || currentUser.role !== 'Admin') {
      return false;
    }
    return true;
  }

  /**
   * Execute Report with Service-Side Filtering, Sorting, Column Projection, and Pagination
   */
  public static executeReport(
    reportKey: string,
    filters: Record<string, any>,
    page: number = 1,
    pageSize: number = 25,
    sort?: { column: string; direction: 'asc' | 'desc' },
    activeColumns?: string[],
    currentUser: User | null = null
  ): ReportQueryResult {
    const reportDef = this.REPORT_DEFINITIONS.find(r => r.key === reportKey);
    if (!reportDef) {
      throw new Error(`Report definition with key "${reportKey}" not found.`);
    }

    // Role Security Enforcement
    if (reportDef.adminOnly && !this.requirePayrollAdmin(currentUser)) {
      throw new Error('403 Forbidden: هذا التقرير مالي سري ومقتصر فقط على الإدارة العليا.');
    }

    // Fetch and filter raw records
    const rawRows = this.fetchReportData(reportDef, filters, currentUser);

    // Apply Sorting
    const sortCol = sort?.column || reportDef.defaultSort?.column;
    const sortDir = sort?.direction || reportDef.defaultSort?.direction || 'asc';
    let sortedRows = [...rawRows];

    if (sortCol) {
      sortedRows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB), 'ar')
          : String(valB).localeCompare(String(valA), 'ar');
      });
    }

    // Assign sequential index
    sortedRows = sortedRows.map((r, idx) => ({
      ...r,
      index: idx + 1,
    }));

    // Pagination
    const totalRows = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const paginatedRows = sortedRows.slice(startIdx, startIdx + pageSize);

    // Determine displayed columns
    let columns = reportDef.availableColumns;
    if (activeColumns && activeColumns.length > 0) {
      columns = columns.filter(c => activeColumns.includes(c.key));
    }

    return {
      columns,
      rows: paginatedRows,
      totalRows,
      page: safePage,
      pageSize,
      totalPages,
      appliedFilters: filters,
    };
  }

  /**
   * Internal Data Fetcher per Report Definition
   */
  private static fetchReportData(
    def: ReportDefinition,
    filters: Record<string, any>,
    currentUser: User | null
  ): Record<string, any>[] {
    switch (def.key) {
      case 'student_directory': {
        const students = storageService.getStudents();
        return students
          .filter(s => {
            const matchGrade = !filters.grade || filters.grade === 'ALL' || s.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || s.classroom === filters.classroom;
            const matchStatus = !filters.status || filters.status === 'ALL' || s.status === filters.status;
            const matchSearch = !filters.search || s.name.includes(filters.search) || s.studentCode.includes(filters.search);
            return matchGrade && matchClass && matchStatus && matchSearch;
          })
          .map(s => ({
            studentCode: s.studentCode,
            name: s.name,
            grade: s.grade,
            classroom: s.classroom,
            gender: s.gender || 'غير محدد',
            parentName: s.parentName || 'ولي الأمر',
            parentPhone: s.parentPhone || s.phone || '-',
            status: s.status,
          }));
      }

      case 'student_daily_attendance': {
        const attendance = storageService.getStudentAttendance();
        const date = filters.date || getCairoCurrentDate();
        return attendance
          .filter(a => {
            const matchDate = a.date === date;
            const matchGrade = !filters.grade || filters.grade === 'ALL' || a.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || a.classroom === filters.classroom;
            const matchStatus = !filters.status || filters.status === 'ALL' || a.status === filters.status;
            return matchDate && matchGrade && matchClass && matchStatus;
          })
          .map(a => ({
            studentCode: a.studentCode,
            studentName: a.studentName,
            grade: a.grade,
            classroom: a.classroom,
            date: a.date,
            status: a.status,
            lateMinutes: a.lateMinutes || 0,
            excused: a.excused ? 'نعم' : 'لا',
            notes: a.notes || '-',
          }));
      }

      case 'student_monthly_attendance': {
        const students = storageService.getStudents();
        const attendance = storageService.getStudentAttendance();
        const monthStr = String(filters.month || new Date().getMonth() + 1).padStart(2, '0');
        const yearStr = String(filters.year || new Date().getFullYear());
        const prefix = `${yearStr}-${monthStr}`;

        return students
          .filter(s => {
            const matchGrade = !filters.grade || filters.grade === 'ALL' || s.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || s.classroom === filters.classroom;
            return matchGrade && matchClass;
          })
          .map(s => {
            const records = attendance.filter(a => a.studentId === s.id && a.date.startsWith(prefix));
            const presentDays = records.filter(r => r.status === 'حاضر').length;
            const absentDays = records.filter(r => r.status === 'غائب').length;
            const lateDays = records.filter(r => r.status === 'متأخر').length;
            const total = records.length;
            const rate = total > 0 ? Math.round((presentDays / total) * 100) : 100;

            return {
              studentCode: s.studentCode,
              studentName: s.name,
              grade: s.grade,
              classroom: s.classroom,
              presentDays,
              absentDays,
              lateDays,
              attendanceRate: `${rate}%`,
            };
          });
      }

      case 'student_absence_report': {
        const students = storageService.getStudents();
        const attendance = storageService.getStudentAttendance();
        const minDays = Number(filters.minDays || 1);

        return students
          .filter(s => {
            const matchGrade = !filters.grade || filters.grade === 'ALL' || s.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || s.classroom === filters.classroom;
            return matchGrade && matchClass;
          })
          .map(s => {
            const records = attendance.filter(a => a.studentId === s.id && a.status === 'غائب');
            const unexcusedDays = records.filter(r => !r.excused).length;
            const excusedDays = records.filter(r => r.excused).length;
            const absentDaysCount = records.length;

            let warningStatus = 'طبيعي';
            if (absentDaysCount >= 10) warningStatus = 'إنذار ثالث وفصل مؤقت';
            else if (absentDaysCount >= 6) warningStatus = 'إنذار ثانٍ';
            else if (absentDaysCount >= 3) warningStatus = 'إنذار أول';

            return {
              studentCode: s.studentCode,
              studentName: s.name,
              grade: s.grade,
              classroom: s.classroom,
              absentDaysCount,
              unexcusedDays,
              excusedDays,
              parentPhone: s.parentPhone || s.phone || '-',
              warningStatus,
            };
          })
          .filter(r => r.absentDaysCount >= minDays);
      }

      case 'student_late_report': {
        const students = storageService.getStudents();
        const attendance = storageService.getStudentAttendance();

        return students
          .filter(s => {
            const matchGrade = !filters.grade || filters.grade === 'ALL' || s.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || s.classroom === filters.classroom;
            return matchGrade && matchClass;
          })
          .map(s => {
            const lates = attendance.filter(a => a.studentId === s.id && a.status === 'متأخر');
            const totalLateMinutes = lates.reduce((sum, l) => sum + (l.lateMinutes || 0), 0);
            const sortedDates = lates.map(l => l.date).sort().reverse();

            return {
              studentCode: s.studentCode,
              studentName: s.name,
              grade: s.grade,
              classroom: s.classroom,
              lateCount: lates.length,
              totalLateMinutes,
              recentLateDate: sortedDates[0] || '-',
            };
          })
          .filter(r => r.lateCount > 0);
      }

      case 'class_attendance_report': {
        const classAttendance = storageService.getClassAttendance();
        const date = filters.date || getCairoCurrentDate();
        return classAttendance
          .filter(c => {
            const matchDate = c.date === date;
            const matchSubject = !filters.subject || filters.subject === 'ALL' || c.subject === filters.subject;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || c.classroom === filters.classroom;
            return matchDate && matchSubject && matchClass;
          })
          .map(c => ({
            date: c.date,
            periodNumber: c.periodNumber,
            classroom: c.classroom,
            subject: c.subject,
            teacherName: c.teacherName,
            studentName: c.studentName,
            status: c.status,
          }));
      }

      case 'student_attendance_exceptions': {
        const date = filters.date || getCairoCurrentDate();
        const schoolAtt = storageService.getStudentAttendance().filter(a => a.date === date);
        const classAtt = storageService.getClassAttendance().filter(a => a.date === date);

        const exceptions: Record<string, any>[] = [];
        schoolAtt.forEach(sAtt => {
          const cRecords = classAtt.filter(c => c.studentId === sAtt.studentId);
          if (cRecords.length > 0) {
            const hasClassAbsent = cRecords.some(c => c.status === 'غائب');
            if (sAtt.status === 'حاضر' && hasClassAbsent) {
              exceptions.push({
                studentCode: sAtt.studentCode,
                studentName: sAtt.studentName,
                grade: sAtt.grade,
                classroom: sAtt.classroom,
                schoolStatus: 'حاضر طابور / مدرسة',
                classStatus: 'غائب داخل الحصة',
                discrepancyType: 'تسرب من الحصة الأكاديمية',
              });
            } else if (sAtt.status === 'غائب' && cRecords.some(c => c.status === 'حاضر')) {
              exceptions.push({
                studentCode: sAtt.studentCode,
                studentName: sAtt.studentName,
                grade: sAtt.grade,
                classroom: sAtt.classroom,
                schoolStatus: 'غائب بالمدرسة',
                classStatus: 'حاضر بالحصة',
                discrepancyType: 'حضور متأخر بدون تسجيل مدرسة',
              });
            }
          }
        });
        return exceptions;
      }

      case 'schedule_by_classroom': {
        const schedule = storageService.getSchedule();
        return schedule
          .filter(s => {
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || s.classroom === filters.classroom;
            const matchDay = !filters.dayOfWeek || filters.dayOfWeek === 'ALL' || s.dayOfWeek === filters.dayOfWeek;
            return matchClass && matchDay;
          })
          .map(s => ({
            classroom: s.classroom,
            dayOfWeek: s.dayOfWeek,
            periodNumber: s.periodNumber,
            subject: s.subject,
            teacherName: s.teacherName,
            room: s.room || 'فصل أساسي',
          }));
      }

      case 'schedule_by_teacher': {
        const schedule = storageService.getSchedule();
        return schedule
          .filter(s => {
            return !filters.teacherName || filters.teacherName === 'ALL' || s.teacherName === filters.teacherName;
          })
          .map(s => ({
            teacherName: s.teacherName,
            dayOfWeek: s.dayOfWeek,
            periodNumber: s.periodNumber,
            classroom: s.classroom,
            subject: s.subject,
          }));
      }

      case 'lessons_execution_report': {
        const schedule = storageService.getSchedule();
        const date = filters.date || getCairoCurrentDate();
        const dayName = new Date(date).toLocaleDateString('ar-EG', { weekday: 'long' });
        const daySchedule = schedule.filter(s => s.dayOfWeek.includes(dayName) || dayName.includes(s.dayOfWeek));

        return daySchedule.map(s => ({
          date,
          periodNumber: s.periodNumber,
          classroom: s.classroom,
          subject: s.subject,
          teacherName: s.teacherName,
          substituteTeacher: s.isSubstituted ? s.substituteTeacherName || 'احتياط' : '-',
          executionStatus: s.isCancelled ? 'ملغاة' : s.isSubstituted ? 'احتياط' : 'منفذة',
        }));
      }

      case 'homework_monitoring_report': {
        const homeworks = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOMEWORKS) || '[]');
        return homeworks
          .filter((h: any) => {
            const matchSub = !filters.subject || filters.subject === 'ALL' || h.subject === filters.subject;
            const matchCls = !filters.classroom || filters.classroom === 'ALL' || h.classroom === filters.classroom;
            return matchSub && matchCls;
          })
          .map((h: any) => ({
            title: h.title,
            subject: h.subject,
            classroom: h.classroom,
            teacherName: h.teacherName,
            assignedDate: h.assignedDate,
            dueDate: h.dueDate,
            status: h.status === 'Published' ? 'منشور للطلاب' : 'مسودة',
          }));
      }

      case 'violations_analysis': {
        const violations = storageService.getBehaviorViolations();
        return violations
          .filter(v => {
            const matchGrade = !filters.grade || filters.grade === 'ALL' || v.grade === filters.grade;
            const matchClass = !filters.classroom || filters.classroom === 'ALL' || v.classroom === filters.classroom;
            const matchSev = !filters.severityLevel || filters.severityLevel === 'ALL' || v.degree === filters.severityLevel;
            return matchGrade && matchClass && matchSev;
          })
          .map(v => ({
            date: v.date,
            studentName: v.studentName,
            grade: v.grade,
            classroom: v.classroom,
            violationName: v.violationName,
            pointsDeducted: v.pointsDeducted,
            actionTaken: v.actionTaken || 'تنبيه شفهي وتعهد',
            recordedBy: v.recordedBy || 'المشرف',
          }));
      }

      case 'behavior_cases_overview': {
        const cases = storageService.getBehaviorCases();
        return cases
          .filter(c => {
            return !filters.status || filters.status === 'ALL' || c.status === filters.status;
          })
          .map(c => ({
            caseCode: c.caseCode,
            studentName: c.studentName,
            grade: c.grade,
            summary: c.summary,
            specialistName: c.specialistName,
            parentContacted: c.parentContacted ? 'نعم' : 'لا',
            status: c.status,
          }));
      }

      case 'positive_behavior_report': {
        const ledger = storageService.getBehaviorLedger().filter(l => l.pointsAwarded > 0);
        return ledger.map(l => ({
          studentName: l.studentName,
          grade: l.grade || 'عام',
          classroom: l.classroom || 'عام',
          positiveAction: l.reason,
          pointsAwarded: l.pointsAwarded,
          date: l.date,
        }));
      }

      case 'employee_directory': {
        const employees = storageService.getEmployees();
        return employees
          .filter(e => {
            const matchDept = !filters.department || filters.department === 'ALL' || e.department === filters.department;
            const matchStat = !filters.status || filters.status === 'ALL' || e.status === filters.status;
            return matchDept && matchStat;
          })
          .map(e => ({
            id: e.id,
            name: e.name,
            jobTitle: e.jobTitle,
            department: e.department,
            phone: e.phone || '-',
            hireDate: e.hireDate || '-',
            status: e.status === 'Active' ? 'نشط' : 'معطل',
          }));
      }

      case 'employee_daily_attendance': {
        const attendance = storageService.getAttendance();
        const date = filters.date || getCairoCurrentDate();
        return attendance
          .filter(a => {
            const matchDate = a.date === date;
            const matchDept = !filters.department || filters.department === 'ALL' || a.department === filters.department;
            const matchStatus = !filters.status || filters.status === 'ALL' || a.status === filters.status;
            return matchDate && matchDept && matchStatus;
          })
          .map(a => ({
            employeeId: a.employeeId,
            employeeName: a.employeeName,
            department: a.department,
            checkIn: a.checkIn || '-',
            checkOut: a.checkOut || '-',
            status: a.status,
            lateMinutes: a.lateMinutes || 0,
            earlyLeaveMinutes: a.earlyLeaveMinutes || 0,
            overtimeHours: a.overtimeHours || 0,
          }));
      }

      case 'employee_monthly_attendance': {
        const employees = storageService.getEmployees();
        const attendance = storageService.getAttendance();
        const month = Number(filters.month || new Date().getMonth() + 1);
        const year = Number(filters.year || new Date().getFullYear());
        const prefix = `${year}-${String(month).padStart(2, '0')}`;

        return employees
          .filter(e => {
            return !filters.department || filters.department === 'ALL' || e.department === filters.department;
          })
          .map(e => {
            const records = attendance.filter(a => a.employeeId === e.id && a.date.startsWith(prefix));
            const presentDays = records.filter(r => r.status === 'حاضر').length;
            const lateDays = records.filter(r => r.status === 'متأخر').length;
            const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
            const absentDays = records.filter(r => r.status === 'غائب').length;
            const leaveDays = records.filter(r => r.status === 'إجازة').length;
            const overtimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
            const total = records.length;
            const rate = total > 0 ? Math.round((presentDays / total) * 100) : 100;

            return {
              employeeId: e.id,
              employeeName: e.name,
              department: e.department,
              presentDays,
              lateDays,
              totalLateMinutes,
              absentDays,
              leaveDays,
              overtimeHours,
              attendanceRate: `${rate}%`,
            };
          });
      }

      case 'employee_leaves_permissions_report': {
        const leaves = storageService.getLeaves();
        return leaves
          .filter(l => {
            const matchType = !filters.leaveType || filters.leaveType === 'ALL' || l.leaveType === filters.leaveType;
            const matchStat = !filters.status || filters.status === 'ALL' || l.status === filters.status;
            return matchType && matchStat;
          })
          .map(l => ({
            employeeName: l.employeeName,
            department: l.department,
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
            daysCount: l.daysCount,
            status: l.status,
            approvedBy: l.approvedBy || '-',
          }));
      }

      case 'payroll_summary': {
        const payroll = storageService.getPayrollRecords();
        const month = Number(filters.month || new Date().getMonth() + 1);
        const year = Number(filters.year || new Date().getFullYear());

        return payroll
          .filter(p => p.month === month && p.year === year)
          .map(p => ({
            employeeId: p.employeeId,
            employeeName: p.employeeName,
            department: p.department,
            basicSalary: p.basicSalary,
            totalAllowances: (p.allowances || 0) + (p.bonuses || 0),
            overtimeAmount: p.overtimeAmount || 0,
            grossSalary: p.grossSalary,
            absenceDeduction: p.absenceDeduction || 0,
            lateDeduction: p.lateDeduction || 0,
            totalDeductions: p.totalDeductions,
            netSalary: p.netSalary,
            status: p.status === 'Paid' ? 'مصروف ومحول' : p.status === 'Approved' ? 'معتمد' : 'مسودة',
          }));
      }

      case 'payroll_snapshot_audit': {
        const snapshots = storageService.getPayrollAttendanceSnapshots();
        const month = Number(filters.month || new Date().getMonth() + 1);
        const year = Number(filters.year || new Date().getFullYear());

        return snapshots
          .filter(s => s.month === month && s.year === year)
          .map(s => ({
            employeeId: s.employeeId,
            employeeName: s.employeeName,
            workingDays: s.workingDays,
            presentDays: s.presentDays,
            absentDays: s.absentDays,
            lateMinutes: s.lateMinutes,
            overtimeHours: s.overtimeHours,
            isLocked: s.isLocked ? 'مقفل ومعتمد' : 'مفتوح',
          }));
      }

      default:
        return [];
    }
  }

  /**
   * Saved Filters Management (Isolated per User)
   */
  public static getSavedFilters(reportKey: string, userId: string): SavedReportFilter[] {
    try {
      const all: SavedReportFilter[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_REPORT_FILTERS) || '[]');
      return all.filter(f => f.reportKey === reportKey && f.userId === userId);
    } catch {
      return [];
    }
  }

  public static saveFilter(
    reportKey: string,
    name: string,
    filters: Record<string, any>,
    userId: string,
    isDefault: boolean = false
  ): SavedReportFilter {
    const all: SavedReportFilter[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_REPORT_FILTERS) || '[]');
    const newFilter: SavedReportFilter = {
      id: `FLT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      reportKey,
      name,
      filtersJson: JSON.stringify(filters),
      isDefault,
      createdAt: getCairoNowISO(),
      updatedAt: getCairoNowISO(),
    };

    if (isDefault) {
      all.forEach(f => {
        if (f.reportKey === reportKey && f.userId === userId) {
          f.isDefault = false;
        }
      });
    }

    all.push(newFilter);
    localStorage.setItem(STORAGE_KEYS.SAVED_REPORT_FILTERS, JSON.stringify(all));
    return newFilter;
  }

  public static deleteSavedFilter(filterId: string, userId: string): void {
    const all: SavedReportFilter[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_REPORT_FILTERS) || '[]');
    const filtered = all.filter(f => !(f.id === filterId && f.userId === userId));
    localStorage.setItem(STORAGE_KEYS.SAVED_REPORT_FILTERS, JSON.stringify(filtered));
  }

  public static setDefaultFilter(filterId: string, reportKey: string, userId: string): void {
    const all: SavedReportFilter[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_REPORT_FILTERS) || '[]');
    all.forEach(f => {
      if (f.reportKey === reportKey && f.userId === userId) {
        f.isDefault = f.id === filterId;
      }
    });
    localStorage.setItem(STORAGE_KEYS.SAVED_REPORT_FILTERS, JSON.stringify(all));
  }

  /**
   * Filtered Export Flow (Excel)
   */
  public static exportToExcel(
    reportKey: string,
    filters: Record<string, any>,
    activeColumns?: string[],
    currentUser: User | null = null
  ): void {
    const reportDef = this.REPORT_DEFINITIONS.find(r => r.key === reportKey);
    if (!reportDef) return;

    // Security check
    if (reportDef.adminOnly && !this.requirePayrollAdmin(currentUser)) {
      alert('غير مصرح بتصدير هذا التقرير');
      return;
    }

    // Execute full data without pagination for complete export
    const result = this.executeReport(reportKey, filters, 1, 100000, undefined, activeColumns, currentUser);
    
    // Map rows to label keys
    const exportData = result.rows.map(row => {
      const formatted: Record<string, any> = {};
      result.columns.forEach(col => {
        formatted[col.label] = row[col.key] !== undefined ? row[col.key] : '-';
      });
      return formatted;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, reportDef.name.slice(0, 30));
    XLSX.writeFile(wb, `${reportDef.name}_${getCairoCurrentDate()}.xlsx`);

    storageService.logAudit('EXPORT', 'SETTINGS', `تصدير إكسيل لتقرير: ${reportDef.name} (${exportData.length} سجل)`);
  }

  /**
   * Filtered Export Flow (CSV)
   */
  public static exportToCsv(
    reportKey: string,
    filters: Record<string, any>,
    activeColumns?: string[],
    currentUser: User | null = null
  ): void {
    const reportDef = this.REPORT_DEFINITIONS.find(r => r.key === reportKey);
    if (!reportDef) return;

    if (reportDef.adminOnly && !this.requirePayrollAdmin(currentUser)) {
      alert('غير مصرح بتصدير هذا التقرير');
      return;
    }

    const result = this.executeReport(reportKey, filters, 1, 100000, undefined, activeColumns, currentUser);
    const headers = result.columns.map(c => `"${c.label}"`).join(',');
    const rows = result.rows.map(row => {
      return result.columns.map(c => `"${String(row[c.key] || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportDef.name}_${getCairoCurrentDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    storageService.logAudit('EXPORT', 'SETTINGS', `تصدير CSV لتقرير: ${reportDef.name}`);
  }

  /**
   * Print / PDF Layout Generator with RTL Arabic Styling
   */
  public static triggerPrintReport(
    reportKey: string,
    filters: Record<string, any>,
    activeColumns?: string[],
    currentUser: User | null = null
  ): void {
    const reportDef = this.REPORT_DEFINITIONS.find(r => r.key === reportKey);
    if (!reportDef) return;

    if (reportDef.adminOnly && !this.requirePayrollAdmin(currentUser)) {
      alert('غير مصرح بطباعة هذا التقرير');
      return;
    }

    window.print();
  }
}
