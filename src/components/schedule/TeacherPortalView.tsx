import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  Plus,
  Save,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LessonContent, ScheduleItem } from '../../types';
import { storageService } from '../../services/storageService';
import {
  formatEgyptianDate,
  getCairoCurrentDate,
  getEgyptianDayName,
} from '../../utils/egyptianTime';

const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const TeacherPortalView: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => storageService.getSchedule());
  const [lessons, setLessons] = useState<LessonContent[]>(() => storageService.getLessonContents());
  const [activeTab, setActiveTab] = useState<'schedule' | 'lessons'>('schedule');

  // Filter Schedule
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');

  // Add Item Modal
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

  // New Schedule Item form
  const [schedForm, setSchedForm] = useState<Partial<ScheduleItem>>({
    dayName: 'الأحد',
    periodNumber: 1,
    subject: 'لغة عربية',
    teacherName: '',
    grade: 'الصف الأول الثانوي',
    classroom: '1/1',
    startTime: '08:00',
    endTime: '08:45',
    roomNumber: 'قاعة 101',
  });

  // New Lesson form
  const [lessonForm, setLessonForm] = useState<Partial<LessonContent>>({
    date: getCairoCurrentDate(),
    periodNumber: 1,
    subject: 'لغة عربية',
    teacherName: '',
    grade: 'الصف الأول الثانوي',
    classroom: '1/1',
    lessonTitle: '',
    summaryCovered: '',
    homework: '',
  });

  const settings = storageService.getSettings();
  const stages = settings.stages || [];
  const employees = storageService.getEmployees();
  const teachers = employees.filter(e => e.department.includes('تدريس') || e.jobTitle.includes('معلم') || e.department.includes('تعليم'));

  const reloadData = () => {
    setSchedule(storageService.getSchedule());
    setLessons(storageService.getLessonContents());
  };

  const filteredSchedule = useMemo(() => {
    return schedule.filter(s => {
      const matchDay = selectedDay === 'ALL' || s.dayName === selectedDay;
      const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchClass = selectedClassroom === 'ALL' || s.classroom === selectedClassroom;
      const matchTeacher = selectedTeacher === 'ALL' || s.teacherName === selectedTeacher;
      return matchDay && matchGrade && matchClass && matchTeacher;
    });
  }, [schedule, selectedDay, selectedGrade, selectedClassroom, selectedTeacher]);

  const handleSaveScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedForm.subject || !schedForm.grade || !schedForm.classroom) {
      alert('يرجى ملء الحقول الإلزامية');
      return;
    }

    const item: ScheduleItem = {
      id: `SCH-${Date.now()}`,
      dayName: schedForm.dayName || 'الأحد',
      periodNumber: Number(schedForm.periodNumber) || 1,
      subject: schedForm.subject,
      teacherName: schedForm.teacherName || 'معلم المادة',
      teacherId: schedForm.teacherId || '',
      grade: schedForm.grade,
      classroom: schedForm.classroom,
      startTime: schedForm.startTime || '08:00',
      endTime: schedForm.endTime || '08:45',
      roomNumber: schedForm.roomNumber,
      academicYear: '2025/2026',
      term: 'الترم الأول',
      stage: 'المرحلة الثانوية',
    };

    storageService.saveScheduleItem(item);
    setIsAddScheduleModalOpen(false);
    reloadData();
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.subject || !lessonForm.lessonTitle) {
      alert('يرجى إدخال المادة وعنوان الدرس');
      return;
    }

    const lesson: LessonContent = {
      id: `LES-${Date.now()}`,
      teacherId: storageService.getCurrentUser()?.id || 'TCH-001',
      date: lessonForm.date || getCairoCurrentDate(),
      periodNumber: Number(lessonForm.periodNumber) || 1,
      subject: lessonForm.subject,
      teacherName: lessonForm.teacherName || storageService.getCurrentUser()?.fullName || 'المعلم',
      grade: lessonForm.grade || 'الصف الأول الثانوي',
      classroom: lessonForm.classroom || '1/1',
      lessonTitle: lessonForm.lessonTitle,
      summaryCovered: lessonForm.summaryCovered || '',
      homework: lessonForm.homework,
      links: [],
      createdAt: new Date().toISOString(),
    };

    storageService.saveLessonContent(lesson);
    setIsAddLessonModalOpen(false);
    reloadData();
  };

  const handleDeleteScheduleItem = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة من الجدول؟')) {
      storageService.deleteScheduleItem(id);
      reloadData();
    }
  };

  const exportScheduleExcel = () => {
    const data = filteredSchedule.map((s, idx) => ({
      'م': idx + 1,
      'اليوم': s.dayName,
      'الحصة': `الحصة ${s.periodNumber}`,
      'المادة': s.subject,
      'المعلم': s.teacherName,
      'الصف': s.grade,
      'الفصل': s.classroom,
      'الموعد': `${s.startTime} - ${s.endTime}`,
      'القاعة': s.roomNumber || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجدول_المدرسي');
    XLSX.writeFile(wb, `الجدول_المدرسي_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <span>بوابة المعلم والجدول المدرسي والمناهج</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الحصص المدرسية، جدول المعلمين والفصول، وتوثيق الدروس المشروحة والواجبات
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportScheduleExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير الجدول Excel</span>
          </button>

          {activeTab === 'schedule' ? (
            <button
              onClick={() => setIsAddScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة للجدول</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddLessonModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>توثيق درس مشروح جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'schedule' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          الجدول الدراسي الأسبوعي
        </button>
        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          سجل الدروس المشروحة والواجبات ({lessons.length})
        </button>
      </div>

      {/* TAB 1: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اليوم</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
              >
                <option value="ALL">جميع الأيام</option>
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
              >
                <option value="ALL">جميع الصفوف</option>
                {stages.flatMap(s => s.grades).map(g => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الفصل</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
              >
                <option value="ALL">جميع الفصول</option>
                {['1/1', '1/2', '1/3', '2/1', '2/2', '3/1', '3/2'].map(c => (
                  <option key={c} value={c}>فصل {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المعلم</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
              >
                <option value="ALL">جميع المعلمين</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">اليوم</th>
                    <th className="p-4">رقم الحصة</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">المعلم المسند</th>
                    <th className="p-4">الصف والفصل</th>
                    <th className="p-4">التوقيت</th>
                    <th className="p-4">القاعة</th>
                    <th className="p-4 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">لا توجد حصص مسجلة في الجدول حالياً</p>
                        <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة حصة للجدول" للبدء في بنائه</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSchedule.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{item.dayName}</td>
                        <td className="p-4 font-mono font-bold text-[#008e8b]">الحصة {item.periodNumber}</td>
                        <td className="p-4 font-bold text-slate-800 text-sm">{item.subject}</td>
                        <td className="p-4 text-slate-700">{item.teacherName}</td>
                        <td className="p-4">
                          <span className="text-slate-800 font-medium">{item.grade}</span>
                          <span className="block text-[11px] text-teal-700 font-bold">فصل {item.classroom}</span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">{item.startTime} - {item.endTime}</td>
                        <td className="p-4 text-slate-600">{item.roomNumber || '—'}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteScheduleItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LESSONS */}
      {activeTab === 'lessons' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الحصة</th>
                  <th className="p-4">المادة</th>
                  <th className="p-4">الصف والفصل</th>
                  <th className="p-4">المعلم</th>
                  <th className="p-4">عنوان ومحتوى الدرس المشروح</th>
                  <th className="p-4">الواجب المنزلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lessons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">لم يتم توثيق أي دروس مشروحة حتى الآن</p>
                    </td>
                  </tr>
                ) : (
                  lessons.map(lesson => (
                    <tr key={lesson.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-slate-700">{formatEgyptianDate(lesson.date)}</td>
                      <td className="p-4 font-mono text-slate-700">الحصة {lesson.periodNumber}</td>
                      <td className="p-4 font-bold text-indigo-700">{lesson.subject}</td>
                      <td className="p-4 text-slate-700">{lesson.grade} (فصل {lesson.classroom})</td>
                      <td className="p-4 text-slate-800 font-medium">{lesson.teacherName}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{lesson.lessonTitle}</div>
                        {lesson.summaryCovered && (
                          <div className="text-[11px] text-slate-500 mt-1">{lesson.summaryCovered}</div>
                        )}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{lesson.homework || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Schedule Item Modal */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#008e8b]" />
                <span>إضافة حصة جديدة إلى الجدول الدراسي</span>
              </h3>
              <button onClick={() => setIsAddScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheduleItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اليوم</label>
                  <select
                    value={schedForm.dayName}
                    onChange={(e) => setSchedForm({ ...schedForm, dayName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحصة</label>
                  <select
                    value={schedForm.periodNumber}
                    onChange={(e) => setSchedForm({ ...schedForm, periodNumber: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {PERIODS.map(p => (
                      <option key={p} value={p}>الحصة {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: لغة عربية، رياضيات..."
                    value={schedForm.subject || ''}
                    onChange={(e) => setSchedForm({ ...schedForm, subject: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المعلم المسند</label>
                  <select
                    value={schedForm.teacherName || ''}
                    onChange={(e) => {
                      const t = teachers.find(tch => tch.name === e.target.value);
                      setSchedForm({ ...schedForm, teacherName: e.target.value, teacherId: t?.id });
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">— اختر المعلم —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.jobTitle})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
                  <input
                    type="text"
                    required
                    value={schedForm.grade || ''}
                    onChange={(e) => setSchedForm({ ...schedForm, grade: e.target.value })}
                    placeholder="الصف الأول الثانوي"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفصل</label>
                  <input
                    type="text"
                    required
                    value={schedForm.classroom || ''}
                    onChange={(e) => setSchedForm({ ...schedForm, classroom: e.target.value })}
                    placeholder="1/1"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت البدء</label>
                  <input
                    type="time"
                    value={schedForm.startTime || '08:00'}
                    onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانتهاء</label>
                  <input
                    type="time"
                    value={schedForm.endTime || '08:45'}
                    onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  إدراج الحصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>توثيق درس مشروح وخطة واجبات</span>
              </h3>
              <button onClick={() => setIsAddLessonModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={lessonForm.date}
                    onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المادة</label>
                  <input
                    type="text"
                    required
                    value={lessonForm.subject || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الدرس المشروح</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كان وأخواتها وتطبيقات إعرابية"
                    value={lessonForm.lessonTitle || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonTitle: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملخص ما تم إنجازه وشرحه</label>
                  <textarea
                    rows={2}
                    value={lessonForm.summaryCovered || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, summaryCovered: e.target.value })}
                    placeholder="تم شرح القاعدة وحل تدريبات الكتاب المدرسي ص 45..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">الواجب والتكليفات المنزلية</label>
                  <input
                    type="text"
                    placeholder="حل تدريبات ص 46 و 47 في كشكول الواجب"
                    value={lessonForm.homework || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, homework: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
