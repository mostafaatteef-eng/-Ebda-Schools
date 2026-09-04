import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  History,
  Info,
  Layers,
  Lock,
  LogOut,
  Moon,
  Phone,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  UserCheck,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
import { User } from '../../types';
import {
  ChecklistItem,
  IncidentRecord,
  PilotIssueItem,
  PilotMetricsData,
  ReleaseCandidateMeta,
  UatRoleSignoff,
  UatTestCase,
} from '../../types_extended';
import { OperationsService } from '../../services/operationsService';

interface OperationsCenterViewProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const OperationsCenterView: React.FC<OperationsCenterViewProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  // Tabs state
  const [activeTab, setActiveTab] = useState<
    'decision' | 'uat' | 'pilot' | 'daily' | 'incidents' | 'rollback' | 'training' | 'backlog'
  >('decision');

  // Operations Data State
  const [rcMeta, setRcMeta] = useState<ReleaseCandidateMeta>(() => OperationsService.getReleaseCandidate());
  const [decision, setDecision] = useState(() => OperationsService.evaluateGoLiveDecision());
  const [goLiveChecklist, setGoLiveChecklist] = useState<ChecklistItem[]>(() => OperationsService.getGoLiveChecklist());
  const [dailyChecklist, setDailyChecklist] = useState(() => OperationsService.getDailyChecklist());
  const [uatCases, setUatCases] = useState<UatTestCase[]>(() => OperationsService.getUatTestCases());
  const [signoffs, setSignoffs] = useState<UatRoleSignoff[]>(() => OperationsService.getUatRoleSignoffs());
  const [pilotMetrics, setPilotMetrics] = useState<PilotMetricsData>(() => OperationsService.getPilotMetrics());
  const [pilotIssues, setPilotIssues] = useState<PilotIssueItem[]>(() => OperationsService.getPilotIssues());
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => OperationsService.getIncidents());
  const [backlog, setBacklog] = useState(() => OperationsService.getPostGoLiveBacklog());

  // Security test runner state
  const [isRunningSecurityChecks, setIsRunningSecurityChecks] = useState(false);
  const [securityTestResults, setSecurityTestResults] = useState<{
    passed: boolean;
    checks: Array<{ name: string; target: string; status: 'PASS' | 'FAIL'; message: string }>;
  } | null>(null);

  // Safety snapshot state
  const [safetySnapshotStatus, setSafetySnapshotStatus] = useState<string | null>(null);

  // Incident form modal state
  const [isLoggingIncident, setIsLoggingIncident] = useState(false);
  const [newIncidentModule, setNewIncidentModule] = useState('Student Attendance');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4'>('SEV-3');
  const [newIncidentCategory, setNewIncidentCategory] = useState<'Validation Error' | 'Permission Error' | 'Network Error' | 'System Bug'>('Network Error');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentUsers, setNewIncidentUsers] = useState('مسؤول واحد');

  // Filters for UAT cases
  const [uatRoleFilter, setUatRoleFilter] = useState<string>('ALL');
  const [uatResultFilter, setUatResultFilter] = useState<string>('ALL');

  // Selected training role card
  const [selectedTrainingRole, setSelectedTrainingRole] = useState<'Teacher' | 'StudentAffairs' | 'TeacherAffairs' | 'SocialSpecialist' | 'Parent' | 'Admin'>('Teacher');

  const refreshAll = () => {
    setRcMeta(OperationsService.getReleaseCandidate());
    setDecision(OperationsService.evaluateGoLiveDecision());
    setGoLiveChecklist(OperationsService.getGoLiveChecklist());
    setDailyChecklist(OperationsService.getDailyChecklist());
    setUatCases(OperationsService.getUatTestCases());
    setSignoffs(OperationsService.getUatRoleSignoffs());
    setPilotMetrics(OperationsService.getPilotMetrics());
    setPilotIssues(OperationsService.getPilotIssues());
    setIncidents(OperationsService.getIncidents());
    setBacklog(OperationsService.getPostGoLiveBacklog());
  };

  const handleToggleGoLiveChecklist = (id: string) => {
    const updated = goLiveChecklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setGoLiveChecklist(updated);
    OperationsService.saveGoLiveChecklist(updated);
    setDecision(OperationsService.evaluateGoLiveDecision());
  };

  const handleCertifyAllGoLive = () => {
    const updated = goLiveChecklist.map(item => ({ ...item, checked: true }));
    setGoLiveChecklist(updated);
    OperationsService.saveGoLiveChecklist(updated);
    setDecision(OperationsService.evaluateGoLiveDecision());
  };

  const handleToggleDailyChecklist = (section: 'startOfDay' | 'duringDay' | 'endOfDay', id: string) => {
    const updated = {
      ...dailyChecklist,
      [section]: dailyChecklist[section].map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    };
    setDailyChecklist(updated);
    OperationsService.saveDailyChecklist(updated);
  };

  const handleRunSecurityChecks = () => {
    setIsRunningSecurityChecks(true);
    setTimeout(() => {
      const res = OperationsService.runAutomatedSecurityUAT();
      setSecurityTestResults(res);
      setIsRunningSecurityChecks(false);
    }, 600);
  };

  const handleCreateSafetySnapshot = () => {
    const snap = OperationsService.executeRollbackSafetySnapshot();
    setSafetySnapshotStatus(`تم أخذ لقطة الأمان بنجاح في ${snap.timestamp} برمز المعرف: ${snap.snapshotKey}`);
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentDesc.trim()) return;

    const record: IncidentRecord = {
      id: `INC-${Date.now().toString().slice(-6)}`,
      reportedAt: new Date().toLocaleString('ar-EG'),
      reportedBy: currentUser?.fullName || 'مشغل النظام',
      role: currentUser?.role || 'Admin',
      module: newIncidentModule,
      description: newIncidentDesc.trim(),
      severity: newIncidentSeverity,
      affectedUsers: newIncidentUsers,
      status: 'Open',
      errorCategory: newIncidentCategory,
      requestId: `REQ-${Math.floor(Math.random() * 900000 + 100000)}`,
    };

    OperationsService.logIncident(record);
    setIncidents(OperationsService.getIncidents());
    setNewIncidentDesc('');
    setIsLoggingIncident(false);
    setDecision(OperationsService.evaluateGoLiveDecision());
  };

  const handleEnvironmentSwitch = (mode: 'Production' | 'Staging') => {
    OperationsService.setEnvironmentMode(mode);
    setRcMeta(OperationsService.getReleaseCandidate());
  };

  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2">
        <ShieldAlert className="w-10 h-10 mx-auto text-rose-600" />
        <h2 className="text-base font-bold">غير مصرح بالدخول (403 Forbidden)</h2>
        <p className="text-xs text-rose-600">
          مركز عمليات الإطلاق والتشغيل الميداني مقصور فقط على إدارة النظام العليا.
        </p>
      </div>
    );
  }

  // Filtered UAT Cases
  const filteredUatCases = uatCases.filter(c => {
    if (uatRoleFilter !== 'ALL' && c.role !== uatRoleFilter) return false;
    if (uatResultFilter !== 'ALL' && c.result !== uatResultFilter) return false;
    return true;
  });

  const checkedGoLiveCount = goLiveChecklist.filter(c => c.checked).length;
  const totalGoLiveCount = goLiveChecklist.length;
  const goLivePercentage = Math.round((checkedGoLiveCount / totalGoLiveCount) * 100);

  return (
    <div className="space-y-6">
      {/* Release Candidate Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 shadow-md shadow-teal-600/20 text-white flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                مركز التشغيل الميداني وجاهزية الإطلاق (Go-Live & Operations Hub)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {rcMeta.version}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Feature Freeze</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إدارة بيئة الإنتاج، نتائج UAT الميدانية، قياسات Pilot، أدلة التدريب، وإجراءات الطوارئ والتراجع
            </p>
          </div>
        </div>

        {/* Environment Mode Switch & Status */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => handleEnvironmentSwitch('Staging')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                rcMeta.environment === 'Staging'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Staging (تجريبي)
            </button>
            <button
              onClick={() => handleEnvironmentSwitch('Production')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                rcMeta.environment === 'Production'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Production (إنتاج حقيقي)
            </button>
          </div>

          <button
            onClick={refreshAll}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('decision')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'decision'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-teal-400" />
          <span>قرار الإطلاق والفحص النهائي ({decision.verdict})</span>
        </button>

        <button
          onClick={() => setActiveTab('uat')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'uat'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>اختبارات قبول المستخدمين (UAT)</span>
        </button>

        <button
          onClick={() => setActiveTab('pilot')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'pilot'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>التشغيل التجريبي (Controlled Pilot)</span>
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'daily'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>القوائم اليومية والدورية</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'incidents'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>إدارة الحوادث (Incidents)</span>
        </button>

        <button
          onClick={() => setActiveTab('rollback')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'rollback'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>خطة التراجع وطوارئ Offline</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'training'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>بطاقات الإرشاد والتدريب</span>
        </button>

        <button
          onClick={() => setActiveTab('backlog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'backlog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Post-Go-Live Backlog</span>
        </button>
      </div>

      {/* =========================================================================
       * TAB 1: DECISION & MANDATORY CHECKLIST
       * ========================================================================= */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          {/* Decision Card */}
          <div
            className={`rounded-3xl p-6 border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              decision.verdict === 'GO'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : decision.verdict === 'GO_WITH_CONDITIONS'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  decision.verdict === 'GO'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : decision.verdict === 'GO_WITH_CONDITIONS'
                    ? 'bg-amber-600 text-white shadow-amber-600/20'
                    : 'bg-rose-600 text-white shadow-rose-600/20'
                }`}
              >
                {decision.verdict === 'GO' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <AlertOctagon className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black">{decision.verdictText}</h2>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-white/80 border border-current">
                    جاهزية: {decision.score}%
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed opacity-90">{decision.summary}</p>
                {decision.recommendations.length > 0 && (
                  <div className="pt-2 text-[11px] space-y-1 font-semibold">
                    <span className="font-bold">توصيات الإطلاق المدرسي:</span>
                    <ul className="list-disc list-inside space-y-0.5 opacity-85">
                      {decision.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/80 rounded-2xl border border-current/20 text-center w-full md:w-48">
              <div className="text-[11px] font-bold text-slate-500">العام الدراسي المعتمد</div>
              <div className="text-sm font-black text-slate-800">{rcMeta.schoolName}</div>
              <div className="text-xs font-mono text-teal-700 mt-1">توقيت مصر ({rcMeta.timezone})</div>
            </div>
          </div>

          {/* Mandatory Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  قائمة الجاهزية الإلزامية قبل الإطلاق النهائي (Mandatory Go-Live Checklist)
                </h3>
                <p className="text-xs text-slate-500">
                  فحص أمني، تحققي، تشغيلي، وتدريبي شامل. لا يتم الإطلاق إلا باكتمال كافة البنود.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCertifyAllGoLive}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                >
                  اعتماد وتأكيد كافة البنود
                </button>
                <div className="text-left font-mono text-xs font-bold text-slate-700">
                  {checkedGoLiveCount} / {totalGoLiveCount} مكتمل ({goLivePercentage}%)
                </div>
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${goLivePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goLiveChecklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleGoLiveChecklist(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    item.checked
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {item.category}
                      </span>
                      <span className={`text-xs font-bold ${item.checked ? 'text-slate-900' : 'text-slate-600'}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 2: UAT TEST SUITE & SECURITY RUNNER
       * ========================================================================= */}
      {activeTab === 'uat' && (
        <div className="space-y-6">
          {/* Automated Security Runner Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>محرك الفحص الأمني والعزل الآلي (Automated Security & Isolation Runner)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  اختبار برمجي فوري لعزل الرواتب، عزل بيانات أولياء الأمور، عزل المعلمين، والتشفير
                </p>
              </div>

              <button
                onClick={handleRunSecurityChecks}
                disabled={isRunningSecurityChecks}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 text-teal-400" />
                <span>{isRunningSecurityChecks ? 'جاري الفحص المباشر...' : 'تشغيل الفحص الأمني الآلي الآن'}</span>
              </button>
            </div>

            {securityTestResults && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">نتائج الفحص البرمجي الحي:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      securityTestResults.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {securityTestResults.passed ? 'كافة الاختبارات الأمنية نجحت بنسبة 100%' : 'رصد فشل أمني!'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {securityTestResults.checks.map((chk, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">{chk.name}</div>
                        <div className="text-[11px] text-slate-500">{chk.message}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          chk.status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Sign-offs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {signoffs.map(sig => (
              <div
                key={sig.role}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{sig.roleTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sig.status} ({sig.passedCount}/{sig.testedScenariosCount})
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>المعتمد: {sig.signoffUser}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-xl">
                  "{sig.notes}"
                </p>
              </div>
            ))}
          </div>

          {/* UAT Test Cases Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">سجل حالات اختبارات قبول المستخدمين (UAT Cases)</h3>
                <p className="text-xs text-slate-500">
                  تفاصيل السيناريوهات والخطوات والنتائج المتوقعة والفعلية لكل دور
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={uatRoleFilter}
                  onChange={e => setUatRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="ALL">كافة الأدوار</option>
                  <option value="Admin">مدير النظام</option>
                  <option value="StudentAffairs">شؤون الطلاب</option>
                  <option value="TeacherAffairs">شؤون المعلمين</option>
                  <option value="Teacher">المعلم</option>
                  <option value="SocialSpecialist">الأخصائي</option>
                  <option value="Parent">ولي الأمر</option>
                  <option value="Security">الأمان</option>
                </select>

                <select
                  value={uatResultFilter}
                  onChange={e => setUatResultFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="ALL">كافة النتائج</option>
                  <option value="PASS">PASS (ناجح)</option>
                  <option value="FAIL">FAIL (فاشل)</option>
                  <option value="BLOCKED">BLOCKED (معلق)</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">المعرف والدور</th>
                    <th className="py-2.5 px-3">الوحدة والسيناريو</th>
                    <th className="py-2.5 px-3">الخطوات المتسلسلة</th>
                    <th className="py-2.5 px-3">النتيجة الفعلية والملاحظات</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUatCases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 align-top">
                        <div className="font-mono font-bold text-slate-800">{c.id}</div>
                        <div className="text-[11px] text-teal-700 font-bold mt-0.5">{c.roleLabel}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                          {c.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-900">{c.module}</div>
                        <div className="text-[11px] text-slate-600 mt-1">{c.scenario}</div>
                      </td>
                      <td className="py-3 px-3 align-top max-w-xs">
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          {c.steps.map((st, idx) => (
                            <div key={idx}>
                              {idx + 1}. {st}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="text-slate-800 text-[11px] font-semibold">{c.actual}</div>
                        <div className="text-[10px] text-slate-500 mt-1">ملاحظة: {c.notes}</div>
                      </td>
                      <td className="py-3 px-3 text-center align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.result === 'PASS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 3: CONTROLLED PILOT & METRICS
       * ========================================================================= */}
      {activeTab === 'pilot' && (
        <div className="space-y-6">
          {/* Pilot Scope & Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
              <div className="text-xs font-bold text-slate-500">حجم عينة التشغيل التجريبي</div>
              <div className="text-xl font-black text-slate-900">{pilotMetrics.pilotActiveUsers} مستخدم</div>
              <div className="text-[11px] text-slate-500">
                8 معلمين | 2 فصل (أولى ثانوي أ، ب) | 26 ولي أمر
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
              <div className="text-xs font-bold text-slate-500">معدل نجاح تسجيل الدخول</div>
              <div className="text-xl font-black text-emerald-600">{pilotMetrics.loginSuccessRate}%</div>
              <div className="text-[11px] text-slate-500">0 حالات رفض أو فشل في الجلسة</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
              <div className="text-xs font-bold text-slate-500">سرعة رصد حضور فصل (40 طالب)</div>
              <div className="text-xl font-black text-teal-700 font-mono">
                {pilotMetrics.avgClassroomAttendanceSec} ثانية
              </div>
              <div className="text-[11px] text-slate-500">تحديد الكل حاضر وتعديل الغياب بلمسة واحدة</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
              <div className="text-xs font-bold text-slate-500">فشل المزامنة واستدعاء الـ API</div>
              <div className="text-xl font-black text-slate-900 font-mono">0 أخطاء</div>
              <div className="text-[11px] text-emerald-600 font-bold">الطابور السحابي نظيف ومستقر</div>
            </div>
          </div>

          {/* Pilot Stop Conditions & Criteria */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              شروط إيقاف التوسع ومعايير النجاح (Stop Conditions & Criteria)
            </h3>
            <p className="text-xs text-slate-500">
              يتم إيقاف النشر فوراً إذا ظهر أي تسريب أمني، فقدان بيانات، أو تكرار في الحضور.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>معايير النجاح المتحققة (Success Criteria):</span>
                </div>
                <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                  <li>لا يوجد أي خطأ من الدرجة الحرجة (0 P0 Bugs).</li>
                  <li>سلاسة تسجيل حضور الحصص والمحتوى للمعلمين في أقل من دقيقة.</li>
                  <li>حماية خصوصية أولياء الأمور ومنع الوصول المتقاطع تماماً.</li>
                  <li>حجب مسير الرواتب بنسبة 100% عن غير المدراء.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
                  <AlertOctagon className="w-4 h-4 text-slate-500" />
                  <span>مراقبة شروط الإيقاف الفوري (Stop Triggers Status):</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>فقدان البيانات: 0 حالات رصد.</li>
                  <li>تسريب أمني / صلاحيات: 0 حالات رصد.</li>
                  <li>تكرار سجلات الحضور: 0 حالات رصد.</li>
                  <li>تعطل المصادقة الجماعي: 0 حالات رصد.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pilot Issue Board */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">سجل ملاحظات ومشاكل التشغيل التجريبي (Issue Board)</h3>
                <p className="text-xs text-slate-500">
                  توثيق الملاحظات الميدانية والحلول البديلة والترحيل لسجل ما بعد الإطلاق
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {pilotIssues.length} ملاحظات مسجلة
              </span>
            </div>

            <div className="space-y-3">
              {pilotIssues.map(issue => (
                <div
                  key={issue.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{issue.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        {issue.role}
                      </span>
                      <span className="font-bold text-slate-900">{issue.module}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800">
                        {issue.severity}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">{issue.description}</div>
                    <div className="text-[11px] text-slate-500">
                      <span className="font-bold">الحل البديل (Workaround): </span>
                      {issue.workaround}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        issue.fixStatus === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {issue.fixStatus === 'Resolved' ? 'تم الحل' : 'مرحّل لما بعد الإطلاق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 4: DAILY & PERIODIC OPERATIONS
       * ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Daily Operations Stages */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Start of Day */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">1. بداية اليوم الدراسي (07:00 - 08:00)</h3>
              </div>
              <div className="space-y-2.5">
                {dailyChecklist.startOfDay.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDailyChecklist('startOfDay', item.id)}
                    className="flex items-start gap-2.5 text-xs cursor-pointer select-none p-2 rounded-xl hover:bg-slate-50"
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        item.checked ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={item.checked ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* During Day */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-teal-900 border-b border-slate-100 pb-3">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold">2. أثناء اليوم الدراسي (08:00 - 14:00)</h3>
              </div>
              <div className="space-y-2.5">
                {dailyChecklist.duringDay.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDailyChecklist('duringDay', item.id)}
                    className="flex items-start gap-2.5 text-xs cursor-pointer select-none p-2 rounded-xl hover:bg-slate-50"
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        item.checked ? 'bg-teal-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={item.checked ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* End of Day */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 border-b border-slate-100 pb-3">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold">3. نهاية اليوم الدراسي والقفل (14:00 - 15:30)</h3>
              </div>
              <div className="space-y-2.5">
                {dailyChecklist.endOfDay.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDailyChecklist('endOfDay', item.id)}
                    className="flex items-start gap-2.5 text-xs cursor-pointer select-none p-2 rounded-xl hover:bg-slate-50"
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={item.checked ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Periodic Operations (Weekly, Monthly, Year-End) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">العمليات الدورية (أسبوعياً، شهرياً، ونهاية العام)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm">العمليات الأسبوعية (Weekly)</div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>أخذ نسخة احتياطية كاملة (Weekly JSON Backup).</li>
                  <li>مراجعة تقرير صحة النظام وأخطاء المزامنة العالقة.</li>
                  <li>فحص حسابات المستخدمين الجديدة وتدقيق الصلاحيات.</li>
                  <li>متابعة الحالات السلوكية المتأخرة وتواصل أولياء الأمور.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm">الإغلاق الشهري (Monthly Closing)</div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>إغلاق سجلات حضور الموظفين الشهرية وتدقيق الغياب والتأخير.</li>
                  <li>أخذ لقطة مسير الرواتب (Payroll Snapshot) ومراجعتها من قبل المدير.</li>
                  <li>مراجعة مصفوفة الحضور الشهرية واستخراج التقارير الرسمية.</li>
                  <li>تدقيق سجل الرقابة وتصدير أرشيف الحركات.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm">إغلاق العام الدراسي (Year-End)</div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>أخذ نسخة ذهبية كاملة وتوثيق العام المنتهي.</li>
                  <li>تطبيق قواعد ترحيل الطلاب (Promotion Rules) وتخريج الصف الثالث الثانوي.</li>
                  <li>إنشاء العام الدراسي الجديد واستنساخ القوائم والتعريفات المناسبة.</li>
                  <li>تحديث بيانات أولياء الأمور وإعادة ضبط جدول الحصص.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 5: INCIDENT MANAGEMENT
       * ========================================================================= */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">سجل بلاغات الطوارئ والحوادث التقنية (Incidents)</h3>
                <p className="text-xs text-slate-500">
                  نظام تصنيف الحوادث (SEV-1 إلى SEV-4) والتمييز بين خطأ المستخدم وعطل النظام
                </p>
              </div>

              <button
                onClick={() => setIsLoggingIncident(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل بلاغ طارئ جديد</span>
              </button>
            </div>

            {/* Severity Guidelines Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold">SEV-1 (كارثي)</div>
                <div className="text-[11px] opacity-80">توقف تام للنظام أو فقدان بيانات أو خرق أمني.</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="font-bold">SEV-2 (رئيسي)</div>
                <div className="text-[11px] opacity-80">تعطل وحدة أساسية كلياً مثل شاشة الحضور.</div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
                <div className="font-bold">SEV-3 (محدود)</div>
                <div className="text-[11px] opacity-80">خلل جزئي في ميزة مع توفر بديل تشغيلي.</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 space-y-1">
                <div className="font-bold">SEV-4 (طفيف)</div>
                <div className="text-[11px] opacity-80">ملاحظة شكلية أو واجهة استخدام بسيطة.</div>
              </div>
            </div>

            {/* Incident Records Table */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">المعرف والخطورة</th>
                    <th className="py-2.5 px-3">الوحدة والتصنيف</th>
                    <th className="py-2.5 px-3">الوصف والمستخدمون المتأثرون</th>
                    <th className="py-2.5 px-3">السبب الجذري والإجراء المتخذ</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {incidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 align-top">
                        <div className="font-mono font-bold text-slate-900">{inc.id}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'SEV-1'
                              ? 'bg-rose-100 text-rose-800'
                              : inc.severity === 'SEV-2'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{inc.reportedAt}</div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-800">{inc.module}</div>
                        <div className="text-[11px] text-teal-700 font-semibold mt-0.5">{inc.errorCategory}</div>
                        {inc.requestId && (
                          <div className="text-[10px] font-mono text-slate-400 mt-1">{inc.requestId}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="text-slate-900 font-medium">{inc.description}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          المتأثرون: {inc.affectedUsers} | المبلغ: {inc.reportedBy} ({inc.role})
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top max-w-sm">
                        <div className="text-[11px] text-slate-700">
                          <span className="font-bold">السبب: </span>
                          {inc.rootCause || 'قيد التحقيق'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium mt-1">
                          <span className="font-bold">الحل: </span>
                          {inc.resolution || 'بانتظار الإغلاق'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inc.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inc.status === 'Resolved' ? 'تم الحل' : 'مفتوح'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 6: ROLLBACK PLAN & EMERGENCY OFFLINE
       * ========================================================================= */}
      {activeTab === 'rollback' && (
        <div className="space-y-6">
          {/* Rollback 8-step Procedure */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <span>خطة التراجع المعتمدة (Production Rollback Plan)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  إجراءات الطوارئ الرسمية في حال حدوث عطل حرج (SEV-1) أو تلف بالبيانات
                </p>
              </div>

              <button
                onClick={handleCreateSafetySnapshot}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>أخذ لقطة أمان فورية للوضع الحالي (Safety Snapshot)</span>
              </button>
            </div>

            {safetySnapshotStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{safetySnapshotStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 text-rose-950">
                <div className="font-bold flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>محفزات التراجع الإجباري (Rollback Triggers):</span>
                </div>
                <ul className="space-y-1 list-disc list-inside text-rose-900">
                  <li>تلف في بيانات الطلاب أو سجلات الحضور.</li>
                  <li>تعطل كامل لخدمة المصادقة ومنع المستخدمين من الدخول.</li>
                  <li>تسريب أمني حرج يتيح وصول غير مصرح لبيانات الرواتب.</li>
                  <li>عجز دائم عن حفظ حضور الفصول بعد استنفاد المحاولات.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-slate-900">
                <div className="font-bold flex items-center gap-2">
                  <Server className="w-4 h-4 text-teal-600" />
                  <span>خطوات التراجع الـ 8 المعتمدة (8-Step Rollback):</span>
                </div>
                <ol className="space-y-1 list-decimal list-inside text-slate-700">
                  <li>إيقاف عمليات الكتابة فوراً (Stop writes).</li>
                  <li>إخطار مدير النظام وإدارة المدرسة (Notify Admin).</li>
                  <li>سحب سجلات التشخيص الحالية (Capture diagnostics).</li>
                  <li>حفظ نسخة من الوضع الحالي المعطوب (Save broken-state backup).</li>
                  <li>استعادة آخر نسخة احتياطية سليمة (Restore last good backup).</li>
                  <li>الرجوع لإصدار الواجهة البرمجية السابق المستقر.</li>
                  <li>التحقق من التكامل المرجعي للبيانات (Verify integrity).</li>
                  <li>استئناف العمل وإبلاغ المستخدمين (Resume operations).</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Emergency Offline Business Continuity Plan */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-3">
              <WifiOff className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold">إجراءات استمرار العمل عند انقطاع الإنترنت (Business Continuity Plan)</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              توقف الإنترنت أو تعطل السحابة لا يوقف اليوم الدراسي إطلاقاً! المدرسة مجهزة للعمل التلقائي بطريقتين:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2 text-indigo-950">
                <div className="font-bold text-indigo-900">المسار الأول: التخزين المحلي الآلي (Offline Local Storage)</div>
                <p className="leading-relaxed opacity-90">
                  يواصل المعلمون ومسؤولو شؤون الطلاب تسجيل الحضور والدروس طبيعياً على أجهزتهم؛ حيث يقوم النظام بتخزين السجلات في الذاكرة المحلية (Sync Queue) ويعيد ترحيلها تلقائياً فور عودة الاتصال دون تدخل بشري.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-amber-950">
                <div className="font-bold text-amber-900">المسار الثاني: الكشوف الورقية الاحتياطية (Paper Fallback)</div>
                <p className="leading-relaxed opacity-90">
                  في حال انقطاع التيار الكهربائي التام، يتم تفعيل كشوف الحضور الورقية المطبوعة مسبقاً من مركز التقارير، ويتم إدخال الغائبين والمتأخرين جماعياً في نهاية اليوم عبر شاشة شؤون الطلاب في دقائق معدودة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 7: ROLE TRAINING & CHEAT SHEETS
       * ========================================================================= */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'Teacher', label: 'المعلم (Mobile-First)' },
                { id: 'StudentAffairs', label: 'شؤون الطلاب' },
                { id: 'TeacherAffairs', label: 'شؤون المعلمين' },
                { id: 'SocialSpecialist', label: 'الأخصائي الاجتماعي' },
                { id: 'Parent', label: 'ولي الأمر (Mobile)' },
                { id: 'Admin', label: 'مدير النظام' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTrainingRole(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedTrainingRole === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Teacher Guide */}
          {selectedTrainingRole === 'Teacher' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    دليل المعلم السريع وبطاقة الإرشاد (Teacher Quick Reference Card)
                  </h3>
                  <p className="text-xs text-slate-500">
                    دورة عمل الحصة الميدانية من شاشة الهاتف المحمول في 6 خطوات بسيطة وسريعة
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  أقل من 60 ثانية للحصة
                </span>
              </div>

              {/* 6-Step Visual Workflow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">تسجيل الدخول من الهاتف</div>
                  <p className="text-[11px] text-slate-500">
                    افتح المتصفح على هاتفك وسجل دخولك باسم المستخدم وكلمة المرور الخاصة بك.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">عرض حصص اليوم</div>
                  <p className="text-[11px] text-slate-500">
                    ستظهر لك تلقائياً الحصة الحالية والفصل والقاعة الدراسية وأي حصص احتياطي مكلف بها.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">فتح الحصة ورصد الحضور</div>
                  <p className="text-[11px] text-slate-500">
                    اضغط "تحديد الكل حاضر"، ثم المس أسماء الغائبين أو المتأخرين فقط واضغط "حفظ".
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">تسجيل ما تم تدريسه</div>
                  <p className="text-[11px] text-slate-500">
                    اكتب عنوان الدرس، وصفحات الكتاب المدرسي، وأهم النقاط التي تم شرحها.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    5
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">إضافة الواجب المنزلي</div>
                  <p className="text-[11px] text-slate-500">
                    حدد رقم الصفحة والتمارين وتاريخ التسليم المطلوب من الطلاب.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                    6
                  </div>
                  <div className="text-xs font-bold text-teal-800 mt-2">نشر وإنهاء الحصة</div>
                  <p className="text-[11px] text-slate-500">
                    اضغط "نشر الحصة"، ليتم إرسال الواجب فوراً لولي الأمر واعتماد الحصة بالجدول.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student Affairs Guide */}
          {selectedTrainingRole === 'StudentAffairs' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                دليل مسؤول شؤون الطلاب (Student Affairs Guide)
              </h3>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>1. رصد حضور طابور الصباح:</strong> اختر الصف والفصل، اضغط "تحديد الكل حاضر"، حدد الطلاب الغائبين والمتأخرين، ثم اضغط حفظ.
                </p>
                <p>
                  <strong>2. قفل اليوم الدراسي (Lock Attendance):</strong> بعد انتهاء الحصة الأولى وتدقيق الغياب، يتم اعتماد وقفل الفصل رسمياً لمنع أي تلاعب لاحق.
                </p>
                <p>
                  <strong>3. الملف الشامل للطالب (Student 360):</strong> ابحث بالاسم أو الكود لمراجعة نسب الحضور، السجل السلوكي، ونقل الطالب بين الفصول بسلاسة.
                </p>
              </div>
            </div>
          )}

          {/* Teacher Affairs Guide */}
          {selectedTrainingRole === 'TeacherAffairs' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                دليل مسؤول شؤون المعلمين (Teacher Affairs Guide)
              </h3>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>1. تسجيل ومتابعة حضور الموظفين:</strong> تسجيل الحضور اليومي والانصراف وحساب دقائق التأخير آلياً مع تطبيق فترة السماح (15 دقيقة).
                </p>
                <p>
                  <strong>2. إدارة الإجازات والأذونات:</strong> تسجيل طلبات الإجازات العارضة والاعتيادية واحتسابها من الرصيد السنوي القانوني.
                </p>
                <p>
                  <strong>3. ضوابط الأمان:</strong> تم حجب مسير الرواتب والمحرك المالي بالكامل عن شؤون العاملين وفق مبدأ الفصل الصارم بين المهام.
                </p>
              </div>
            </div>
          )}

          {/* Social Specialist Guide */}
          {selectedTrainingRole === 'SocialSpecialist' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                دليل الأخصائي الاجتماعي (Social Specialist Guide)
              </h3>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>1. رصد المخالفات السلوكية:</strong> اختيار درجة المخالفة حسب لائحة الانضباط المدرسي المصرية (درجة 1، 2، أو 3)، ليتم خصم النقاط آلياً.
                </p>
                <p>
                  <strong>2. دراسة الحالة وتواصل ولي الأمر:</strong> فتح حالة سلوكية للطالب ومتابعة خطة التوجيه وتوثيق مكالمات واجتماعات ولي الأمر بسجل رسمي.
                </p>
                <p>
                  <strong>3. تعزيز السلوك الإيجابي:</strong> تسجيل بطاقات التميز والتفوق وتكريم الطلاب ذوي المبادرات الأخلاقية والتطوعية.
                </p>
              </div>
            </div>
          )}

          {/* Parent Guide */}
          {selectedTrainingRole === 'Parent' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                دليل ولي الأمر (Parent Mobile Guide)
              </h3>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>1. الدخول واختيار الابن:</strong> في حال وجود أكثر من ابن بالمدرسة، يمكنك التبديل بينهم بلمسة واحدة من أعلى الشاشة.
                </p>
                <p>
                  <strong>2. اليوم الدراسي المباشر:</strong> متابعة حضور الصباح، ومطابقته مع حضور كل حصة دراسية، ومراجعة الواجبات المطلوبة لتسليمها في موعدها.
                </p>
                <p>
                  <strong>3. الخصوصية والأمان:</strong> بيانات كل طالب مشفرة ومحجوبة تماماً ولا يمكن لأي ولي أمر آخر الاطلاع على بيانات ابنك.
                </p>
              </div>
            </div>
          )}

          {/* Admin Guide */}
          {selectedTrainingRole === 'Admin' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                دليل مدير النظام والمسؤول التقني (System Administrator Runbook)
              </h3>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>1. إدارة الإعدادات والسنوات الدراسية:</strong> التحكم في العام الأكاديمي، شروط الانضباط، ومطابقة التوقيت الرسمي المصري (Africa/Cairo).
                </p>
                <p>
                  <strong>2. النسخ الاحتياطي وصحة النظام:</strong> تنزيل النسخ الاحتياطية الدورية، مراجعة طابور المزامنة، وتتبع سجلات الرقابة (Audit Logs).
                </p>
                <p>
                  <strong>3. مسير الرواتب والمحرك المالي:</strong> محرك حصري لمدير النظام الأعلى لاحتساب مستحقات واستقطاعات الموظفين الشهرية بدقة.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
       * TAB 8: POST-GO-LIVE BACKLOG
       * ========================================================================= */}
      {activeTab === 'backlog' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                سجل طلبات التطوير لما بعد الإطلاق (Post-Go-Live Backlog)
              </h3>
              <p className="text-xs text-slate-500">
                تطبيق سياسة تجميد المزايا (Feature Freeze): أي طلبات تطوير جديدة تُسجل هنا لدراستها بعد اكتمال مرحلة الاستقرار
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {backlog.length} طلبات قيد الجدولة
            </span>
          </div>

          <div className="space-y-3">
            {backlog.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{item.id}</span>
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      الأولوية: {item.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      المخاطر: {item.risk}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
                <div className="text-[11px] text-slate-400">
                  المصدر: {item.requestedBy} | تاريخ التسجيل: {item.createdAt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {isLoggingIncident && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>تسجيل بلاغ طارئ في النظام (Incident Report)</span>
              </h3>
              <button
                onClick={() => setIsLoggingIncident(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الوحدة المتأثرة:</label>
                <select
                  value={newIncidentModule}
                  onChange={e => setNewIncidentModule(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Student Attendance">حضور الطلاب (Student Attendance)</option>
                  <option value="Teacher Portal">بوابة المعلم (Teacher Portal)</option>
                  <option value="Schedule & Substitution">الجدول والاحتياطي (Schedule)</option>
                  <option value="Parent Portal">بوابة ولي الأمر (Parent Portal)</option>
                  <option value="Cloud Sync">المزامنة السحابية (Cloud Sync)</option>
                  <option value="Authentication">تسجيل الدخول والمصادقة (Auth)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الخطورة:</label>
                  <select
                    value={newIncidentSeverity}
                    onChange={e => setNewIncidentSeverity(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="SEV-1">SEV-1 (توقف تام / فقدان بيانات)</option>
                    <option value="SEV-2">SEV-2 (تعطل وحدة رئيسية)</option>
                    <option value="SEV-3">SEV-3 (خلل جزئي مع توفر بديل)</option>
                    <option value="SEV-4">SEV-4 (ملاحظة شكلية أو واجهة)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف الخطأ:</label>
                  <select
                    value={newIncidentCategory}
                    onChange={e => setNewIncidentCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Network Error">خطأ شبكة / اتصال</option>
                    <option value="Validation Error">خطأ مدخلات / قيود</option>
                    <option value="Permission Error">صلاحية غير مصرح بها</option>
                    <option value="System Bug">عطل برمجي بالنظام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستخدمون المتأثرون:</label>
                <input
                  type="text"
                  value={newIncidentUsers}
                  onChange={e => setNewIncidentUsers(e.target.value)}
                  placeholder="مثال: معلمو الصف الأول الثانوي (4 معلمين)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف العطل أو المشكلة بدقة:</label>
                <textarea
                  rows={3}
                  value={newIncidentDesc}
                  onChange={e => setNewIncidentDesc(e.target.value)}
                  placeholder="اشرح ما حدث بالتفصيل، والرسالة الظاهرة..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingIncident(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  تسجيل البلاغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
