import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react';
import { Student } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate } from '../../utils/egyptianTime';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

type TabType = 'info' | 'attendance' | 'behavior' | 'schedule' | 'notes';

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (!isOpen || !student) return null;

  const attendanceRecords = storageService
    .getStudentAttendance()
    .filter(a => a.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'حاضر').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'متأخر').length;
  const absentDays = attendanceRecords.filter(a => a.status.includes('غائب')).length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;

  const behaviorScore = storageService.calculateStudentBehaviorScore(student.id);
  const violations = storageService
    .getBehaviorViolations()
    .filter(v => v.studentId === student.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const studentSchedule = storageService
    .getSchedule()
    .filter(s => s.grade === student.grade && (!s.classroom || s.classroom === student.classroom));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-teal-600 via-[#008e8b] to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-bold border border-white/30 shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{student.name}</h2>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-mono">
                  {student.studentCode}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-1 flex items-center gap-2">
                <span>{student.stage}</span>
                <span>•</span>
                <span>{student.grade}</span>
                <span>•</span>
                <span className="font-bold bg-teal-900/40 px-2 py-0.5 rounded-md">فصل: {student.classroom}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors"
              >
                تعديل البيانات
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'info'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>البيانات الأساسية</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'attendance'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>سجل الحضور والغياب</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700">{totalDays}</span>
          </button>

          <button
            onClick={() => setActiveTab('behavior')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'behavior'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>السلوك والانضباط</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${behaviorScore.statusColor}`}>
              {behaviorScore.currentScore} / 100
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'schedule'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الجدول الدراسي</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Data */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-[#008e8b] uppercase tracking-wider flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span>بيانات الطالب المدرسية</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">الرقم القومي:</span>
                    <span className="font-bold text-slate-700 font-mono">{student.nationalId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">النوع:</span>
                    <span className="font-bold text-slate-700">{student.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">تاريخ الميلاد:</span>
                    <span className="font-bold text-slate-700">{formatEgyptianDate(student.birthDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">حالة القيد:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                      {student.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">هاتف الطالب:</span>
                    <span className="font-bold text-slate-700 font-mono">{student.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">العنوان السكني:</span>
                    <span className="font-bold text-slate-700">{student.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Guardian Data */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-[#008e8b] uppercase tracking-wider flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>بيانات ولي الأمر والمتابعة</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500">اسم ولي الأمر:</span>
                    <span className="font-bold text-slate-800">{student.parentName || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500">صلة القرابة:</span>
                    <span className="font-bold text-slate-800">{student.relationship || 'ولي أمر'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#008e8b]" />
                      <span>رقم الهاتف:</span>
                    </span>
                    <span className="font-bold text-slate-800 font-mono">{student.parentPhone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#008e8b]" />
                      <span>البريد الإلكتروني:</span>
                    </span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{student.parentEmail || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl">
                  <div className="text-xl font-bold text-[#008e8b] font-mono">{attendanceRate}%</div>
                  <div className="text-[11px] text-teal-800 font-semibold mt-0.5">نسبة الحضور</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-xl font-bold text-emerald-700 font-mono">{presentDays}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">أيام الحضور</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="text-xl font-bold text-amber-700 font-mono">{lateDays}</div>
                  <div className="text-[11px] text-amber-800 font-semibold mt-0.5">مرات التأخير</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-xl font-bold text-rose-700 font-mono">{absentDays}</div>
                  <div className="text-[11px] text-rose-800 font-semibold mt-0.5">أيام الغياب</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">اليوم</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">وقت الحضور</th>
                      <th className="p-3">التأخير (دقيقة)</th>
                      <th className="p-3">السبب / الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          لا توجد سجلات حضور مسجلة لهذا الطالب حتى الآن
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-700">{formatEgyptianDate(r.date)}</td>
                          <td className="p-3 text-slate-600">{r.dayName}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                r.status === 'حاضر'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'متأخر'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">{r.checkInTime || '—'}</td>
                          <td className="p-3 font-mono text-slate-700">{r.lateMinutes ? `${r.lateMinutes} دقيقة` : '—'}</td>
                          <td className="p-3 text-slate-600">{r.absenceReason || r.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BEHAVIOR */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">مؤشر الانضباط والسلوك التراكمي</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    التقييم الحالي بناءً على اللائحة المدرسية ومجموع نقاط المخالفات
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-slate-800">
                      {behaviorScore.currentScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${behaviorScore.statusColor}`}>
                      {behaviorScore.statusText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المخالفة</th>
                      <th className="p-3">النقاط المخصومة</th>
                      <th className="p-3">المسجل</th>
                      <th className="p-3">الإجراء المتخذ</th>
                      <th className="p-3">إخطار ولي الأمر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {violations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-emerald-600 font-medium">
                          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                          سجل الطالب نظيف، لا توجد أي مخالفات سلوكية مسجلة.
                        </td>
                      </tr>
                    ) : (
                      violations.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-700">{formatEgyptianDate(v.date)}</td>
                          <td className="p-3 font-bold text-slate-800">{v.violationName}</td>
                          <td className="p-3 font-mono font-bold text-rose-600">-{v.pointsDeducted} نقطة</td>
                          <td className="p-3 text-slate-600">{v.recordedBy}</td>
                          <td className="p-3 text-slate-700">{v.actionTaken || '—'}</td>
                          <td className="p-3">
                            {v.parentNotified ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">تم الإخطار</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">لم يخطر</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">اليوم</th>
                      <th className="p-3">رقم الحصة</th>
                      <th className="p-3">المادة</th>
                      <th className="p-3">المعلم</th>
                      <th className="p-3">الموعد</th>
                      <th className="p-3">القاعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentSchedule.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          لم يتم إدراج جدول حصص دراسي لهذا الصف حتى الآن
                        </td>
                      </tr>
                    ) : (
                      studentSchedule.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{s.dayName}</td>
                          <td className="p-3 font-mono text-slate-700">الحصة {s.periodNumber}</td>
                          <td className="p-3 font-bold text-[#008e8b]">{s.subject}</td>
                          <td className="p-3 text-slate-700">{s.teacherName || '—'}</td>
                          <td className="p-3 font-mono text-slate-600">{s.startTime} - {s.endTime}</td>
                          <td className="p-3 text-slate-600">{s.roomNumber || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
