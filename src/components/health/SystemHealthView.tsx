import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  Gauge,
  HardDrive,
  HelpCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { User } from '../../types';
import { CapacityAssessment, SystemHealthOverview } from '../../types_extended';
import { SystemHealthService } from '../../services/systemHealthService';
import {
  PerformanceBenchmarkResult,
  PerformanceTestingService,
} from '../../services/performanceTestingService';

interface SystemHealthViewProps {
  currentUser: User | null;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'Admin';
  const [healthData, setHealthData] = useState<SystemHealthOverview | null>(null);
  const [capacity, setCapacity] = useState<CapacityAssessment | null>(null);
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmarkResult[]>([]);
  const [isRunningBenchmarks, setIsRunningBenchmarks] = useState<boolean>(false);
  const [retriedCount, setRetriedCount] = useState<number | null>(null);

  const refreshHealth = () => {
    const ov = SystemHealthService.runHealthCheck(currentUser);
    setHealthData(ov);
    const cap = PerformanceTestingService.assessCapacity();
    setCapacity(cap);
  };

  useEffect(() => {
    refreshHealth();
  }, [currentUser]);

  const handleRunBenchmarks = async () => {
    setIsRunningBenchmarks(true);
    try {
      const results = await PerformanceTestingService.runBenchmarkSuite();
      setBenchmarks(results);
    } finally {
      setIsRunningBenchmarks(false);
    }
  };

  const handleRetryQueue = () => {
    const retried = SystemHealthService.retryFailedQueue();
    setRetriedCount(retried);
    refreshHealth();
  };

  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2">
        <ShieldAlert className="w-10 h-10 mx-auto text-rose-600" />
        <h2 className="text-base font-bold">غير مصرح بالدخول (403 Forbidden)</h2>
        <p className="text-xs text-rose-600">
          لوحة صحة النظام واختبارات الأداء مقصورة فقط على مدير النظام الأعلى.
        </p>
      </div>
    );
  }

  if (!healthData || !capacity) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white ${
              healthData.overallStatus === 'HEALTHY'
                ? 'bg-emerald-600 shadow-emerald-600/20'
                : healthData.overallStatus === 'WARNING'
                ? 'bg-amber-600 shadow-amber-600/20'
                : 'bg-rose-600 shadow-rose-600/20'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">صحة النظام، الأداء والجاهزية للتشغيل</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  healthData.overallStatus === 'HEALTHY'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : healthData.overallStatus === 'WARNING'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {healthData.overallStatus === 'HEALTHY'
                  ? 'حالة النظام ممتازة'
                  : healthData.overallStatus === 'WARNING'
                  ? 'تنبيهات تشغيلية'
                  : 'مخاطر تتطلب معالجة'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              فحص شامل لتكامل الجداول، طابور المزامنة السحابية، أمان الجلسات، وتحمل قواعد البيانات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => SystemHealthService.exportDiagnostics(healthData)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير تقرير الفحص (Zero-Secrets)</span>
          </button>
          <button
            onClick={refreshHealth}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="تحديث الفحص"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Key Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cloud & Sheets Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Google Sheets Backend</span>
            <Server className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {healthData.backend.appsScriptConnected ? 'متصل وسحابي' : 'تخزين محلي مؤقت'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {healthData.backend.lastSuccessfulRequest
              ? `آخر مزامنة: ${healthData.backend.lastSuccessfulRequest.split('T')[1] || healthData.backend.lastSuccessfulRequest}`
              : 'جاهز للإرسال السحابي'}
          </p>
        </div>

        {/* Card 2: Sync Queue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">طابور المزامنة (Queue)</span>
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {healthData.sync.pendingCount} معلق | {healthData.sync.failedCount} فاشل
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {healthData.sync.failedCount === 0 ? 'الطابور نظيف ومستقر' : 'يحتاج إعادة محاولة'}
            </span>
            {healthData.sync.failedCount > 0 && (
              <button
                onClick={handleRetryQueue}
                className="text-[10px] font-bold text-indigo-600 hover:underline"
              >
                إعادة المحاولة الآن
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Integrity Check */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">سلامة البيانات والعلاقات</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {healthData.integrityViolations.length === 0 ? (
              <span className="text-emerald-600">سليمة 100%</span>
            ) : (
              <span className="text-amber-600">{healthData.integrityViolations.length} ملاحظات</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {healthData.integrityViolations.length === 0
              ? 'لا توجد سجلات يتيمة أو مفاتيح مكررة'
              : 'راجع جدول المخالفات أدناه للتصحيح'}
          </p>
        </div>

        {/* Card 4: Security & Authentication */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">أمن الجلسات والمصادقة</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900">POST مشفر ومؤمن</div>
          <p className="text-[11px] text-slate-500">تم حظر استعلامات GET وتفعيل عزل الأدوار</p>
        </div>
      </div>

      {retriedCount !== null && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-xs font-bold text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>تمت إعادة معالجة {retriedCount} عملية بنجاح في طابور المزامنة.</span>
        </div>
      )}

      {/* Operational Capacity Assessment (Google Sheets Limits) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              تقييم الطاقة الاستيعابية والحدود التشغيلية مع Google Sheets
            </h2>
            <p className="text-xs text-slate-500">
              تحليل واقعي لمعدل استهلاك السجلات اليومية والسنوية والتوصية التقنية
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold self-start sm:self-auto ${
              capacity.verdict === 'SUITABLE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : capacity.verdict === 'SUITABLE_WITH_CONSTRAINTS'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {capacity.verdict === 'SUITABLE'
              ? 'جاهز تماماً للتشغيل الميداني'
              : capacity.verdict === 'SUITABLE_WITH_CONSTRAINTS'
              ? 'جاهز مع ضوابط الأرشفة'
              : 'يوصى بالترحيل لقاعدة بيانات'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400">الطلاب والكوادر المسجلة</div>
            <div className="text-base font-black text-slate-800">
              {capacity.currentStudents} طالب | {capacity.currentEmployees} موظف
            </div>
            <div className="text-[11px] text-slate-500">إجمالي سجلات الحضور: {capacity.currentAttendanceRows}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400">المنطقة الآمنة في Google Sheets</div>
            <div className="text-xs font-bold text-emerald-700">{capacity.safeZoneLimit}</div>
            <div className="text-[11px] text-slate-500">استجابة لحظية 300-800ms دون تباطؤ</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400">حدود التحذير والترحيل</div>
            <div className="text-xs font-bold text-amber-700">{capacity.warningZoneLimit}</div>
            <div className="text-[11px] text-slate-500">ترحيل لـ Cloud SQL إذا تجاوز 3500 طالب</div>
          </div>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs space-y-1 text-indigo-950">
          <div className="font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>القرار النهائي لجاهزية التشغيل:</span>
          </div>
          <p className="leading-relaxed">{capacity.verdictReason}</p>
        </div>
      </div>

      {/* Live Benchmark Testing Suite */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">اختبارات الأداء وسرعة الاستجابة الميدانية</h2>
            <p className="text-xs text-slate-500">
              محاكاة استعلامات ضخمة، معالجة البحث والتطبيع العربي، وتحليل فروق الاستيراد بالذاكرة
            </p>
          </div>
          <button
            onClick={handleRunBenchmarks}
            disabled={isRunningBenchmarks}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-teal-400" />
            <span>{isRunningBenchmarks ? 'جاري الاختبار...' : 'تشغيل حزمة الاختبارات الآن'}</span>
          </button>
        </div>

        {benchmarks.length > 0 ? (
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">السيناريو والاختبار</th>
                  <th className="py-2.5 px-3 text-center">السجلات المعالجة</th>
                  <th className="py-2.5 px-3 text-center">زمن التنفيذ</th>
                  <th className="py-2.5 px-3 text-center">الذاكرة التقديرية</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3">الملاحظات والتقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {benchmarks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.scenarioName}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{b.recordsProcessed}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-700">{b.durationMs} ms</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{b.memoryEstimateMb} MB</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status === 'EXCELLENT' ? 'ممتاز' : 'جيد'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
            انقر على "تشغيل حزمة الاختبارات الآن" لقياس زمن استجابة الفلترة والبحث ومطابقة الاستيراد بالمللي ثانية.
          </div>
        )}
      </div>

      {/* Data Integrity Violations Breakdown */}
      {healthData.integrityViolations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold">ملاحظات ومخالفات تكامل البيانات (Data Integrity Diagnostics)</h2>
          </div>
          <p className="text-xs text-slate-500">
            تنبيهات حول أي علاقات غير مكتملة أو تكرارات رصدها محرك الفحص الآلي
          </p>

          <div className="space-y-3">
            {healthData.integrityViolations.map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>{v.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200/60 text-amber-800 font-mono">
                    {v.count} حالة
                  </span>
                </div>
                {v.sampleItems && v.sampleItems.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-2.5 space-y-1 text-[11px]">
                    <div className="font-bold text-slate-500">عينة من السجلات:</div>
                    {v.sampleItems.map(item => (
                      <div key={item.id} className="text-slate-700 flex items-center justify-between">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-rose-600 font-medium">{item.issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
