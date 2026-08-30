import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  GraduationCap,
  HeartHandshake,
  Mail,
  Phone,
  Printer,
  Search,
  Shield,
  User,
} from 'lucide-react';
import { Student } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianCurrency, formatEgyptianDate, getCairoCurrentDate } from '../../utils/egyptianTime';

export const ParentPortalView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'attendance' | 'behavior' | 'schedule' | 'homework'>('overview');

  const students = storageService.getStudents();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const match = students.find(
      s =>
        s.studentCode.toLowerCase() === query ||
        s.name.toLowerCase().includes(query) ||
        (s.nationalId && s.nationalId === query) ||
        (s.parentPhone && s.parentPhone.includes(query))
    );

    if (match) {
      setSelectedStudent(match);
    } else {
      alert('لم يتم العثور على طالب مطابق لبيانات البحث (كود الطالب أو الرقم القومي أو هاتف ولي الأمر)');
    }
  };

  const attendanceRecords = selectedStudent
    ? storageService
        .getStudentAttendance()
        .filter(a => a.studentId === selectedStudent.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const behaviorScore = selectedStudent ? storageService.calculateStudentBehaviorScore(selectedStudent.id) : null;
  const violations = selectedStudent
    ? storageService
        .getBehaviorViolations()
        .filter(v => v.studentId === selectedStudent.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  const schedule = selectedStudent
    ? storageService
        .getSchedule()
        .filter(s => s.grade === selectedStudent.grade && (!s.classroom || s.classroom === selectedStudent.classroom))
    : [];

  const lessonCoverage = selectedStudent
    ? storageService
        .getLessonContents()
        .filter(l => l.grade === selectedStudent.grade && (!l.classroom || l.classroom === selectedStudent.classroom))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span>بوابة ولي الأمر للمتابعة والتقارير المدرسية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة فورية للحضور، السلوك والانضباط، الدروس المشروحة والواجبات، وطباعة كشف المتابعة
          </p>
        </div>

        {selectedStudent && (
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4 text-[#008e8b]" />
            <span>طباعة بطاقة متابعة الطالب</span>
          </button>
        )}
      </div>

      {/* Student Lookup Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-3 text-center">
          <h3 className="text-sm font-bold text-slate-800">
            البحث عن بيانات الطالب وولي الأمر
          </h3>
          <p className="text-xs text-slate-500">
            أدخل كود الطالب، أو الرقم القومي، أو رقم هاتف ولي الأمر، أو اسم الطالب:
          </p>

          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="كود الطالب أو الرقم القومي أو هاتف ولي الأمر..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              بحث
            </button>
          </div>

          {/* Quick Select demo pills if students exist */}
          {students.length > 0 && !selectedStudent && (
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500">
              <span>طلاب متاحون للتجربة السريعة:</span>
              {students.slice(0, 3).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudent(s);
                    setSearchQuery(s.name);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-[#008e8b] rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
                >
                  {s.name} ({s.studentCode})
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Selected Student Dashboard View */}
      {selectedStudent && (
        <div className="space-y-6 animate-fade-in">
          {/* Student Profile Card */}
          <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-teal-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-2xl font-bold text-teal-300">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                  <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-0.5 rounded-full text-xs font-mono">
                    {selectedStudent.studentCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{selectedStudent.stage}</span>
                  <span>•</span>
                  <span>{selectedStudent.grade}</span>
                  <span>•</span>
                  <span className="font-bold text-teal-200 bg-teal-900/50 px-2 py-0.5 rounded-md">
                    فصل {selectedStudent.classroom}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <div className="text-right">
                <span className="text-[11px] text-slate-300 block">درجة الانضباط السلوكي:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {behaviorScore?.currentScore || 100} / 100
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-right">
                <span className="text-[11px] text-slate-300 block">ولي الأمر:</span>
                <span className="text-xs font-bold text-white">{selectedStudent.parentName}</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSubTab === 'overview' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ملخص المتابعة الشامل
            </button>
            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSubTab === 'attendance' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل الحضور والغياب ({attendanceRecords.length})
            </button>
            <button
              onClick={() => setActiveSubTab('behavior')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSubTab === 'behavior' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              لائحة السلوك والمخالفات ({violations.length})
            </button>
            <button
              onClick={() => setActiveSubTab('homework')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSubTab === 'homework' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الدروس المشروحة والواجبات ({lessonCoverage.length})
            </button>
            <button
              onClick={() => setActiveSubTab('schedule')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSubTab === 'schedule' ? 'bg-[#008e8b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الجدول المدرسي للحصص
            </button>
          </div>

          {/* Sub Tab: Overview */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Attendance quick box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#008e8b]" />
                  <span>مؤشر الحضور والمواظبة</span>
                </h4>
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-teal-800 font-semibold block">إجمالي أيام الحضور:</span>
                    <span className="text-2xl font-bold font-mono text-[#008e8b]">
                      {attendanceRecords.filter(a => a.status === 'حاضر').length} يوم
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-rose-700 font-semibold block">أيام الغياب:</span>
                    <span className="text-2xl font-bold font-mono text-rose-600">
                      {attendanceRecords.filter(a => a.status.includes('غائب')).length} يوم
                    </span>
                  </div>
                </div>
              </div>

              {/* Behavior quick box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>التقييم والانضباط الأخلاقي</span>
                </h4>
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-800 font-semibold block">الرصيد المتبقي:</span>
                    <span className="text-2xl font-bold font-mono text-amber-700">
                      {behaviorScore?.currentScore} / 100
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 font-semibold block">الحالة العامة:</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                      {behaviorScore?.statusText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#008e8b]" />
                  <span>قنوات التواصل مع إدارة المدرسة</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">هاتف إدارة شؤون الطلاب:</span>
                    <span className="font-bold text-slate-800 font-mono">02-24156789</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">الخط الساخن للمتابعة:</span>
                    <span className="font-bold text-slate-800 font-mono">19876</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Homework & Lessons */}
          {activeSubTab === 'homework' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">المعلم</th>
                    <th className="p-4">الدرس المشروح في الفصل</th>
                    <th className="p-4">الواجب والتكليف المنزلي المطلوب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lessonCoverage.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        لا توجد دروس أو تكليفات مسجلة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    lessonCoverage.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-slate-700">{formatEgyptianDate(l.date)}</td>
                        <td className="p-4 font-bold text-[#008e8b]">{l.subject}</td>
                        <td className="p-4 text-slate-700">{l.teacherName}</td>
                        <td className="p-4 font-semibold text-slate-800">{l.lessonTitle}</td>
                        <td className="p-4 font-medium text-amber-900 bg-amber-50/40 rounded-lg">{l.homework || 'لا يوجد واجب'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab: Attendance */}
          {activeSubTab === 'attendance' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">اليوم</th>
                    <th className="p-4">حالة الحضور</th>
                    <th className="p-4">وقت الحضور</th>
                    <th className="p-4">التأخير</th>
                    <th className="p-4">بيان العذر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد سجلات حضور مسجلة
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-slate-700">{formatEgyptianDate(a.date)}</td>
                        <td className="p-4 text-slate-700">{a.dayName}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              a.status === 'حاضر'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'متأخر'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-700">{a.checkInTime || '—'}</td>
                        <td className="p-4 font-mono text-slate-700">{a.lateMinutes ? `${a.lateMinutes} دقيقة` : '—'}</td>
                        <td className="p-4 text-slate-600">{a.absenceReason || a.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab: Behavior */}
          {activeSubTab === 'behavior' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">المخالفة</th>
                    <th className="p-4">درجة المخالفة</th>
                    <th className="p-4">حسم النقاط</th>
                    <th className="p-4">الإجراء المتخذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-emerald-600 font-semibold">
                        سجل الطالب خالٍ تماماً من أي مخالفات انضباطية.
                      </td>
                    </tr>
                  ) : (
                    violations.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-slate-700">{formatEgyptianDate(v.date)}</td>
                        <td className="p-4 font-bold text-slate-800">{v.violationName}</td>
                        <td className="p-4">{v.severity}</td>
                        <td className="p-4 font-mono font-bold text-rose-600">-{v.pointsDeducted} نقطة</td>
                        <td className="p-4 text-slate-700">{v.actionTaken || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab: Schedule */}
          {activeSubTab === 'schedule' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">اليوم</th>
                    <th className="p-4">رقم الحصة</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">المعلم</th>
                    <th className="p-4">الموعد</th>
                    <th className="p-4">القاعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لم يتم تسجيل جدول حصص لهذا الصف بعد
                      </td>
                    </tr>
                  ) : (
                    schedule.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{s.dayName}</td>
                        <td className="p-4 font-mono font-bold text-[#008e8b]">الحصة {s.periodNumber}</td>
                        <td className="p-4 font-bold text-slate-800">{s.subject}</td>
                        <td className="p-4 text-slate-700">{s.teacherName}</td>
                        <td className="p-4 font-mono text-slate-600">{s.startTime} - {s.endTime}</td>
                        <td className="p-4 text-slate-600">{s.roomNumber || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
