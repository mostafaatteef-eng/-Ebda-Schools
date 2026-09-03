import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ScheduleConflictResult, ScheduleItem, SystemSettings, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import { ScheduleService } from '../../services/scheduleService';
import { ScheduleConflictService } from '../../services/scheduleConflictService';
import { SchedulePdfModal } from './SchedulePdfModal';

interface ScheduleMatrixViewProps {
  currentUser: UserType | null;
  onOpenLessonWorkspace?: (item: ScheduleItem) => void;
}

export const ScheduleMatrixView: React.FC<ScheduleMatrixViewProps> = ({
  currentUser,
  onOpenLessonWorkspace,
}) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => storageService.getSchedule());
  const [viewMode, setViewMode] = useState<'classroom' | 'teacher' | 'day'>('classroom');

  const settings = storageService.getSettings();
  const scheduleConfig = storageService.getScheduleConfig();
  const daysOfWeek = scheduleConfig.studyDays?.length
    ? scheduleConfig.studyDays
    : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const periodCount = scheduleConfig.periodCount || 7;
  const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

  const dynamicGrades = storageService.getGrades();
  const dynamicSubjects = storageService.getSubjects();
  const dynamicClassrooms = storageService.getClassrooms();
  const employees = storageService.getEmployees();
  const teachers = employees.filter(
    e => (e.department?.includes('تعليم') || e.department?.includes('تدريس') || e.jobTitle?.includes('معلم') || e.isTeacher) && e.status === 'Active'
  );

  // Selected filters for matrices
  const [selectedGrade, setSelectedGrade] = useState<string>(dynamicGrades[0]?.name || 'الصف الأول الثانوي');
  const [selectedClassroom, setSelectedClassroom] = useState<string>(dynamicClassrooms[0] || '1/1');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0] || 'الأحد');

  // Conflict Audit State
  const [conflictResult, setConflictResult] = useState<ScheduleConflictResult>(() =>
    ScheduleConflictService.auditEntireSchedule(schedule)
  );

  // PDF Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Add/Edit Schedule Item Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ScheduleItem> | null>(null);
  const [modalConflictWarning, setModalConflictWarning] = useState<string | null>(null);

  const reloadData = () => {
    const updated = storageService.getSchedule();
    setSchedule(updated);
    setConflictResult(ScheduleConflictService.auditEntireSchedule(updated));
  };

  // Matrix Filtered Items
  const matrixItems = useMemo(() => {
    if (viewMode === 'classroom') {
      return schedule.filter(
        s => s.grade === selectedGrade && s.classroom === selectedClassroom && s.isActive !== false
      );
    } else if (viewMode === 'teacher') {
      return schedule.filter(s => s.teacherId === selectedTeacherId && s.isActive !== false);
    } else {
      return schedule.filter(
        s => (s.dayOfWeek === selectedDay || s.dayName === selectedDay) && s.isActive !== false
      );
    }
  }, [schedule, viewMode, selectedGrade, selectedClassroom, selectedTeacherId, selectedDay]);

  const matrixTitle = useMemo(() => {
    if (viewMode === 'classroom') {
      return `جدول الحصص الأسبوعي: ${selectedGrade} (${selectedClassroom})`;
    } else if (viewMode === 'teacher') {
      const t = teachers.find(e => e.id === selectedTeacherId);
      return `الجدول الأسبوعي للمعلم: ${t?.name || 'المعلم'}`;
    } else {
      return `الجدول العام لجميع الفصول ليوم (${selectedDay})`;
    }
  }, [viewMode, selectedGrade, selectedClassroom, selectedTeacherId, selectedDay, teachers]);

  const handleCellClick = (day: string, periodNumber: number) => {
    const existing = matrixItems.find(
      i => (i.dayOfWeek === day || i.dayName === day) && i.periodNumber === periodNumber
    );

    const timing = scheduleConfig.periodTimes?.[periodNumber - 1] || {
      startTime: `0${7 + periodNumber}:45`,
      endTime: `0${8 + periodNumber}:30`,
    };

    if (existing) {
      setEditingItem(existing);
    } else {
      setEditingItem({
        id: `SCH-${Date.now()}`,
        dayName: day,
        dayOfWeek: day,
        periodNumber,
        startTime: timing.startTime,
        endTime: timing.endTime,
        grade: viewMode === 'classroom' ? selectedGrade : dynamicGrades[0]?.name || 'الصف الأول الثانوي',
        classroom: viewMode === 'classroom' ? selectedClassroom : dynamicClassrooms[0] || '1/1',
        teacherId: viewMode === 'teacher' ? selectedTeacherId : teachers[0]?.id || '',
        teacherName:
          viewMode === 'teacher'
            ? teachers.find(t => t.id === selectedTeacherId)?.name || ''
            : teachers[0]?.name || '',
        subject: dynamicSubjects[0]?.name || 'اللغة العربية',
        roomNumber: 'قاعة 101',
        status: 'Active',
      });
    }
    setModalConflictWarning(null);
    setIsEditModalOpen(true);
  };

  const handleSaveModalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const teacherObj = teachers.find(t => t.id === editingItem.teacherId);
    const prepared: ScheduleItem = {
      id: editingItem.id || `SCH-${Date.now()}`,
      dayName: editingItem.dayName || editingItem.dayOfWeek || 'الأحد',
      dayOfWeek: editingItem.dayOfWeek || editingItem.dayName || 'الأحد',
      periodNumber: Number(editingItem.periodNumber) || 1,
      subject: editingItem.subject || 'المادة',
      teacherId: editingItem.teacherId || '',
      teacherName: teacherObj?.name || editingItem.teacherName || 'معلم المادة',
      grade: editingItem.grade || selectedGrade,
      classroom: editingItem.classroom || selectedClassroom,
      startTime: editingItem.startTime || '08:00',
      endTime: editingItem.endTime || '08:45',
      roomNumber: editingItem.roomNumber || 'قاعة دراسية',
      status: 'Active',
      isActive: true,
      createdAt: editingItem.createdAt || new Date().toISOString(),
    };

    const result = ScheduleService.saveScheduleItem(prepared, false);
    if (!result.success) {
      if (result.conflictResult?.hasBlockingConflicts) {
        setModalConflictWarning(result.message || 'يوجد تضارب يمنع حفظ هذه الحصة!');
        return;
      }
    }

    setIsEditModalOpen(false);
    reloadData();
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('هل أنت متأكد من إزالة هذه الحصة من الجدول؟')) {
      storageService.deleteScheduleItem(id);
      setIsEditModalOpen(false);
      reloadData();
    }
  };

  const handleExportExcel = () => {
    const rows = matrixItems.map(item => ({
      'اليوم': item.dayOfWeek || item.dayName,
      'رقم الحصة': item.periodNumber,
      'وقت البدء': item.startTime,
      'وقت الانتهاء': item.endTime,
      'المادة': item.subject,
      'المعلم': item.teacherName,
      'الصف': item.grade,
      'الفصل': item.classroom,
      'القاعة / المعمل': item.roomNumber || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجدول المدرسي');
    XLSX.writeFile(wb, `schedule_${viewMode}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Conflict Diagnostic Banner */}
      {conflictResult.hasConflicts && (
        <div
          className={`p-4 rounded-3xl border flex items-start justify-between gap-4 animate-fadeIn ${
            conflictResult.hasBlockingConflicts
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-2xl shrink-0 ${
                conflictResult.hasBlockingConflicts ? 'bg-rose-200/70 text-rose-700' : 'bg-amber-200/70 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black">
                {conflictResult.hasBlockingConflicts
                  ? `تنبيه تضارب في الجدول الدراسي (${conflictResult.conflicts.length} تضارب)`
                  : `ملاحظات وتنبيهات تنظيمية (${conflictResult.conflicts.length})`}
              </h4>
              <ul className="text-[11px] mt-1 space-y-0.5 list-disc list-inside">
                {conflictResult.conflicts.slice(0, 3).map((c, idx) => (
                  <li key={idx}>{c.message}</li>
                ))}
                {conflictResult.conflicts.length > 3 && (
                  <li>و {conflictResult.conflicts.length - 3} ملاحظات إضافية...</li>
                )}
              </ul>
            </div>
          </div>
          <button
            onClick={reloadData}
            className="px-3 py-1.5 bg-white/80 border border-slate-200 rounded-xl text-xs font-bold shrink-0 hover:bg-white transition-colors"
          >
            إعادة فحص التضارب
          </button>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('classroom')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'classroom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب الفصل الدراسي
          </button>
          <button
            onClick={() => setViewMode('teacher')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'teacher'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب المعلم
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'day'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الجدول العام لليوم
          </button>
        </div>

        {/* Dynamic Selectors Based on Mode */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {viewMode === 'classroom' && (
            <>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {dynamicGrades.map(g => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedClassroom}
                onChange={e => setSelectedClassroom(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {dynamicClassrooms.map(c => (
                  <option key={c} value={c}>
                    فصل {c}
                  </option>
                ))}
              </select>
            </>
          )}

          {viewMode === 'teacher' && (
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 max-w-xs"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.jobTitle || 'معلم'})
                </option>
              ))}
            </select>
          )}

          {viewMode === 'day' && (
            <select
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {daysOfWeek.map(d => (
                <option key={d} value={d}>
                  يوم {d}
                </option>
              ))}
            </select>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mr-auto lg:mr-0">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Timetable Matrix Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{matrixTitle}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              انقر على أي حصة لتعديلها أو انقر على خانة فارغة لإضافة حصة جديدة
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            {matrixItems.length} حصة مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="p-3.5 border-l border-slate-200 w-28 bg-slate-200/50">اليوم / الحصة</th>
                {periods.map(p => {
                  const timing = scheduleConfig.periodTimes?.[p - 1];
                  return (
                    <th key={p} className="p-3 border-l border-slate-200 min-w-[130px]">
                      <div className="font-bold text-slate-800">الحصة {p}</div>
                      {timing && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {timing.startTime} - {timing.endTime}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {daysOfWeek.map(day => (
                <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-3.5 font-bold bg-slate-50 text-slate-900 border-l border-slate-200">
                    {day}
                  </td>
                  {periods.map(p => {
                    const cellItem = matrixItems.find(
                      i => (i.dayOfWeek === day || i.dayName === day) && i.periodNumber === p
                    );
                    return (
                      <td
                        key={p}
                        onClick={() => handleCellClick(day, p)}
                        className="p-2 border-l border-slate-200 align-top cursor-pointer hover:bg-emerald-50/40 transition-all group"
                      >
                        {cellItem ? (
                          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-right space-y-1 group-hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-950 text-xs truncate">
                                {cellItem.subject}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {viewMode === 'teacher'
                                ? `${cellItem.grade} (${cellItem.classroom})`
                                : cellItem.teacherName}
                            </div>
                            {cellItem.roomNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {cellItem.roomNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-16 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-emerald-300 group-hover:text-emerald-600 transition-all">
                            <Plus className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Schedule Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingItem.id?.startsWith('SCH-') ? 'تعديل بيانات الحصة' : 'إضافة حصة جديدة للجدول'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    يوم {editingItem.dayOfWeek || editingItem.dayName} • الحصة رقم {editingItem.periodNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="p-6 space-y-4">
              {modalConflictWarning && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900 text-xs font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalConflictWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
                  <select
                    value={editingItem.grade}
                    onChange={e => setEditingItem({ ...editingItem, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {dynamicGrades.map(g => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفصل</label>
                  <select
                    value={editingItem.classroom}
                    onChange={e => setEditingItem({ ...editingItem, classroom: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {dynamicClassrooms.map(c => (
                      <option key={c} value={c}>
                        فصل {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية</label>
                <select
                  value={editingItem.subject}
                  onChange={e => setEditingItem({ ...editingItem, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {dynamicSubjects.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">معلم المادة</label>
                <select
                  value={editingItem.teacherId}
                  onChange={e => {
                    const t = teachers.find(emp => emp.id === e.target.value);
                    setEditingItem({
                      ...editingItem,
                      teacherId: e.target.value,
                      teacherName: t?.name || '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.jobTitle || 'معلم'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القاعة / المعمل</label>
                  <input
                    type="text"
                    value={editingItem.roomNumber || ''}
                    onChange={e => setEditingItem({ ...editingItem, roomNumber: e.target.value })}
                    placeholder="مثال: قاعة 101 أو معمل الحاسب"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التوقيت</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingItem.startTime || '08:00'}
                      onChange={e => setEditingItem({ ...editingItem, startTime: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-mono"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={editingItem.endTime || '08:45'}
                      onChange={e => setEditingItem({ ...editingItem, endTime: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {editingItem.id && !editingItem.id.startsWith('SCH-') ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editingItem.id!)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحصة</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    حفظ الحصة في الجدول
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      <SchedulePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title={matrixTitle}
        subtitle={`العام الدراسي ${settings.currentAcademicYear || '2026/2027'} - وزارة التربية والتعليم`}
        items={matrixItems}
        days={daysOfWeek}
        periods={periods}
        scheduleConfig={scheduleConfig}
        settings={settings}
      />
    </div>
  );
};
