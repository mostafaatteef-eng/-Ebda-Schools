import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  StudentAttendanceRules,
  StudentAttendanceStatusConfig,
  SystemSettings,
  TeacherAttendanceRules,
} from '../../types';
import {
  DEFAULT_STUDENT_ATTENDANCE_RULES,
  DEFAULT_STUDENT_ATTENDANCE_STATUSES,
  DEFAULT_TEACHER_ATTENDANCE_RULES,
} from '../../data/initialData';
import { storageService } from '../../services/storageService';

interface AttendanceRulesTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const AttendanceRulesTab: React.FC<AttendanceRulesTabProps> = ({ formData, setFormData }) => {
  const [subSection, setSubSection] = useState<'student_statuses' | 'student_rules' | 'teacher_rules'>('student_statuses');

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StudentAttendanceStatusConfig | null>(null);
  const [statusForm, setStatusForm] = useState<Partial<StudentAttendanceStatusConfig>>({
    name: '',
    shortCode: '',
    color: '#10b981',
    countsAsPresent: true,
    countsAsAbsent: false,
    requiresReason: false,
    requiresTime: false,
    isActive: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const statuses = formData.studentAttendanceStatuses || DEFAULT_STUDENT_ATTENDANCE_STATUSES;
  const studentRules = formData.studentAttendanceRules || DEFAULT_STUDENT_ATTENDANCE_RULES;
  const teacherRules = formData.teacherAttendanceRules || DEFAULT_TEACHER_ATTENDANCE_RULES;

  // ---------------- Status Handlers ----------------
  const handleOpenAddStatus = () => {
    setEditingStatus(null);
    setStatusForm({
      name: '',
      shortCode: '',
      color: '#10b981',
      countsAsPresent: true,
      countsAsAbsent: false,
      requiresReason: false,
      requiresTime: false,
      isActive: true,
    });
    setIsStatusModalOpen(true);
  };

  const handleOpenEditStatus = (status: StudentAttendanceStatusConfig) => {
    setEditingStatus(status);
    setStatusForm({ ...status });
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.name?.trim()) return;

    let updatedStatuses: StudentAttendanceStatusConfig[];
    if (editingStatus) {
      updatedStatuses = statuses.map(s =>
        s.id === editingStatus.id ? ({ ...s, ...statusForm } as StudentAttendanceStatusConfig) : s
      );
      showNotif(`تم تحديث حالة الحضور: ${statusForm.name}`);
    } else {
      const newStatus: StudentAttendanceStatusConfig = {
        id: `STAT_${Date.now()}`,
        name: statusForm.name!.trim(),
        shortCode: statusForm.shortCode?.trim() || statusForm.name!.trim().slice(0, 2).toUpperCase(),
        color: statusForm.color || '#10b981',
        countsAsPresent: !!statusForm.countsAsPresent,
        countsAsAbsent: !!statusForm.countsAsAbsent,
        requiresReason: !!statusForm.requiresReason,
        requiresTime: !!statusForm.requiresTime,
        isActive: statusForm.isActive !== undefined ? statusForm.isActive : true,
      };
      updatedStatuses = [...statuses, newStatus];
      showNotif(`تمت إضافة حالة الحضور الجديدة: ${newStatus.name}`);
    }

    setFormData(prev => ({ ...prev, studentAttendanceStatuses: updatedStatuses }));
    setIsStatusModalOpen(false);
  };

  const handleDeleteStatus = (status: StudentAttendanceStatusConfig) => {
    if (statuses.length <= 2) {
      alert('يجب الإبقاء على حالتي حضور وغياب على الأقل');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف حالة "${status.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        studentAttendanceStatuses: statuses.filter(s => s.id !== status.id),
      }));
      showNotif(`تم حذف حالة "${status.name}"`);
    }
  };

  return (
    <div className="space-y-6" id="attendance_rules_container">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubSection('student_statuses')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'student_statuses'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            حالات حضور الطلاب ({statuses.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('student_rules')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'student_rules'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            قواعد وضوابط حضور الطلاب
          </button>

          <button
            type="button"
            onClick={() => setSubSection('teacher_rules')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'teacher_rules'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            قواعد دوام المعلمين والعاملين
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('هل تريد استعادة قواعد الحضور الافتراضية؟')) {
              storageService.resetSettingsSection('studentAttendanceStatuses');
              storageService.resetSettingsSection('studentAttendanceRules');
              storageService.resetSettingsSection('teacherAttendanceRules');
              setFormData(storageService.getSettings());
              showNotif('تمت استعادة قواعد الحضور الافتراضية بنجاح');
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          استعادة الافتراضي
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* ---------------- Sub-Section: Student Statuses ---------------- */}
      {subSection === 'student_statuses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                دليل حالات حضور وغياب الطلاب
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تخصيص الحالات (حاضر، متأخر، مأذون...)، الترميز اللوني، واحتساب نسب الحضور والغياب
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddStatus}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة حالة حضور جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.map((stat, idx) => (
              <div
                key={stat.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden space-y-3"
              >
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: stat.color || '#10b981' }}
                />
                <div className="flex justify-between items-start mt-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color || '#10b981' }}
                    />
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{stat.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    كود: {stat.shortCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    {stat.countsAsPresent ? (
                      <span className="text-emerald-600 font-semibold">✓ يُحتسب حضوراً</span>
                    ) : (
                      <span className="text-slate-400">✗ لا يُحتسب حضوراً</span>
                    )}
                  </div>
                  <div>
                    {stat.countsAsAbsent ? (
                      <span className="text-rose-600 font-semibold">! يُحتسب غياباً</span>
                    ) : (
                      <span className="text-slate-400">○ ليس غياباً</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  {stat.requiresTime && <p>• يتطلب تسجيل وقت الدخول/الخروج</p>}
                  {stat.requiresReason && <p>• يتطلب إدخال سبب رسمي أو عذر</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className={stat.isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {stat.isActive ? 'مفعلة بالنظام' : 'معطلة'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStatus(stat)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStatus(stat)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Student Attendance Rules ---------------- */}
      {subSection === 'student_rules' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              ضوابط وقواعد حضور وغياب الطلاب
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد توقيتات الطابور الصباحي، مهلة التأخير، وصلاحيات التعديل</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                موعد طابور الصباح الرسمي
              </label>
              <input
                type="time"
                value={studentRules.startTime || '07:45'}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    studentAttendanceRules: {
                      ...studentRules,
                      startTime: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">يُحتسب الطالب متأخراً إذا دخل بعد هذا الوقت + فترة السماح</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                فترة السماح الصباحية (دقائق)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={studentRules.gracePeriodMinutes || 15}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    studentAttendanceRules: {
                      ...studentRules,
                      gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                حد التأخير الأقصى (دقائق)
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={studentRules.lateThresholdMinutes || 30}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    studentAttendanceRules: {
                      ...studentRules,
                      lateThresholdMinutes: parseInt(e.target.value, 10) || 30,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">بعد هذا الحد يُعتبر غياباً كاملاً لليوم</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">صلاحيات وضوابط التعديل للمعلمين وشؤون الطلاب</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={studentRules.allowTeacherTakeAttendance !== false}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      studentAttendanceRules: {
                        ...studentRules,
                        allowTeacherTakeAttendance: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    السماح للمعلم برصد حضور الفصل مباشرة
                  </span>
                  <span className="text-[11px] text-slate-500">
                    يمكن للمعلم فتح شاشة الحضور ورصد طلاب حصته مباشرة من بوابته
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={studentRules.allowPastDaysEdit !== false}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      studentAttendanceRules: {
                        ...studentRules,
                        allowPastDaysEdit: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded text-teal-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    السماح بتعديل حضور الأيام السابقة
                  </span>
                  <span className="text-[11px] text-slate-500">
                    يمكن تعديل السجلات السابقة بحد أقصى {studentRules.maxPastDaysEditLimit || 3} أيام
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Teacher Attendance Rules ---------------- */}
      {subSection === 'teacher_rules' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              ضوابط دوام المعلمين والكادر الإداري
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد ساعات العمل الرسمية، فترات السماح، وحسابات التأخير والإضافي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                بداية الدوام الرسمي
              </label>
              <input
                type="time"
                value={teacherRules.workStartTime || '07:30'}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    teacherAttendanceRules: {
                      ...teacherRules,
                      workStartTime: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نهاية الدوام الرسمي
              </label>
              <input
                type="time"
                value={teacherRules.workEndTime || '14:30'}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    teacherAttendanceRules: {
                      ...teacherRules,
                      workEndTime: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                فترة السماح (دقائق)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={teacherRules.gracePeriodMinutes || 15}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    teacherAttendanceRules: {
                      ...teacherRules,
                      gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ساعات العمل اليومية
              </label>
              <input
                type="number"
                min={4}
                max={12}
                value={teacherRules.standardDailyHours || 7}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    teacherAttendanceRules: {
                      ...teacherRules,
                      standardDailyHours: parseInt(e.target.value, 10) || 7,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Status Form ---------------- */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                {editingStatus ? 'تعديل حالة الحضور' : 'إضافة حالة حضور جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الحالة المعروض *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حاضر، غائب، متأخر..."
                  value={statusForm.name || ''}
                  onChange={e => setStatusForm({ ...statusForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكود المختصر (حرف/رمز)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="مثال: P, A, L"
                    value={statusForm.shortCode || ''}
                    onChange={e => setStatusForm({ ...statusForm, shortCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اللون المميز
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={statusForm.color || '#10b981'}
                      onChange={e => setStatusForm({ ...statusForm, color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-slate-500">{statusForm.color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!statusForm.countsAsPresent}
                    onChange={e => setStatusForm({ ...statusForm, countsAsPresent: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>تحتسب هذه الحالة كحضور في الإحصائيات والتقارير</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!statusForm.countsAsAbsent}
                    onChange={e => setStatusForm({ ...statusForm, countsAsAbsent: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>تحتسب هذه الحالة كغياب في الإحصائيات والتقارير</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!statusForm.requiresReason}
                    onChange={e => setStatusForm({ ...statusForm, requiresReason: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>إلزامية إدخال سبب / عذر عند اختيار هذه الحالة</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ الحالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
