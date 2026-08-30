import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { Student, StudentAttendanceRecord, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface StudentAffairsDashboardProps {
  settings: SystemSettings;
  currentUser: User | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const StudentAffairsDashboard: React.FC<StudentAffairsDashboardProps> = ({
  settings,
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');

  const students = useMemo(() => storageService.getStudents(), []);
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Active' || s.status === 'نشط'), [students]);
  const studentAttendance = useMemo(() => storageService.getStudentAttendance(), []);
  const todayRecords = useMemo(() => studentAttendance.filter(r => r.date === selectedDate), [studentAttendance, selectedDate]);

  // Statistics
  const recordedCount = todayRecords.length;
  const totalActive = activeStudents.length;
  const unrecordedCount = Math.max(0, totalActive - recordedCount);
  const completionPercentage = totalActive > 0 ? Math.round((recordedCount / totalActive) * 100) : 0;

  const presentCount = todayRecords.filter(r => r.status === 'حاضر').length;
  const lateCount = todayRecords.filter(r => r.status === 'متأخر').length;
  const absentCount = todayRecords.filter(r => r.status.includes('غائب')).length;
  const excusedCount = todayRecords.filter(r => r.status === 'غائب بعذر' || r.status === 'مأذون' || r.status === 'مريض').length;

  // Breakdown by Grade & Classroom
  const stages = settings.stages || [];
  const allClassrooms = useMemo(() => {
    const list: {
      gradeId: string;
      gradeName: string;
      classroomName: string;
      totalStudents: number;
      recordedStudents: number;
      missingStudents: number;
      present: number;
      absent: number;
      late: number;
    }[] = [];

    stages.forEach(stg => {
      stg.grades.forEach(grd => {
        grd.classrooms.forEach(cls => {
          const classStudents = activeStudents.filter(s => s.grade === grd.name && s.classroom === cls);
          const classRecords = todayRecords.filter(r => r.grade === grd.name && r.classroom === cls);
          const present = classRecords.filter(r => r.status === 'حاضر').length;
          const late = classRecords.filter(r => r.status === 'متأخر').length;
          const absent = classRecords.filter(r => r.status.includes('غائب')).length;

          list.push({
            gradeId: grd.id,
            gradeName: grd.name,
            classroomName: cls,
            totalStudents: classStudents.length,
            recordedStudents: classRecords.length,
            missingStudents: Math.max(0, classStudents.length - classRecords.length),
            present,
            absent,
            late,
          });
        });
      });
    });

    return list;
  }, [stages, activeStudents, todayRecords]);

  const filteredClassrooms = useMemo(() => {
    if (selectedGradeFilter === 'ALL') return allClassrooms;
    return allClassrooms.filter(c => c.gradeName === selectedGradeFilter);
  }, [allClassrooms, selectedGradeFilter]);

  // Students with high absence (> 3 days)
  const highAbsenceStudents = useMemo(() => {
    const studentAbsenceMap = new Map<string, number>();
    studentAttendance.forEach(a => {
      if (a.status.includes('غائب')) {
        studentAbsenceMap.set(a.studentId, (studentAbsenceMap.get(a.studentId) || 0) + 1);
      }
    });

    return activeStudents
      .map(s => ({
        ...s,
        absentDays: studentAbsenceMap.get(s.id) || 0,
      }))
      .filter(s => s.absentDays >= 3)
      .sort((a, b) => b.absentDays - a.absentDays)
      .slice(0, 5);
  }, [activeStudents, studentAttendance]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'مسؤول شؤون الطلاب';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">لوحة تحكم شؤون الطلاب</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-[#008e8b] border border-teal-200">
                متابعة الحضور والتسجيل اليومي
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مرحباً {currentUser?.fullName} — رصد نسب إنجاز الفصول، الحالات الخاصة، والإنذارات الأكاديمية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{getEgyptianDayName(selectedDate)}، {formatEgyptianDate(selectedDate)}</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20"
          />
        </div>
      </div>

      {/* Daily Progress Completion Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#008e8b]" />
            <span className="font-bold text-slate-900 text-sm">معدل إنجاز رصد الحضور المدرسي اليوم</span>
          </div>
          <div className="text-xs font-black text-slate-700">
            تم رصد <span className="text-[#008e8b] font-black">{recordedCount}</span> من أصل <span className="font-black">{totalActive}</span> طالب ({completionPercentage}%)
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
          <div
            className="bg-[#008e8b] h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, completionPercentage)}%` }}
          />
        </div>

        {unrecordedCount > 0 && (
          <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>يوجد {unrecordedCount} طالب لم يتم تأكيد حضورهم أو غيابهم حتى الآن.</span>
            </div>
            <button
              onClick={() => onNavigate('student_attendance')}
              className="font-bold underline hover:text-amber-900 cursor-pointer"
            >
              استكمال الرصد الآن
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold">إجمالي الطلاب المقيدين</div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalActive}</div>
          <div className="text-[10px] text-slate-400 mt-1">طالب نشط بالعام الحالي</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] text-emerald-700 font-bold">حاضر في الموعد</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-600 mt-1">انتظام كامل</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <div className="text-[11px] text-amber-700 font-bold">تأخر صباحي</div>
          <div className="text-xl font-black text-amber-600 mt-1">{lateCount}</div>
          <div className="text-[10px] text-amber-600 mt-1">تأخر بعد الطابور</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold">إجمالي الغياب</div>
          <div className="text-xl font-black text-rose-600 mt-1">{absentCount}</div>
          <div className="text-[10px] text-rose-600 mt-1">غياب اليوم</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <div className="text-[11px] text-blue-700 font-bold">غياب بعذر / مأذون</div>
          <div className="text-xl font-black text-blue-600 mt-1">{excusedCount}</div>
          <div className="text-[10px] text-blue-600 mt-1">عذر رسمي مقبول</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>إجراءات سريعة:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('student_attendance')}
            className="px-3 py-1.5 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>تسجيل حضور الطلاب</span>
          </button>

          <button
            onClick={() => onNavigate('students', { action: 'new' })}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#008e8b]" />
            <span>إضافة طالب جديد</span>
          </button>

          <button
            onClick={() => onNavigate('students')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>البحث في سجل الطلاب</span>
          </button>

          <button
            onClick={() => onNavigate('student_attendance')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>تقارير الحضور والغياب</span>
          </button>
        </div>
      </div>

      {/* Classroom Status Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#008e8b]" />
            <h2 className="font-bold text-slate-900 text-sm">حالة الرصد حسب الفصول الدراسية</h2>
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">تصفية حسب الصف:</span>
            <select
              value={selectedGradeFilter}
              onChange={e => setSelectedGradeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">جميع الصفوف الدراسية</option>
              {stages.flatMap(stg => stg.grades).map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredClassrooms.map((cls, idx) => {
            const isCompleted = cls.totalStudents > 0 && cls.missingStudents === 0;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isCompleted ? 'border-emerald-200 shadow-xs' : cls.missingStudents > 0 ? 'border-amber-200 shadow-xs' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{cls.gradeName}</h3>
                    <div className="text-xs font-bold text-[#008e8b] mt-0.5">{cls.classroomName}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : cls.missingStudents > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'مكتمل الرصد ✓' : `${cls.missingStudents} غير مرصود`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded-lg p-1.5">
                    <div className="text-[10px] text-slate-400 font-bold">الطلاب</div>
                    <div className="text-xs font-black text-slate-800">{cls.totalStudents}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-1.5">
                    <div className="text-[10px] text-emerald-600 font-bold">حاضر</div>
                    <div className="text-xs font-black text-emerald-700">{cls.present}</div>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-1.5">
                    <div className="text-[10px] text-rose-600 font-bold">غائب</div>
                    <div className="text-xs font-black text-rose-700">{cls.absent}</div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('student_attendance', { grade: cls.gradeName, classroom: cls.classroomName })}
                  className="w-full py-2 bg-slate-50 hover:bg-[#008e8b] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>فتح شاشة الحضور للفصل</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Absence Alert Table */}
      {highAbsenceStudents.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-sm">تنبيهات الغياب المتكرر (3 أيام فأكثر)</h2>
            </div>
            <span className="text-xs text-rose-600 font-bold">يتطلب إنذار رسمي أو تواصل مع ولي الأمر</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-100">
                <tr>
                  <th className="p-2.5">اسم الطالب</th>
                  <th className="p-2.5">الصف والفصل</th>
                  <th className="p-2.5 text-center">أيام الغياب</th>
                  <th className="p-2.5">ولي الأمر ورقم الهاتف</th>
                  <th className="p-2.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {highAbsenceStudents.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{st.name}</td>
                    <td className="p-2.5 text-slate-600">{st.grade} — {st.classroom}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700">
                        {st.absentDays} أيام
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{st.parentName} ({st.parentPhone})</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onNavigate('students')}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-[#008e8b] text-[#008e8b] rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        ملف الطالب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
