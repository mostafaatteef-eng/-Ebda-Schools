import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  AlertTriangle,
  Award,
  ChevronDown,
  User,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame,
  Check,
  Printer,
  Sparkles,
  Search,
  Filter,
  BarChart2,
  ListOrdered,
  CalendarDays,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import {
  ParentDayViewData,
  ParentSafeStudent,
  ParentAttendanceSummary,
} from '../../services/parentService';
import { ParentDayView } from './ParentDayView';
import {
  getCairoCurrentDate,
  getEgyptianDayName,
  formatEgyptianDate,
} from '../../utils/egyptianTime';

interface ParentPortalViewProps {
  currentUser: UserType | null;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dayView' | 'attendance' | 'schedule' | 'homework' | 'behavior'>('dayView');
  const [linkedStudents, setLinkedStudents] = useState<ParentSafeStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [attendanceSummary, setAttendanceSummary] = useState<ParentAttendanceSummary | null>(null);

  useEffect(() => {
    const students = storageService.getParentLinkedStudents(currentUser);
    setLinkedStudents(students);
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedStudentId) {
      const summary = storageService.getParentAttendanceSummary(selectedStudentId, currentUser);
      if (summary.success && summary.data) {
        setAttendanceSummary(summary.data);
      }
    }
  }, [selectedStudentId, currentUser]);

  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId) || linkedStudents[0];

  // 1. Weekly Schedule for selected student
  const weeklySchedule = selectedStudent
    ? storageService
        .getSchedule()
        .filter(s => s.grade === selectedStudent.grade && (!s.classroom || s.classroom === selectedStudent.classroom))
        .sort((a, b) => a.periodNumber - b.periodNumber)
    : [];

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  // 2. All Homeworks for student
  const studentHomeworks = selectedStudent
    ? storageService
        .getHomeworks()
        .filter(
          h =>
            h.grade === selectedStudent.grade &&
            (!h.classroom || h.classroom === selectedStudent.classroom) &&
            (h.status === 'Published' || (h as any).published === true)
        )
    : [];

  // 3. Behavior Violations & Points
  const behaviorViolations = selectedStudent
    ? storageService.getBehaviorViolations().filter(v => v.studentId === selectedStudent.id && v.status === 'معتمدة')
    : [];
  const behaviorLedger = selectedStudent
    ? storageService.getBehaviorLedger(selectedStudent.id)
    : [];
  const behaviorScore = selectedStudent
    ? storageService.calculateStudentBehaviorScore(selectedStudent.id)
    : null;

  const handlePrintFullReport = () => {
    window.print();
  };

  if (linkedStudents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-xs">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-2">بوابة ولي الأمر</h2>
        <p className="text-sm font-bold text-slate-700 mb-2">
          لا يوجد طالب مرتبط بهذا الحساب حالياً.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          يرجى مراجعة إدارة شئون الطلاب بالمدرسة لربط الرقم القومي أو الهاتف بحساب الطالب وتفعيل بيانات المتابعة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200" id="parent-portal-main">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center shrink-0 border border-teal-100 shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">بوابة ولي الأمر للمتابعة والتقارير</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة شاملة للحضور والغياب، الواجبات، السلوك، والجدول الأسبوعي
            </p>
          </div>
        </div>

        {/* Global Student Selector & Print */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {linkedStudents.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-3">
              <User className="w-4 h-4 text-[#008e8b]" />
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {linkedStudents.map(std => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.grade} - {std.classroom})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrintFullReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="طباعة كشف المتابعة الشامل"
          >
            <Printer className="w-4 h-4 text-[#008e8b]" />
            <span>طباعة تقرير شامل</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dayView')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'dayView'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>اليوم الدراسي</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل الحضور والغياب</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>الجدول الأسبوعي</span>
        </button>

        <button
          onClick={() => setActiveTab('homework')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'homework'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الواجبات والتكليفات</span>
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'behavior'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>السلوك والانضباط</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dayView' && (
        <ParentDayView currentUser={currentUser} />
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance KPI Cards */}
          {attendanceSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-right">
                <span className="text-[11px] font-bold text-slate-500">نسبة الحضور التراكمية</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {attendanceSummary.attendanceRate}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">من إجمالي {attendanceSummary.totalSchoolDays} يوم دراسي</div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-right">
                <span className="text-[11px] font-bold text-slate-500">أيام الحضور</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {attendanceSummary.presentDays}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">حضور كامل بطابور الصباح</div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-right">
                <span className="text-[11px] font-bold text-slate-500">أيام الغياب</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {attendanceSummary.absentDays}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ({attendanceSummary.excusedDays} بعذر مقبول)
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-right">
                <span className="text-[11px] font-bold text-slate-500">أيام التأخير الصباحي</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {attendanceSummary.lateDays}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  إجمالي {attendanceSummary.totalLateMinutes} دقيقة تأخير
                </div>
              </div>
            </div>
          )}

          {/* Detailed Attendance Records Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#008e8b]" />
              <span>سجل الحضور اليومي المفصل</span>
            </h3>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">اليوم</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">وقت الحضور</th>
                    <th className="py-3 px-4">دقائق التأخير</th>
                    <th className="py-3 px-4">العذر والملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceSummary && attendanceSummary.records.length > 0 ? (
                    attendanceSummary.records.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{getEgyptianDayName(rec.date)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              rec.status === 'حاضر'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : rec.status === 'متأخر'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : rec.status === 'غائب'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {rec.status} {rec.isExcused ? '(بعذر)' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{rec.checkInTime || '-'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {rec.lateMinutes ? `${rec.lateMinutes} دقيقة` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{rec.excuseReason || rec.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        لا توجد سجلات حضور مسجلة للطالب حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#008e8b]" />
                <span>الجدول الدراسي الأسبوعي</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                الصف: {selectedStudent?.grade} - الفصل: {selectedStudent?.classroom}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {daysOfWeek.map(dayName => {
              const dayLessons = weeklySchedule
                .filter(s => s.dayName === dayName || s.dayOfWeek === dayName)
                .sort((a, b) => a.periodNumber - b.periodNumber);

              return (
                <div key={dayName} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-right">
                  <div className="p-2 rounded-xl bg-[#008e8b] text-white font-black text-xs text-center shadow-xs">
                    {dayName}
                  </div>

                  <div className="space-y-2 mt-2">
                    {dayLessons.length > 0 ? (
                      dayLessons.map(lesson => (
                        <div
                          key={lesson.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-[#008e8b]">حصة {lesson.periodNumber}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lesson.startTime || ''}
                            </span>
                          </div>
                          <div className="font-black text-slate-900 mt-1">{lesson.subject}</div>
                          {lesson.teacherName && (
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              المعلم: {lesson.teacherName}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[11px] text-slate-400">لا توجد حصص</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#008e8b]" />
              <span>دليل الواجبات والتكليفات المدرسية</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              إجمالي {studentHomeworks.length} واجب
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentHomeworks.length > 0 ? (
              studentHomeworks.map(hw => (
                <div
                  key={hw.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-right hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm font-black text-slate-900">{hw.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#008e8b] border border-teal-100">
                          {hw.subject}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          تاريخ الإسناد: {hw.assignedDate}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                      موعد التسليم: {hw.dueDate}
                    </span>
                  </div>

                  {hw.description && (
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      {hw.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                لا توجد واجبات معلنة حالياً.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Behavior Score Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>بطاقة الانضباط السلوكي</span>
            </h3>

            {behaviorScore && (
              <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-3xl text-center space-y-2">
                <div className="text-4xl font-black text-slate-900">
                  {behaviorScore.currentScore} <span className="text-lg text-slate-400">/ 100</span>
                </div>
                <div className="text-xs font-black text-amber-800">
                  التقييم: {behaviorScore.statusText}
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  يُمنح كل طالب رصيد 100 نقطة انضباط سنوياً، ويتم تطبيق الخصومات طبقاً للائحة الانضباط المدرسي المعتمدة.
                </p>
              </div>
            )}
          </div>

          {/* Right 2 Columns: Violations & Positive Awards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Positive Awards */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 text-right">
              <h4 className="text-xs font-black text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>شهادات التميز والشكر الممنوحة للطالب</span>
              </h4>

              {behaviorLedger.filter(l => l.points && l.points > 0).length > 0 ? (
                <div className="space-y-2">
                  {behaviorLedger
                    .filter(l => l.points && l.points > 0)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-950 block">
                            {item.reason || 'تميز سلوكي'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl font-bold font-mono">
                          +{item.points} نقاط
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  لا توجد شهادات تميز مسجلة حديثاً.
                </div>
              )}
            </div>

            {/* Confirmed Violations */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 text-right">
              <h4 className="text-xs font-black text-rose-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>سجل المخالفات المعتمدة والخصومات</span>
              </h4>

              {behaviorViolations.length > 0 ? (
                <div className="space-y-2">
                  {behaviorViolations.map((vio, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-rose-950 block">{vio.violationName}</span>
                        {vio.notes && <p className="text-[11px] text-slate-600 mt-0.5">{vio.notes}</p>}
                        <span className="text-[10px] text-slate-400 font-mono">{vio.date}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-900 rounded-xl font-bold font-mono">
                        -{vio.pointsDeducted} نقاط
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-2xl font-bold">
                  سجل الطالب نظيف تماماً من أي مخالفات معتمدة.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
