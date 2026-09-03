import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Link2,
  Plus,
  Save,
  Send,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ClassAttendanceRecord,
  Homework,
  LessonContent,
  LessonDeliveryStatus,
  LessonInstance,
  LessonLink,
  ScheduleItem,
  ScheduleSubstitution,
  Student,
  User,
} from '../../types';
import { storageService } from '../../services/storageService';
import { HomeworkService } from '../../services/homeworkService';
import { getCairoCurrentDate, getCairoNowISO } from '../../utils/egyptianTime';

interface LessonDeliveryWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  periodNumber: number;
  scheduleItem?: ScheduleItem;
  substitution?: ScheduleSubstitution;
  teacherId: string;
  teacherName: string;
  onSaved?: () => void;
}

export const LessonDeliveryWorkspaceModal: React.FC<LessonDeliveryWorkspaceModalProps> = ({
  isOpen,
  onClose,
  date,
  periodNumber,
  scheduleItem,
  substitution,
  teacherId,
  teacherName,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'content' | 'homework' | 'completion'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Effective meta
  const subject = substitution?.subject || scheduleItem?.subject || 'المادة الدراسية';
  const grade = substitution?.grade || scheduleItem?.grade || '';
  const classroom = substitution?.classroom || scheduleItem?.classroom || '';
  const isSubstitution = Boolean(substitution);

  // Students in this classroom
  const [students, setStudents] = useState<Student[]>([]);
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<Record<string, 'حاضر' | 'غياب بدون عذر' | 'غياب بعذر' | 'حاضر متأخر'>>({});

  // Lesson Content Form State
  const [title, setTitle] = useState('');
  const [lessonUnit, setLessonUnit] = useState('');
  const [lessonChapter, setLessonChapter] = useState('');
  const [summaryCovered, setSummaryCovered] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [bookPageFrom, setBookPageFrom] = useState<number | ''>('');
  const [bookPageTo, setBookPageTo] = useState<number | ''>('');
  const [parentVisibleSummary, setParentVisibleSummary] = useState('');
  const [isVisibleToParent, setIsVisibleToParent] = useState(true);
  const [links, setLinks] = useState<LessonLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<LessonLink['type']>('pdf');

  // Homework Form State
  const [hasHomework, setHasHomework] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [hwMaxScore, setHwMaxScore] = useState<number>(10);
  const [hwQuestions, setHwQuestions] = useState('');

  // Delivery Status
  const [deliveryStatus, setDeliveryStatus] = useState<LessonDeliveryStatus>('Delivered');
  const [partialReason, setPartialReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch Students
    const allStudents = storageService.getStudents();
    const enrolled = allStudents.filter(
      s => s.grade === grade && s.classroom === classroom && s.status !== 'غير نشط' && s.status !== 'منقول'
    );
    setStudents(enrolled);

    // 2. Fetch existing class attendance
    const existingClassAtt = storageService.getClassAttendance({
      grade,
      classroom,
      date,
      periodNumber,
    });

    const attMap: Record<string, any> = {};
    enrolled.forEach(std => {
      const match = existingClassAtt.find(a => a.studentId === std.id);
      attMap[std.id] = match ? match.status : 'حاضر';
    });
    setStudentAttendanceMap(attMap);

    // 3. Fetch existing Lesson Content
    const allContents = storageService.getLessonContents();
    const existingContent = allContents.find(
      c => c.date === date && c.periodNumber === periodNumber && (c.classroom === classroom && c.grade === grade)
    );

    if (existingContent) {
      setTitle(existingContent.title || existingContent.lessonTitle || '');
      setLessonUnit(existingContent.lessonUnit || '');
      setLessonChapter(existingContent.lessonChapter || '');
      setSummaryCovered(existingContent.summaryCovered || existingContent.summary || '');
      setLearningObjectives(existingContent.learningObjectives || '');
      setBookPageFrom(existingContent.bookPageFrom || '');
      setBookPageTo(existingContent.bookPageTo || '');
      setParentVisibleSummary(existingContent.parentVisibleSummary || '');
      setIsVisibleToParent(existingContent.isVisibleToParent !== false);
      setLinks(existingContent.links || []);
      setDeliveryStatus(existingContent.deliveryStatus || 'Delivered');
    } else {
      setTitle('');
      setLessonUnit('');
      setLessonChapter('');
      setSummaryCovered('');
      setLearningObjectives('');
      setBookPageFrom('');
      setBookPageTo('');
      setParentVisibleSummary('');
      setIsVisibleToParent(true);
      setLinks([]);
      setDeliveryStatus('Delivered');
    }

    // 4. Fetch existing Homework
    const existingHw = storageService.getHomeworks().find(
      h => h.assignedDate === date && h.subject === subject && h.classroom === classroom && h.grade === grade
    );

    if (existingHw) {
      setHasHomework(true);
      setHwTitle(existingHw.title || '');
      setHwDescription(existingHw.description || '');
      setHwDueDate(existingHw.dueDate || date);
      setHwMaxScore(existingHw.maxScore || 10);
      setHwQuestions(existingHw.questions || '');
    } else {
      setHasHomework(false);
      setHwTitle(`واجب ${subject}`);
      setHwDescription('');
      setHwQuestions('');
    }
  }, [isOpen, date, periodNumber, grade, classroom, subject]);

  if (!isOpen) return null;

  const handleAddLink = () => {
    if (!newLinkTitle || !newLinkUrl) return;
    setLinks([
      ...links,
      {
        id: `LNK-${Date.now()}`,
        title: newLinkTitle,
        url: newLinkUrl,
        type: newLinkType,
      },
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleMarkAllAttendance = (status: 'حاضر' | 'غياب بدون عذر') => {
    const updated: Record<string, any> = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setStudentAttendanceMap(updated);
  };

  const handleSaveAll = async (isDraft = false) => {
    setIsSaving(true);
    const now = getCairoNowISO();

    try {
      // 1. Save Class Attendance
      if (students.length > 0) {
        const attendanceRecords: ClassAttendanceRecord[] = students.map(std => ({
          id: `CATT-${std.id}-${date}-P${periodNumber}`,
          studentId: std.id,
          studentName: std.fullName,
          studentCode: std.studentCode,
          nationalId: std.nationalId,
          grade: std.grade,
          classroom: std.classroom,
          date,
          periodNumber,
          subject,
          teacherId,
          teacherName,
          status: studentAttendanceMap[std.id] || 'حاضر',
          createdAt: now,
          updatedAt: now,
        }));
        storageService.saveClassAttendance(attendanceRecords);
      }

      // 2. Save Lesson Content
      const finalStatus: LessonDeliveryStatus = isDraft ? 'InProgress' : deliveryStatus;
      const lessonContentObj: LessonContent = {
        id: `LES-${date}-${periodNumber}-${grade}-${classroom}`,
        scheduleItemId: scheduleItem?.id,
        date,
        periodNumber,
        teacherId,
        teacherName,
        subject,
        grade,
        classroom,
        title: title || `حصة ${subject}`,
        lessonTitle: title || `حصة ${subject}`,
        lessonUnit,
        lessonChapter,
        summary: summaryCovered,
        summaryCovered,
        learningObjectives,
        bookPageFrom: typeof bookPageFrom === 'number' ? bookPageFrom : undefined,
        bookPageTo: typeof bookPageTo === 'number' ? bookPageTo : undefined,
        bookPages: bookPageFrom && bookPageTo ? `${bookPageFrom} - ${bookPageTo}` : undefined,
        parentVisibleSummary: parentVisibleSummary || summaryCovered,
        isVisibleToParent,
        links,
        deliveryStatus: finalStatus,
        status: isDraft ? 'Draft' : 'Published',
        hasHomework,
        homework: hasHomework ? hwTitle : undefined,
        homeworkTitle: hasHomework ? hwTitle : undefined,
        homeworkDescription: hasHomework ? hwDescription : undefined,
        homeworkDueDate: hasHomework ? hwDueDate : undefined,
        publishedAt: isDraft ? undefined : now,
        createdAt: now,
        updatedAt: now,
      };
      storageService.saveLessonContent(lessonContentObj);

      // 3. Save Lesson Instance
      const lessonInstanceObj: LessonInstance = {
        id: `LINST-${date}-${periodNumber}-${grade}-${classroom}`,
        scheduleItemId: scheduleItem?.id || `SCH-${Date.now()}`,
        date,
        periodNumber,
        grade,
        classroom,
        subject,
        plannedTeacherId: scheduleItem?.teacherId || teacherId,
        plannedTeacherName: scheduleItem?.teacherName || teacherName,
        actualTeacherId: teacherId,
        actualTeacherName: teacherName,
        substitutionId: substitution?.id,
        deliveryStatus: finalStatus,
        cancelReason: finalStatus === 'Cancelled' ? cancelReason : undefined,
        partialReason: finalStatus === 'PartiallyDelivered' ? partialReason : undefined,
        lessonTitle: title || `حصة ${subject}`,
        bookPages: bookPageFrom && bookPageTo ? `${bookPageFrom} - ${bookPageTo}` : undefined,
        homework: hasHomework ? `${hwTitle}: ${hwDescription}` : undefined,
        completedAt: isDraft ? undefined : now,
        updatedAt: now,
      };
      storageService.saveLessonInstance(lessonInstanceObj);

      // 4. Save Homework if checked
      if (hasHomework && hwTitle.trim()) {
        const hwObj: Partial<Homework> = {
          id: `HW-${date}-${periodNumber}-${grade}-${classroom}`,
          lessonInstanceId: lessonInstanceObj.id,
          scheduleItemId: scheduleItem?.id,
          teacherId,
          teacherName,
          subject,
          grade,
          classroom,
          title: hwTitle.trim(),
          description: hwDescription.trim(),
          questions: hwQuestions.trim(),
          assignedDate: date,
          dueDate: hwDueDate,
          maxScore: hwMaxScore || 10,
          status: isDraft ? 'Draft' : 'Published',
          isVisibleToParent: true,
          isVisibleToStudent: true,
          links,
        };
        HomeworkService.saveHomework(hwObj, storageService.getCurrentUser());
      }

      setSaveSuccessMessage(isDraft ? 'تم حفظ المسودة بنجاح' : 'تم اعتماد الحصة وتسليم المحتوى بنجاح!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ بيانات الحصة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">تسليم وتنفيذ الحصة الدراسية</h3>
                {isSubstitution && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    حصة احتياطي
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {subject} • {grade} ({classroom}) • الحصة رقم {periodNumber} • {date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>حضور الفصل ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المحتوى والشرح</span>
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'homework'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الواجب المدرسي {hasHomework && '✓'}</span>
          </button>
          <button
            onClick={() => setActiveTab('completion')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completion'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تقرير التنفيذ والاعتماد</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: CLASS ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">رصد الحضور والغياب المباشر للحصة</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يتم تسجيل الغياب تلقائياً وربطه بملف الطالب 360 وإشعار الإدارة
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAllAttendance('حاضر')}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    الكل حاضر ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAllAttendance('غياب بدون عذر')}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200 transition-colors"
                  >
                    الكل غائب ✕
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">لا يوجد طلاب مسجلين في هذا الفصل حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {students.map(std => {
                    const currentStatus = studentAttendanceMap[std.id] || 'حاضر';
                    return (
                      <div
                        key={std.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          currentStatus === 'حاضر'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : currentStatus === 'غياب بدون عذر'
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{std.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">كود: {std.studentCode}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'حاضر' }))
                            }
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              currentStatus === 'حاضر'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'غياب بدون عذر' }))
                            }
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              currentStatus === 'غياب بدون عذر'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            غائب
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'حاضر متأخر' }))
                            }
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              currentStatus === 'حاضر متأخر'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            متأخر
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LESSON CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان وموضوع الدرس <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: مقدمة في المصفوفات والجبر الخطي"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة / الفصل</label>
                  <input
                    type="text"
                    value={lessonUnit}
                    onChange={e => setLessonUnit(e.target.value)}
                    placeholder="مثال: الوحدة الثانية"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصفحات المقررة في الكتاب المدرسي
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="من صفحة"
                      value={bookPageFrom}
                      onChange={e => setBookPageFrom(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="number"
                      placeholder="إلى صفحة"
                      value={bookPageTo}
                      onChange={e => setBookPageTo(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نواتج التعلم والأهداف</label>
                  <input
                    type="text"
                    value={learningObjectives}
                    onChange={e => setLearningObjectives(e.target.value)}
                    placeholder="مثال: أن يتعرف الطالب على ضرب المصفوفات"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملخص ما تم شرحه وإنجازه خلال الحصة
                </label>
                <textarea
                  rows={3}
                  value={summaryCovered}
                  onChange={e => setSummaryCovered(e.target.value)}
                  placeholder="اكتب بإيجاز المحاور الرئيسية التي تم شرحها والتدريبات التي تم حلها مع الطلاب..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Resource Links */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-600" />
                    <span>المرفقات والروابط التعليمية (Drive / PDF / YouTube)</span>
                  </h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="عنوان الرابط / الملف"
                      value={newLinkTitle}
                      onChange={e => setNewLinkTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={newLinkType}
                      onChange={e => setNewLinkType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="pdf">ملف PDF</option>
                      <option value="drive">Google Drive</option>
                      <option value="youtube">فيديو YouTube</option>
                      <option value="presentation">عرض تقديمي</option>
                      <option value="assignment">ورقة عمل</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="w-full h-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {links.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {links.map(l => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                            {l.type}
                          </span>
                          <span className="font-bold text-slate-800 truncate">{l.title}</span>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(l.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-emerald-950">إتاحة المحتوى في بوابة ولي الأمر والطلاب</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    يسمح لأولياء الأمور بالاطلاع على ما تم شرحه ومتابعة أبنائهم
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isVisibleToParent}
                  onChange={e => setIsVisibleToParent(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: HOMEWORK */}
          {activeTab === 'homework' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">تكليف واجب منزلي لهذه الحصة</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    سيظهر الواجب مباشرة في بوابة ولي الأمر مع تاريخ التسليم المحدد
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasHomework}
                  onChange={e => setHasHomework(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {hasHomework && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        عنوان الواجب / المهمة <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={hwTitle}
                        onChange={e => setHwTitle(e.target.value)}
                        placeholder="مثال: حل تمارين الكتاب صفحة 45"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        تاريخ الاستحقاق والتسليم
                      </label>
                      <input
                        type="date"
                        value={hwDueDate}
                        onChange={e => setHwDueDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تفاصيل الواجب والتعليمات
                    </label>
                    <textarea
                      rows={3}
                      value={hwDescription}
                      onChange={e => setHwDescription(e.target.value)}
                      placeholder="اكتب تعليمات الحل والأسئلة المطلوبة بالتفصيل..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      أرقام الأسئلة أو المسائل المطلوبة
                    </label>
                    <input
                      type="text"
                      value={hwQuestions}
                      onChange={e => setHwQuestions(e.target.value)}
                      placeholder="مثال: السؤال 1 (أ، ب)، السؤال 4 صفحة 46"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETION & STATUS */}
          {activeTab === 'completion' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  الحالة التشغيلية النهائية للحصة:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('Delivered')}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      deliveryStatus === 'Delivered'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-800 flex items-center justify-between">
                      <span>تم التنفيذ بالكامل</span>
                      {deliveryStatus === 'Delivered' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">تم شرح الدرس كاملًا ورصد الحضور والواجب</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('PartiallyDelivered')}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      deliveryStatus === 'PartiallyDelivered'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-800 flex items-center justify-between">
                      <span>تم التنفيذ جزئياً</span>
                      {deliveryStatus === 'PartiallyDelivered' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">تم تغطية جزء من المقرر ويستكمل لاحقاً</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('Cancelled')}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      deliveryStatus === 'Cancelled'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-rose-800 flex items-center justify-between">
                      <span>لم يتم الشرح / ملغاة</span>
                      {deliveryStatus === 'Cancelled' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">بسبب نشاط مدرسي، طوارئ أو امتحان</p>
                  </button>
                </div>
              </div>

              {deliveryStatus === 'PartiallyDelivered' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    سبب التنفيذ الجزئي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partialReason}
                    onChange={e => setPartialReason(e.target.value)}
                    placeholder="مثال: ضيق الوقت بسبب نشاط الإذاعة المدرسية"
                    className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {deliveryStatus === 'Cancelled' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    سبب إلغاء الحصة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="مثال: مشاركة الطلاب في مسابقة أو طابور تكريم"
                    className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAll(true)}
              className="px-4 py-2.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ كمسودة</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAll(false)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSaving ? 'جارِ الاعتماد...' : 'اعتماد وتسليم الحصة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
