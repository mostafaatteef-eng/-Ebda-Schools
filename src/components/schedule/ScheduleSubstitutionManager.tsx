import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Employee, ScheduleItem, ScheduleSubstitution, User } from '../../types';
import { storageService } from '../../services/storageService';
import { getCairoCurrentDate, getCairoNowISO, getEgyptianDayName } from '../../utils/egyptianTime';

interface ScheduleSubstitutionManagerProps {
  currentUser: User | null;
}

export const ScheduleSubstitutionManager: React.FC<ScheduleSubstitutionManagerProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getCairoCurrentDate());
  const [substitutions, setSubstitutions] = useState<ScheduleSubstitution[]>(() => storageService.getSubstitutions());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State
  const [formOriginalTeacherId, setFormOriginalTeacherId] = useState('');
  const [formPeriodNumber, setFormPeriodNumber] = useState<number>(1);
  const [formScheduleItemId, setFormScheduleItemId] = useState('');
  const [formSubstituteTeacherId, setFormSubstituteTeacherId] = useState('');
  const [formReason, setFormReason] = useState('غياب مرضي');
  const [formNotes, setFormNotes] = useState('');

  const employees = storageService.getEmployees();
  const teachers = employees.filter(
    e => (e.department?.includes('تعليم') || e.department?.includes('تدريس') || e.jobTitle?.includes('معلم') || e.isTeacher) && e.status === 'Active'
  );
  const schedule = storageService.getSchedule();
  const scheduleConfig = storageService.getScheduleConfig();
  const periodCount = scheduleConfig.periodCount || 7;

  const reloadData = () => {
    setSubstitutions(storageService.getSubstitutions());
  };

  const dayName = getEgyptianDayName(selectedDate);

  // Original teacher's periods on selected day
  const teacherPeriodsOnDay = useMemo(() => {
    if (!formOriginalTeacherId) return [];
    return schedule.filter(
      s =>
        s.teacherId === formOriginalTeacherId &&
        (s.dayOfWeek === dayName || s.dayName === dayName) &&
        s.isActive !== false
    );
  }, [formOriginalTeacherId, dayName, schedule]);

  // Selected schedule item details
  const selectedScheduleItem = useMemo(() => {
    return teacherPeriodsOnDay.find(s => s.periodNumber === formPeriodNumber);
  }, [teacherPeriodsOnDay, formPeriodNumber]);

  // Available substitute teachers free in this period
  const availableSubstitutes = useMemo(() => {
    if (!formOriginalTeacherId) return [];
    return storageService.getAvailableSubstituteTeachers(
      selectedDate,
      dayName,
      formPeriodNumber,
      formOriginalTeacherId
    );
  }, [selectedDate, dayName, formPeriodNumber, formOriginalTeacherId]);

  const filteredSubstitutions = useMemo(() => {
    return substitutions.filter(s => {
      const matchDate = !selectedDate || s.date === selectedDate;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchDate && matchStatus;
    });
  }, [substitutions, selectedDate, statusFilter]);

  const handleSaveSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOriginalTeacherId || !formSubstituteTeacherId || !selectedScheduleItem) {
      alert('يرجى اختيار المعلم الأصلي، الحصة، والمعلم البديل');
      return;
    }

    const origTeacher = teachers.find(t => t.id === formOriginalTeacherId);
    const subTeacher = teachers.find(t => t.id === formSubstituteTeacherId);

    const newSub: ScheduleSubstitution = {
      id: `SUB-${selectedDate}-P${formPeriodNumber}-${Date.now()}`,
      date: selectedDate,
      scheduleItemId: selectedScheduleItem.id,
      periodNumber: formPeriodNumber,
      dayOfWeek: dayName,
      originalTeacherId: formOriginalTeacherId,
      originalTeacherName: origTeacher?.name || 'المعلم الأصلي',
      substituteTeacherId: formSubstituteTeacherId,
      substituteTeacherName: subTeacher?.name || 'المعلم البديل',
      subject: selectedScheduleItem.subject,
      subjectId: selectedScheduleItem.subjectId,
      grade: selectedScheduleItem.grade,
      gradeId: selectedScheduleItem.gradeId,
      classroom: selectedScheduleItem.classroom,
      classroomId: selectedScheduleItem.classroomId,
      reason: formReason,
      notes: formNotes,
      status: 'Approved',
      assignedBy: currentUser?.fullName || 'شؤون المعلمين',
      createdAt: getCairoNowISO(),
    };

    storageService.saveSubstitution(newSub);
    setIsAddModalOpen(false);
    reloadData();

    // Reset Form
    setFormOriginalTeacherId('');
    setFormSubstituteTeacherId('');
    setFormNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء وحذف تكليف الاحتياطي هذا؟')) {
      storageService.deleteSubstitution(id);
      reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>نظام إدارة وتوزيع حصص الاحتياطي (Teacher Substitution)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            إسناد بدلاء الحصص للمعلمين الغائبين تلقائياً دون المساس بالجدول الأصلي
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إسناد حصة احتياطي</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            {filteredSubstitutions.length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي حصص الاحتياطي اليوم</p>
            <p className="text-sm font-bold text-slate-800">{dayName} ({selectedDate})</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            {filteredSubstitutions.filter(s => s.status === 'Approved' || s.status === 'Completed').length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">الحصص المعتمدة والمنفذة</p>
            <p className="text-sm font-bold text-emerald-700">تغطية مكتملة</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            {teachers.length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">هيئة التدريس النشطة</p>
            <p className="text-sm font-bold text-slate-800">معلمون متاحون للتغطية</p>
          </div>
        </div>
      </div>

      {/* Substitutions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800">
            سجل تكليفات الاحتياطي ({filteredSubstitutions.length})
          </h4>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-bold"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="Approved">معتمدة (Approved)</option>
            <option value="Pending">قيد المراجعة (Pending)</option>
            <option value="Completed">مكتملة (Completed)</option>
          </select>
        </div>

        {filteredSubstitutions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-600" />
            <p className="text-sm font-bold text-slate-700">لا توجد حصص احتياطي مسجلة لهذا التاريخ</p>
            <p className="text-xs text-slate-400 mt-1">جميع المعلمين مسجلون في حصصهم الأصلية بانتظام</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                  <th className="p-3.5">الحصة</th>
                  <th className="p-3.5">الفصل والمادة</th>
                  <th className="p-3.5">المعلم الغائب (الأصلي)</th>
                  <th className="p-3.5">المعلم البديل المكلف</th>
                  <th className="p-3.5">السبب</th>
                  <th className="p-3.5">المسؤول عن الإسناد</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubstitutions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {sub.periodNumber}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{sub.subject}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {sub.grade} - {sub.classroom}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                        {sub.originalTeacherName}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{sub.substituteTeacherName}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{sub.reason}</td>
                    <td className="p-3.5 text-slate-500 text-[11px]">{sub.assignedBy || 'النظام'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="إلغاء التكليف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Substitution Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">إسناد حصة احتياطي لمعلم بديل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تاريخ {selectedDate} ({dayName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubstitution} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. المعلم الغائب (الأصلي) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formOriginalTeacherId}
                  onChange={e => {
                    setFormOriginalTeacherId(e.target.value);
                    setFormSubstituteTeacherId('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">-- اختر المعلم الغائب --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.jobTitle || 'معلم'})
                    </option>
                  ))}
                </select>
              </div>

              {formOriginalTeacherId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. الحصة المراد تغطيتها لهذا المعلم في يوم ({dayName}) <span className="text-rose-500">*</span>
                  </label>
                  {teacherPeriodsOnDay.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
                      هذا المعلم ليس لديه أي حصص مجدولة في يوم {dayName}!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {teacherPeriodsOnDay.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormPeriodNumber(p.periodNumber)}
                          className={`p-2.5 rounded-xl border text-right transition-all ${
                            formPeriodNumber === p.periodNumber
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span>حصة {p.periodNumber}</span>
                            <span className="text-emerald-700">{p.subject}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {p.grade} ({p.classroom})
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formOriginalTeacherId && selectedScheduleItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. المعلم البديل المتاح في الحصة {formPeriodNumber} (فراغ في هذا التوقيت){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  {availableSubstitutes.length === 0 ? (
                    <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
                      لا يوجد معلمون متاحون بدون حصص في هذا التوقيت!
                    </div>
                  ) : (
                    <select
                      required
                      value={formSubstituteTeacherId}
                      onChange={e => setFormSubstituteTeacherId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950"
                    >
                      <option value="">-- اختر المعلم البديل المتاح ({availableSubstitutes.length} متاح) --</option>
                      {availableSubstitutes.map(t => (
                        <option key={t.id} value={t.id}>
                          ✓ {t.name} ({t.jobTitle || 'معلم'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب الاحتياطي</label>
                  <select
                    value={formReason}
                    onChange={e => setFormReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="غياب مرضي">غياب مرضي</option>
                    <option value="إجازة اعتيادية">إجازة اعتيادية</option>
                    <option value="مأمورية رسمية">مأمورية رسمية</option>
                    <option value="ظرف طارئ">ظرف طارئ</option>
                    <option value="تأخر عن الطابور">تأخر عن الطابور</option>
                    <option value="إشراف مدرسي">إشراف مدرسي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="تعليمات للمعلم البديل..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!formSubstituteTeacherId}
                  className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  اعتماد تكليف الاحتياطي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
