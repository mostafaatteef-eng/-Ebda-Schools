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
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  Users,
  X,
  Layers,
  FileText,
  History,
  TrendingUp,
  Activity
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

type TabType = 'info' | 'attendance' | 'behavior' | 'schedule' | 'transfers';

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (!isOpen || !student) return null;

  // Retrieve comprehensive 360 Profile from storageService
  const profile360 = storageService.getStudent360Profile(student.id);

  const enrollments = profile360?.enrollments || [];
  const transfers = profile360?.transfers || [];
  const schoolAttendance = profile360?.schoolAttendance || [];
  const classAttendance = profile360?.classAttendance || [];
  const violations = profile360?.violations || [];
  const ledger = profile360?.ledger || [];
  const positiveLedgers = ledger.filter(l => l.type === 'POSITIVE');
  const stats = profile360?.stats || {
    totalDays: schoolAttendance.length,
    presentDays: schoolAttendance.filter(a => a.status === 'حاضر').length,
    lateDays: schoolAttendance.filter(a => a.status === 'متأخر').length,
    absentDays: schoolAttendance.filter(a => a.status.includes('غائب')).length,
    attendancePercentage: 100,
    currentBehaviorScore: 100,
    behaviorStatusText: 'ممتاز',
    behaviorStatusColor: 'text-emerald-700 bg-emerald-100',
  };

  const studentSchedule = storageService
    .getSchedule()
    .filter(s => s.grade === student.grade && (!s.classroom || s.classroom === student.classroom));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-teal-700 via-[#008e8b] to-indigo-800 text-white flex items-center justify-between">
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
                <span className="text-xs bg-emerald-500/30 text-emerald-100 border border-emerald-300/30 px-2 py-0.5 rounded-md font-bold">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-1 flex items-center gap-2">
                <span>{student.stage}</span>
                <span>•</span>
                <span>{student.grade}</span>
                <span>•</span>
                <span className="font-bold bg-teal-900/40 px-2 py-0.5 rounded-md">فصل: {student.classroom}</span>
                <span>•</span>
                <span>العام: {student.academicYear}</span>
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

        {/* Tabs Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold custom-scrollbar">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'info'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>البيانات وسجل القيود ({enrollments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'attendance'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الحضور والغياب والحصص</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700">{stats.attendancePercentage}%</span>
          </button>

          <button
            onClick={() => setActiveTab('behavior')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'behavior'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>السلوك الشامل 360</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${stats.behaviorStatusColor}`}>
              {stats.currentBehaviorScore} / 100
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'schedule'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الجدول الدراسي</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'transfers'
                ? 'border-[#008e8b] text-[#008e8b] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>الترقيات والتحويلات ({transfers.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* TAB 1: INFO & ENROLLMENTS */}
          {activeTab === 'info' && (
            <div className="space-y-6">
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

              {/* Multi-Year Enrollment History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>سجل القيود عبر السنوات الدراسية (Enrollments History)</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">العام الدراسي</th>
                        <th className="p-3">الصف الدراسي</th>
                        <th className="p-3">الفصل</th>
                        <th className="p-3">الشعبة</th>
                        <th className="p-3">حالة القيد</th>
                        <th className="p-3">تاريخ القيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            لا توجد قيود مسجلة لهذا الطالب
                          </td>
                        </tr>
                      ) : (
                        enrollments.map(enr => (
                          <tr key={enr.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-bold text-slate-900">{enr.academicYearName}</td>
                            <td className="p-3 text-slate-700">{enr.grade}</td>
                            <td className="p-3 font-mono text-slate-600">{enr.classroom}</td>
                            <td className="p-3 text-slate-500">{enr.section || '—'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[11px]">
                                {enr.promotionStatus || enr.status || 'مقيد'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-500">{formatEgyptianDate(enr.enrollmentDate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE (School + Class Attendance) */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl">
                  <div className="text-xl font-bold text-[#008e8b] font-mono">{stats.attendancePercentage}%</div>
                  <div className="text-[11px] text-teal-800 font-semibold mt-0.5">نسبة الحضور العامة</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-xl font-bold text-emerald-700 font-mono">{stats.presentDays}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">أيام الحضور الكامل</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="text-xl font-bold text-amber-700 font-mono">{stats.lateDays}</div>
                  <div className="text-[11px] text-amber-800 font-semibold mt-0.5">مرات التأخير الصباحي</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-xl font-bold text-rose-700 font-mono">{stats.absentDays}</div>
                  <div className="text-[11px] text-rose-800 font-semibold mt-0.5">أيام الغياب</div>
                </div>
              </div>

              {/* School Daily Attendance */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>سجل الحضور والغياب المدرسي اليومي</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">وقت الحضور</th>
                        <th className="p-3">التأخير (دقيقة)</th>
                        <th className="p-3">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schoolAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            لا توجد سجلات حضور مسجلة لهذا الطالب حتى الآن
                          </td>
                        </tr>
                      ) : (
                        schoolAttendance.slice(0, 30).map(r => (
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

              {/* Class Period Attendance Records */}
              {classAttendance.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>رصد حضور الحصص الدراسية (Class Period Attendance)</span>
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">الحصة</th>
                          <th className="p-3">المادة</th>
                          <th className="p-3">المعلم</th>
                          <th className="p-3">حالة الطالب بالحصة</th>
                          <th className="p-3">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classAttendance.slice(0, 20).map(ca => (
                          <tr key={ca.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-700">{formatEgyptianDate(ca.date)}</td>
                            <td className="p-3 font-mono text-slate-700">حصة {ca.periodNumber}</td>
                            <td className="p-3 font-bold text-[#008e8b]">{ca.subject}</td>
                            <td className="p-3 text-slate-600">{ca.teacherName || '—'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ca.status === 'حاضر' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {ca.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{ca.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BEHAVIOR 360 */}
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">مؤشر الانضباط والسلوك التراكمي (Behavior 360)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    التقييم الشامل بناءً على اللائحة المدرسية، النقاط الإيجابية، والمخالفات
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-slate-800">
                      {stats.currentBehaviorScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.behaviorStatusColor}`}>
                      {stats.behaviorStatusText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Positive Behavior Ledger */}
              {positiveLedgers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-600" />
                    <span>سجل النقاط والمحفزات الإيجابية (+Points)</span>
                  </h4>
                  <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-emerald-100/60 text-emerald-900 font-bold">
                        <tr>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">السلوك الإيجابي / المحفز</th>
                          <th className="p-3">النقاط الممنوحة</th>
                          <th className="p-3">المسجل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {positiveLedgers.map(p => (
                          <tr key={p.id}>
                            <td className="p-3 font-mono">{formatEgyptianDate(p.date)}</td>
                            <td className="p-3 font-bold text-emerald-800">{p.reason}</td>
                            <td className="p-3 font-bold text-emerald-600 font-mono">+{p.points} نقطة</td>
                            <td className="p-3 text-slate-600">{p.recordedBy || 'المعلم'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Violations Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>المخالفات وسجل الخصومات (-Points)</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">المخالفة</th>
                        <th className="p-3">الدرجة</th>
                        <th className="p-3">النقاط المخصومة</th>
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
                            <td className="p-3 text-slate-600">{v.severity || 'متوسطة'}</td>
                            <td className="p-3 font-mono font-bold text-rose-600">-{v.pointsDeducted} نقطة</td>
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

          {/* TAB 5: TRANSFERS & PROMOTIONS */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">تاريخ العملية</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">من صف / فصل</th>
                      <th className="p-3">إلى صف / فصل</th>
                      <th className="p-3">السبب / القرار</th>
                      <th className="p-3">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          لا توجد تحويلات سابقة مسجلة لهذا الطالب
                        </td>
                      </tr>
                    ) : (
                      transfers.map(tr => (
                        <tr key={tr.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-700">{formatEgyptianDate(tr.transferDate)}</td>
                          <td className="p-3 font-bold text-indigo-700">{tr.transferType}</td>
                          <td className="p-3 text-slate-600">{tr.fromGrade} ({tr.fromClassroom})</td>
                          <td className="p-3 text-slate-900 font-bold">{tr.toGrade} ({tr.toClassroom})</td>
                          <td className="p-3 text-slate-700">{tr.reason || 'ترحيل سنوي'}</td>
                          <td className="p-3 text-slate-500">{tr.performedBy || 'مدير النظام'}</td>
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
