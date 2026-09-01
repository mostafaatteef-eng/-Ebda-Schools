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
  Activity,
  MessageSquare,
  Plus,
  Printer,
  Sparkles,
  PhoneCall,
  ArrowRightLeft
} from 'lucide-react';
import { Student, ParentCommunicationLog, BehaviorScoreLedger, BehaviorViolation, CommunicationType } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoNowISO } from '../../utils/egyptianTime';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

type TabType = 'info' | 'attendance' | 'behavior' | 'parentComms' | 'transfers' | 'schedule';

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [refreshKey, setRefreshKey] = useState(0);

  // Quick action sub-modals
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commData, setCommData] = useState<{
    type: CommunicationType;
    reason: string;
    details: string;
    result: string;
  }>({
    type: 'مكالمة هاتفية',
    reason: 'متابعة المستوى الأكاديمي والانضباط',
    details: '',
    result: '',
  });

  const [isPositiveScoreModalOpen, setIsPositiveScoreModalOpen] = useState(false);
  const [positiveData, setPositiveData] = useState({
    title: 'مشاركة متميزة والتزام',
    points: 5,
    notes: '',
  });

  if (!isOpen || !student) return null;

  // Retrieve comprehensive 360 Profile from storageService
  const profile360 = storageService.getStudent360Profile(student.id);

  const enrollments = profile360?.enrollments || [];
  const transfers = profile360?.transfers || [];
  const schoolAttendance = profile360?.schoolAttendance || [];
  const classAttendance = profile360?.classAttendance || [];
  const violations = profile360?.violations || [];
  const ledger = profile360?.ledger || [];
  const parentCommunications = profile360?.parentCommunications || [];
  const stats = profile360?.stats || {
    totalDays: schoolAttendance.length,
    presentDays: schoolAttendance.filter(a => a.status === 'حاضر' || a.status === 'متأخر').length,
    lateDays: schoolAttendance.filter(a => a.status === 'متأخر').length,
    absentDays: schoolAttendance.filter(a => a.status.includes('غائب')).length,
    attendancePercentage: 100,
    currentBehaviorScore: 100,
    behaviorStatusText: 'ممتاز',
    behaviorStatusColor: 'text-emerald-700 bg-emerald-100',
    violationsCount: 0,
    positivePoints: 0,
    openCasesCount: 0,
    parentCommunicationsCount: 0,
  };

  const studentSchedule = storageService
    .getSchedule()
    .filter(s => s.grade === student.grade && (!s.classroom || s.classroom === student.classroom));

  const handleSaveParentComm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commData.details.trim()) {
      alert('يرجى كتابة تفاصيل التواصل');
      return;
    }

    const newComm: ParentCommunicationLog = {
      id: `COMM-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName,
      communicationType: commData.type,
      type: commData.type,
      date: getCairoNowISO().split('T')[0],
      reason: commData.reason,
      details: commData.details.trim(),
      result: commData.result.trim() || 'تم التواصل والمتابعة',
      recordedBy: storageService.getCurrentUser()?.fullName || 'الأخصائي الاجتماعي',
      createdAt: getCairoNowISO(),
    };

    storageService.saveParentCommunication(newComm);
    setIsCommModalOpen(false);
    setCommData({ type: 'مكالمة هاتفية', reason: 'متابعة المستوى الأكاديمي والانضباط', details: '', result: '' });
    setRefreshKey(k => k + 1);
  };

  const handleSavePositiveScore = (e: React.FormEvent) => {
    e.preventDefault();
    const ledgerEntry: BehaviorScoreLedger = {
      id: `LEDG-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      type: 'POSITIVE',
      sourceType: 'positive_behavior',
      points: Number(positiveData.points) || 5,
      reason: positiveData.title,
      date: getCairoNowISO().split('T')[0],
      recordedBy: storageService.getCurrentUser()?.fullName || 'المعلم / الإدارة',
      balanceAfter: Math.min(100, (stats.currentBehaviorScore || 100) + Number(positiveData.points)),
      createdAt: getCairoNowISO(),
    };

    storageService.addBehaviorScoreTransaction(ledgerEntry);
    setIsPositiveScoreModalOpen(false);
    setPositiveData({ title: 'مشاركة متميزة والتزام', points: 5, notes: '' });
    setRefreshKey(k => k + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Gradient Header */}
        <div className="p-6 bg-gradient-to-l from-teal-800 via-[#008e8b] to-indigo-800 text-white flex items-center justify-between">
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
            <button
              onClick={handlePrint}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="طباعة السجل الشامل"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تعديل البيانات
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#008e8b]" />
            <span>إجراءات سريعة:</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#008e8b] text-xs font-bold border border-teal-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>تسجيل تواصل مع ولي الأمر</span>
            </button>
            <button
              onClick={() => setIsPositiveScoreModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-emerald-600" />
              <span>إضافة تعزيز سلوكي (+)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-white border-b border-slate-200">
          <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
            <div className="flex items-center justify-between text-xs text-[#008e8b] font-bold">
              <span>نسبة الحضور</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.attendancePercentage}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              حاضر: {stats.presentDays} | غائب: {stats.absentDays} يوم
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center justify-between text-xs text-indigo-700 font-bold">
              <span>رصيد السلوك</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.currentBehaviorScore}/100</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              التقييم: <strong className={stats.behaviorStatusColor}>{stats.behaviorStatusText}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between text-xs text-amber-700 font-bold">
              <span>المخالفات المرصودة</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{violations.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              نقاط إيجابية: +{stats.positivePoints || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center justify-between text-xs text-purple-700 font-bold">
              <span>سجلات التواصل</span>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{parentCommunications.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              سنوات القيد: {enrollments.length || 1}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            البيانات الأساسية والاتصال
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            سجل الحضور والغياب ({schoolAttendance.length})
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'behavior'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الانضباط والتعزيز ({violations.length + ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('parentComms')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'parentComms'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            التواصل مع ولي الأمر ({parentCommunications.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'transfers'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            القيود وحركات النقل ({enrollments.length + transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-[#008e8b] text-[#008e8b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الجدول الأسبوعي
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Basic Info */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-[#008e8b] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>بيانات الطالب الرسمية</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">الاسم الكامل:</span>
                    <span className="font-bold text-slate-800">{student.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">كود الطالب:</span>
                    <span className="font-mono font-bold text-slate-800">{student.studentCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">الرقم القومي:</span>
                    <span className="font-mono text-slate-800">{student.nationalId || 'غير مسجل'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">النوع:</span>
                    <span className="text-slate-800">{student.gender}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">المرحلة والصف:</span>
                    <span className="font-bold text-slate-800">{student.stage} - {student.grade}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">الفصل والشعبة:</span>
                    <span className="font-bold text-[#008e8b]">فصل {student.classroom} {student.section ? `(شعبة ${student.section})` : ''}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">العنوان:</span>
                    <span className="text-slate-800">{student.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Parent info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>بيانات ولي الأمر والمتابعة</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">اسم ولي الأمر:</span>
                    <span className="font-bold text-slate-800">{student.parentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">صلة القرابة:</span>
                    <span className="text-slate-800">{student.relationship || 'ولي أمر'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">هاتف ولي الأمر:</span>
                    <a href={`tel:${student.parentPhone}`} className="font-mono font-bold text-[#008e8b] hover:underline">
                      {student.parentPhone || '—'}
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">هاتف الطالب:</span>
                    <span className="font-mono text-slate-800">{student.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">ملاحظات خاصة:</span>
                    <span className="text-slate-800">{student.notes || 'لا توجد ملاحظات'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">حالة الحضور</th>
                      <th className="p-3">وقت الحضور</th>
                      <th className="p-3">العذر / السبب</th>
                      <th className="p-3">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schoolAttendance.length > 0 ? (
                      schoolAttendance.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-mono">{rec.date}</td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'حاضر'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rec.status === 'متأخر' || rec.status === 'حاضر متأخر'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{rec.checkInTime || '—'}</td>
                          <td className="p-3 text-slate-600">{rec.absenceReason || rec.notes || '—'}</td>
                          <td className="p-3 text-slate-500">{rec.recordedBy || 'مسؤول الحضور'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          لا توجد سجلات حضور مسجلة لهذا الطالب حتى الآن.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Behavior & Discipline */}
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {/* Positive reinforcement ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-emerald-600" />
                    <span>سجل التعزيز والسلوك الإيجابي (+ النقاط)</span>
                  </h4>
                  <button
                    onClick={() => setIsPositiveScoreModalOpen(true)}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    + إضافة تعزيز جديد
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-emerald-50/50 text-emerald-900 font-bold border-b border-emerald-100">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">النوع / النشاط</th>
                        <th className="p-3">النقاط</th>
                        <th className="p-3">الرصيد بعد الإضافة</th>
                        <th className="p-3">المسجل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.filter(l => l.type === 'POSITIVE').length > 0 ? (
                        ledger
                          .filter(l => l.type === 'POSITIVE')
                          .map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-mono">{item.date}</td>
                              <td className="p-3 font-semibold text-slate-800">{item.reason}</td>
                              <td className="p-3 font-mono font-bold text-emerald-600">+{item.points}</td>
                              <td className="p-3 font-mono text-slate-600">{item.balanceAfter}/100</td>
                              <td className="p-3 text-slate-500">{item.recordedBy || 'المدرسة'}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            لا توجد نقاط تعزيز إيجابي مسجلة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Violations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>المخالفات والإجراءات التربوية</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-rose-50/50 text-rose-900 font-bold border-b border-rose-100">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">درجة المخالفة</th>
                        <th className="p-3">وصف المخالفة</th>
                        <th className="p-3">الإجراء المتخذ</th>
                        <th className="p-3">الخصم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {violations.length > 0 ? (
                        violations.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-mono">{v.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {v.severity || 'مخالفة'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{v.violationName}</td>
                            <td className="p-3 text-slate-600">{v.actionTaken || 'تنبيه شفهي'}</td>
                            <td className="p-3 font-mono font-bold text-rose-600">-{v.pointsDeducted || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            سجل الطالب نظيف، لا توجد مخالفات مسجلة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Parent Communications */}
          {activeTab === 'parentComms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">سجل التواصل والمتابعة الدورية مع الأسرة</h4>
                <button
                  onClick={() => setIsCommModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#008e8b] hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل تواصل جديد</span>
                </button>
              </div>

              <div className="space-y-3">
                {parentCommunications.length > 0 ? (
                  parentCommunications.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="px-2 py-0.5 bg-teal-100 text-[#008e8b] rounded-md font-mono">{log.communicationType || log.type}</span>
                          <span>{log.reason}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                        {log.details}
                      </p>
                      {log.result && (
                        <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                          <span>النتيجة والتوصيات:</span>
                          <span>{log.result}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 text-left">
                        المسجل: {log.recordedBy || 'المدرسة'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    لا يوجد سجل تواصل مع ولي الأمر حتى الآن.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Enrollments & Transfers */}
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              {/* Enrollments History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#008e8b]" />
                  <span>سجل القيد الأكاديمي عبر الأعوام</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">العام الدراسي</th>
                        <th className="p-3">الصف</th>
                        <th className="p-3">الفصل</th>
                        <th className="p-3">حالة القيد</th>
                        <th className="p-3">القرار / الترحيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.length > 0 ? (
                        enrollments.map((enr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold font-mono text-[#008e8b]">{enr.academicYearName}</td>
                            <td className="p-3 text-slate-800">{enr.grade}</td>
                            <td className="p-3 font-mono font-semibold">فصل {enr.classroom}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {enr.enrollmentStatus || 'نشط'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{enr.promotionStatus || 'مقيد'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            العام الحالي: {student.academicYear} - {student.grade} ({student.classroom})
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transfers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>حركات النقل وتغيير الفصول</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-indigo-50/50 text-indigo-900 font-bold border-b border-indigo-100">
                      <tr>
                        <th className="p-3">تاريخ النقل</th>
                        <th className="p-3">من فصل</th>
                        <th className="p-3">إلى فصل</th>
                        <th className="p-3">السبب</th>
                        <th className="p-3">المعتمد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transfers.length > 0 ? (
                        transfers.map((trf, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono">{trf.transferDate}</td>
                            <td className="p-3 text-rose-700">{trf.fromGrade} - فصل {trf.fromClassroom}</td>
                            <td className="p-3 font-bold text-emerald-700">{trf.toGrade} - فصل {trf.toClassroom}</td>
                            <td className="p-3 text-slate-700">{trf.reason}</td>
                            <td className="p-3 text-slate-500">{trf.approvedBy || 'شؤون الطلاب'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            لا توجد حركات نقل مسجلة للطالب.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  جدول الحصص الأسبوعي لفصل: <span className="text-[#008e8b] font-bold">{student.grade} - {student.classroom}</span>
                </h4>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">اليوم</th>
                      <th className="p-3">الحصة</th>
                      <th className="p-3">المادة</th>
                      <th className="p-3">المعلم</th>
                      <th className="p-3">القاعة / المعمل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentSchedule.length > 0 ? (
                      studentSchedule.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{s.dayName || s.dayOfWeek}</td>
                          <td className="p-3 font-mono font-bold text-[#008e8b]">الحصة {s.periodNumber}</td>
                          <td className="p-3 font-semibold text-slate-900">{s.subject}</td>
                          <td className="p-3 text-slate-600">{s.teacherName}</td>
                          <td className="p-3 text-slate-500">{s.roomNumber || 'الفصل الأصلي'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          لم يتم تسكين جدول حصص لهذا الفصل حتى الآن.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Modal: Parent Comm */}
        {isCommModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-[#008e8b]" />
                <span>تسجيل تواصل مع ولي أمر: {student.name}</span>
              </h3>

              <form onSubmit={handleSaveParentComm} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">وسيلة التواصل</label>
                  <select
                    value={commData.type}
                    onChange={e => setCommData({ ...commData, type: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="مكالمة هاتفية">مكالمة هاتفية</option>
                    <option value="مقابلة شخصية">مقابلة شخصية بالمدرسة</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="رسالة SMS">رسالة SMS</option>
                    <option value="بريد إلكتروني">بريد إلكتروني</option>
                    <option value="اجتماع رسمي">اجتماع رسمي</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">سبب التواصل</label>
                  <input
                    type="text"
                    required
                    value={commData.reason}
                    onChange={e => setCommData({ ...commData, reason: e.target.value })}
                    placeholder="مثال: متابعة درجات الشهر، مناقشة الغياب المتكرر"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تفاصيل ما دار في المكالمة / الجلسة <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={3}
                    required
                    value={commData.details}
                    onChange={e => setCommData({ ...commData, details: e.target.value })}
                    placeholder="اكتب ملخص حديثك مع ولي الأمر..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">النتيجة والاتفاق</label>
                  <input
                    type="text"
                    value={commData.result}
                    onChange={e => setCommData({ ...commData, result: e.target.value })}
                    placeholder="مثال: وعد ولي الأمر بالحضور يوم الأحد القادم"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCommModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#008e8b] hover:bg-teal-700 cursor-pointer shadow-xs"
                  >
                    حفظ السجل
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Modal: Positive Score */}
        {isPositiveScoreModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600" />
                <span>إضافة تعزيز سلوكي إيجابي: {student.name}</span>
              </h3>

              <form onSubmit={handleSavePositiveScore} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نوع التعزيز / النشاط <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={positiveData.title}
                    onChange={e => setPositiveData({ ...positiveData, title: e.target.value })}
                    placeholder="مثال: تفوق أكاديمي، مساعدة الزملاء، انضباط تام"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">النقاط الممنوحة (+)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={positiveData.points}
                    onChange={e => setPositiveData({ ...positiveData, points: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPositiveScoreModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    إضافة النقاط الآن
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
