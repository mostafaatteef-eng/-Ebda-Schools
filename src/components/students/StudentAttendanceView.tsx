import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Download,
  Filter,
  GraduationCap,
  MessageSquare,
  Save,
  Send,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, StudentAttendanceRecord, StudentAttendanceStatus } from '../../types';
import { storageService } from '../../services/storageService';
import {
  formatEgyptianDate,
  getCairoCurrentDate,
  getCairoCurrentTime,
  getEgyptianDayName,
} from '../../utils/egyptianTime';

export const StudentAttendanceView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => getCairoCurrentDate());
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'ALL'>('ALL');

  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>(() =>
    storageService.getStudentAttendance()
  );

  const [tempRecords, setTempRecords] = useState<Record<string, Partial<StudentAttendanceRecord>>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [whatsappModalStudent, setWhatsappModalStudent] = useState<{ student: Student; record: Partial<StudentAttendanceRecord> } | null>(null);

  const settings = storageService.getSettings();
  const stages = settings.stages || [];

  // Filter students by selected classroom/grade
  const targetStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status !== 'نشط') return false;
      const matchStage = selectedStage === 'ALL' || s.stage === selectedStage;
      const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchClassroom = selectedClassroom === 'ALL' || s.classroom === selectedClassroom;
      return matchStage && matchGrade && matchClassroom;
    });
  }, [students, selectedStage, selectedGrade, selectedClassroom]);

  // Current day name in Arabic
  const currentDayName = useMemo(() => {
    return getEgyptianDayName(selectedDate);
  }, [selectedDate]);

  // Merge saved attendance records with temp records
  const getRecordForStudent = (studentId: string): Partial<StudentAttendanceRecord> => {
    if (tempRecords[studentId]) return tempRecords[studentId];
    const saved = attendanceRecords.find(a => a.studentId === studentId && a.date === selectedDate);
    if (saved) return saved;
    // Default
    return {
      studentId,
      date: selectedDate,
      dayName: currentDayName,
      status: 'حاضر',
      checkInTime: '07:45',
      lateMinutes: 0,
    };
  };

  const updateStudentAttendance = (studentId: string, updates: Partial<StudentAttendanceRecord>) => {
    const current = getRecordForStudent(studentId);
    setTempRecords(prev => ({
      ...prev,
      [studentId]: {
        ...current,
        ...updates,
      },
    }));
  };

  const markAllAs = (status: StudentAttendanceStatus) => {
    const newTemp: Record<string, Partial<StudentAttendanceRecord>> = { ...tempRecords };
    targetStudents.forEach(s => {
      newTemp[s.id] = {
        ...getRecordForStudent(s.id),
        studentId: s.id,
        date: selectedDate,
        dayName: currentDayName,
        status,
        checkInTime: status === 'حاضر' ? '07:45' : status === 'متأخر' ? '08:15' : undefined,
        lateMinutes: status === 'متأخر' ? 30 : 0,
      };
    });
    setTempRecords(newTemp);
  };

  const handleSaveAttendance = () => {
    const listToSave: StudentAttendanceRecord[] = targetStudents.map(s => {
      const rec = getRecordForStudent(s.id);
      return {
        id: rec.id || `ATT-STD-${s.id}-${selectedDate}`,
        studentId: s.id,
        studentName: s.name,
        grade: s.grade,
        classroom: s.classroom,
        date: selectedDate,
        dayName: currentDayName,
        status: rec.status || 'حاضر',
        checkInTime: rec.checkInTime,
        lateMinutes: rec.lateMinutes || 0,
        absenceReason: rec.absenceReason,
        absenceCategory: rec.absenceCategory,
        notes: rec.notes,
        recordedBy: storageService.getCurrentUser()?.fullName || 'مشرف الحضور',
        recordedAt: new Date().toISOString(),
      };
    });

    storageService.bulkSaveStudentAttendance(listToSave);
    setAttendanceRecords(storageService.getStudentAttendance());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Quick stats
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    targetStudents.forEach(s => {
      const rec = getRecordForStudent(s.id);
      if (rec.status === 'حاضر') present++;
      else if (rec.status === 'متأخر') late++;
      else if (rec.status === 'غائب بعذر') excused++;
      else if (rec.status === 'غائب بدون عذر' || rec.status === 'هروب') absent++;
    });

    const total = targetStudents.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, late, absent, excused, rate };
  }, [targetStudents, tempRecords, attendanceRecords, selectedDate]);

  const sendWhatsAppNotification = (student: Student, rec: Partial<StudentAttendanceRecord>) => {
    if (!student.parentPhone) {
      alert('رقم هاتف ولي الأمر غير مسجل');
      return;
    }
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const msg = `السيد ولي أمر الطالب/ة (${student.name}) المحترم،\nنحيطكم علماً بأن الطالب قد تم تسجيله [${rec.status}] في مدرسة NTSS بتاريخ ${formatEgyptianDate(selectedDate)}.\nفي حال وجود أي استفسار يرجى التواصل مع إدارة المدرسة.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const exportDailyAttendanceExcel = () => {
    const data = targetStudents.map((s, idx) => {
      const rec = getRecordForStudent(s.id);
      return {
        'م': idx + 1,
        'كود الطالب': s.studentCode,
        'اسم الطالب': s.name,
        'الصف الدراسي': s.grade,
        'الفصل': s.classroom,
        'التاريخ': selectedDate,
        'اليوم': currentDayName,
        'حالة الحضور': rec.status,
        'وقت الحضور': rec.checkInTime || '—',
        'التأخير (دقيقة)': rec.lateMinutes || 0,
        'نوع العذر': rec.absenceCategory || '—',
        'ملاحظات': rec.notes || '—',
        'هاتف ولي الأمر': s.parentPhone,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `حضور_${selectedDate}`);
    XLSX.writeFile(wb, `كشف_حضور_الطلاب_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span>رصد حضور وغياب الطلاب اليومي والحصص</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل الحضور الصباحي، رصد التأخيرات، تنبيهات أولياء الأمور عبر WhatsApp، وتوثيق الأعذار
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportDailyAttendanceExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير كشف اليوم Excel</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ ومزامنة الحضور الآن</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Control */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاريخ اليوم الدراسي
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
              />
              <span className="text-[11px] text-[#008e8b] font-bold mt-1 block">
                يوم: {currentDayName}
              </span>
            </div>
          </div>

          {/* Stage Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setSelectedGrade('ALL');
                setSelectedClassroom('ALL');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع المراحل</option>
              {stages.map(st => (
                <option key={st.id} value={st.name}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassroom('ALL');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع الصفوف</option>
              {stages
                .flatMap(s => s.grades)
                .map(g => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
            </select>
          </div>

          {/* Classroom Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الفصل / الشعبة</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع الفصول</option>
              {Array.from(new Set(students.map(s => s.classroom))).map(c => (
                <option key={c} value={c}>فصل {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Bulk Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-600">إجراء سريع للقائمة المعروضة:</span>
            <button
              onClick={() => markAllAs('حاضر')}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحضير الكل (حاضر)</span>
            </button>
            <button
              onClick={() => markAllAs('غائب بدون عذر')}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>تعيين الكل كغائب</span>
            </button>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>تم حفظ كشف الحضور بنجاح!</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-slate-800 font-mono">{stats.total}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">إجمالي الطلاب</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-emerald-700 font-mono">{stats.present}</div>
          <div className="text-xs text-emerald-800 font-semibold mt-1">حاضرون</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-3xl border border-amber-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-amber-700 font-mono">{stats.late}</div>
          <div className="text-xs text-amber-800 font-semibold mt-1">متأخرون</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-rose-700 font-mono">{stats.absent}</div>
          <div className="text-xs text-rose-800 font-semibold mt-1">غائب بدون عذر</div>
        </div>
        <div className="bg-teal-50 p-4 rounded-3xl border border-teal-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-[#008e8b] font-mono">{stats.rate}%</div>
          <div className="text-xs text-teal-800 font-semibold mt-1">نسبة الحضور اليوم</div>
        </div>
      </div>

      {/* Table of Students Attendance */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">اسم الطالب</th>
                <th className="p-3.5">الصف / الفصل</th>
                <th className="p-3.5">حالة الحضور</th>
                <th className="p-3.5">وقت الحضور</th>
                <th className="p-3.5">التأخير (دقيقة)</th>
                <th className="p-3.5">عذر الغياب / السبب</th>
                <th className="p-3.5 text-center">إخطار ولي الأمر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">لا يوجد طلاب مسجلين في هذا الفصل / الصف</p>
                  </td>
                </tr>
              ) : (
                targetStudents.map((student, idx) => {
                  const rec = getRecordForStudent(student.id);
                  const isAbsent = rec.status?.includes('غائب') || rec.status === 'هروب';
                  const isLate = rec.status === 'متأخر';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{student.studentCode}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-700">{student.grade}</span>
                        <span className="block font-bold text-[#008e8b] text-[11px]">فصل: {student.classroom}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 gap-0.5">
                          <button
                            type="button"
                            onClick={() => updateStudentAttendance(student.id, { status: 'حاضر', lateMinutes: 0, checkInTime: '07:45' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              rec.status === 'حاضر' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentAttendance(student.id, { status: 'متأخر', lateMinutes: 15, checkInTime: '08:00' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              rec.status === 'متأخر' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            متأخر
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentAttendance(student.id, { status: 'غائب بعذر', checkInTime: undefined, lateMinutes: 0 })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              rec.status === 'غائب بعذر' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                            }`}
                          >
                            بعذر
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentAttendance(student.id, { status: 'غائب بدون عذر', checkInTime: undefined, lateMinutes: 0 })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              rec.status === 'غائب بدون عذر' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            غائب
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <input
                          type="time"
                          disabled={isAbsent}
                          value={rec.checkInTime || ''}
                          onChange={(e) => updateStudentAttendance(student.id, { checkInTime: e.target.value })}
                          className="w-24 text-xs font-mono bg-white border border-slate-300 rounded-lg px-2 py-1 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      <td className="p-3.5">
                        <input
                          type="number"
                          min="0"
                          disabled={!isLate}
                          value={rec.lateMinutes || 0}
                          onChange={(e) => updateStudentAttendance(student.id, { lateMinutes: Number(e.target.value) })}
                          className="w-16 text-xs font-mono bg-white border border-slate-300 rounded-lg px-2 py-1 text-center disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      <td className="p-3.5">
                        {isAbsent ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={rec.absenceCategory || 'بدون عذر'}
                              onChange={(e) => updateStudentAttendance(student.id, { absenceCategory: e.target.value as any })}
                              className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700"
                            >
                              <option value="بدون عذر">بدون عذر</option>
                              <option value="مرضي">مرضي (تقرير طبي)</option>
                              <option value="إذن رسمي">إذن رسمي مسبق</option>
                              <option value="عذر قهري">عذر قهري عائلي</option>
                              <option value="أخرى">أخرى</option>
                            </select>
                            <input
                              type="text"
                              placeholder="تفاصيل العذر..."
                              value={rec.absenceReason || ''}
                              onChange={(e) => updateStudentAttendance(student.id, { absenceReason: e.target.value })}
                              className="w-32 text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {isAbsent || isLate ? (
                          <button
                            type="button"
                            onClick={() => sendWhatsAppNotification(student, rec)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-xs transition-colors"
                            title="إرسال إشعار WhatsApp لولي الأمر"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">لا يتطلب إشعار</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
