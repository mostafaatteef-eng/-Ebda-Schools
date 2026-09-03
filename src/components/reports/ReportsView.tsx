import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Building,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  History,
  Layers,
  Lock,
  Printer,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { SystemSettings, User } from '../../types';
import {
  ReportColumn,
  ReportDefinition,
  ReportModule,
  ReportQueryResult,
  SavedReportFilter,
} from '../../types_extended';
import { ReportService } from '../../services/reportService';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate } from '../../utils/egyptianTime';

interface ReportsViewProps {
  currentUser: User | null;
  initialReportKey?: string;
  initialFilters?: Record<string, any>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  initialReportKey,
  initialFilters,
}) => {
  const isAdmin = currentUser?.role === 'Admin';
  const availableDefs = ReportService.REPORT_DEFINITIONS.filter(def => {
    if (def.adminOnly && !isAdmin) return false;
    return true;
  });

  // Module / Tab Selection
  const [selectedModule, setSelectedModule] = useState<ReportModule>('STUDENTS');
  const [activeReportKey, setActiveReportKey] = useState<string>(
    initialReportKey || availableDefs.find(d => d.module === 'STUDENTS')?.key || 'student_directory'
  );

  // Filters State
  const activeDef = availableDefs.find(d => d.key === activeReportKey) || availableDefs[0];
  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    if (initialFilters) return initialFilters;
    const initial: Record<string, any> = {};
    activeDef?.availableFilters.forEach(f => {
      initial[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    return initial;
  });

  // Pagination & Column Selection State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [activeColumns, setActiveColumns] = useState<string[]>(
    activeDef?.availableColumns.filter(c => c.isDefaultVisible).map(c => c.key) || []
  );
  const [showColumnModal, setShowColumnModal] = useState<boolean>(false);

  // Saved Filters
  const [savedFilters, setSavedFilters] = useState<SavedReportFilter[]>([]);
  const [newFilterName, setNewFilterName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  // Result state
  const [queryResult, setQueryResult] = useState<ReportQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load Saved Filters on mount or report change
  useEffect(() => {
    if (currentUser?.id && activeDef) {
      const filters = ReportService.getSavedFilters(activeDef.key, currentUser.id);
      setSavedFilters(filters);

      // Check if there is a default saved filter
      const def = filters.find(f => f.isDefault);
      if (def && !initialFilters) {
        try {
          const parsed = JSON.parse(def.filtersJson);
          setFilterValues(parsed);
        } catch {}
      }
    }
  }, [activeReportKey, currentUser?.id]);

  // Sync active columns when report definition changes
  useEffect(() => {
    if (activeDef) {
      setActiveColumns(activeDef.availableColumns.filter(c => c.isDefaultVisible).map(c => c.key));
      const initVals: Record<string, any> = {};
      activeDef.availableFilters.forEach(f => {
        initVals[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
      });
      setFilterValues(initVals);
      setPage(1);
    }
  }, [activeReportKey]);

  // Fetch Report Data
  const runReport = () => {
    if (!activeDef) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = ReportService.executeReport(
        activeDef.key,
        filterValues,
        page,
        pageSize,
        undefined,
        activeColumns,
        currentUser
      );
      setQueryResult(result);
    } catch (err: any) {
      setError(err.message || 'فشل في تشغيل التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runReport();
  }, [activeReportKey, page, pageSize, activeColumns]);

  // Filter input change handler
  const handleFilterChange = (key: string, val: any) => {
    setFilterValues(prev => ({ ...prev, [key]: val }));
  };

  // Reset Filters to default
  const handleResetFilters = () => {
    if (!activeDef) return;
    const resetVals: Record<string, any> = {};
    activeDef.availableFilters.forEach(f => {
      resetVals[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    setFilterValues(resetVals);
    setPage(1);
  };

  // Save Filter action
  const handleSaveFilter = () => {
    if (!newFilterName.trim() || !currentUser?.id || !activeDef) return;
    ReportService.saveFilter(activeDef.key, newFilterName.trim(), filterValues, currentUser.id, false);
    setSavedFilters(ReportService.getSavedFilters(activeDef.key, currentUser.id));
    setNewFilterName('');
    setShowSaveModal(false);
  };

  const handleDeleteSavedFilter = (filterId: string) => {
    if (!currentUser?.id || !activeDef) return;
    ReportService.deleteSavedFilter(filterId, currentUser.id);
    setSavedFilters(ReportService.getSavedFilters(activeDef.key, currentUser.id));
  };

  const handleApplySavedFilter = (sf: SavedReportFilter) => {
    try {
      const parsed = JSON.parse(sf.filtersJson);
      setFilterValues(parsed);
      setPage(1);
    } catch {}
  };

  // Module filter tabs definition
  const moduleTabs: { id: ReportModule; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'STUDENTS', label: 'شؤون الطلاب والقيد', icon: GraduationCap },
    { id: 'ACADEMIC', label: 'الجدول والحصص والواجبات', icon: Calendar },
    { id: 'BEHAVIOR', label: 'الانضباط والخدمة الاجتماعية', icon: Sparkles },
    { id: 'HR', label: 'شؤون المعلمين والموظفين', icon: Users },
    { id: 'PAYROLL', label: 'الرواتب والمسير المالي', icon: Lock, adminOnly: true },
  ];

  const visibleModuleTabs = moduleTabs.filter(m => !m.adminOnly || isAdmin);
  const reportsInCurrentModule = availableDefs.filter(d => d.module === selectedModule);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">مركز التقارير والإحصائيات المدرسية الشامل</h1>
              <p className="text-xs text-slate-500 mt-1">
                استخراج وطباعة كشوفات وبيانات الطلاب، الحضور والغياب، الدوام، وجداول الحصص باحترافية
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => ReportService.exportToExcel(activeDef.key, filterValues, activeColumns, currentUser)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل (Excel)</span>
          </button>
          <button
            onClick={() => ReportService.exportToCsv(activeDef.key, filterValues, activeColumns, currentUser)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => ReportService.triggerPrintReport(activeDef.key, filterValues, activeColumns, currentUser)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة (PDF)</span>
          </button>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {visibleModuleTabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedModule(tab.id);
                const firstInMod = availableDefs.find(d => d.module === tab.id);
                if (firstInMod) setActiveReportKey(firstInMod.key);
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.adminOnly && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-rose-500/20 text-rose-300 font-medium">
                  إدارة
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Report Selector Dropdown & Saved Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">اختر التقرير:</span>
            <select
              value={activeReportKey}
              onChange={e => setActiveReportKey(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-w-[280px]"
            >
              {reportsInCurrentModule.map(r => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Saved Filters Dropdown */}
            {savedFilters.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-medium transition-colors">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>الفلاتر المحفوظة ({savedFilters.length})</span>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-20">
                  <div className="text-[11px] font-bold text-slate-400 px-2 py-1 mb-1 border-b border-slate-100">
                    نماذج الفلاتر الخاصة بك
                  </div>
                  {savedFilters.map(sf => (
                    <div
                      key={sf.id}
                      className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-xl text-xs"
                    >
                      <button
                        onClick={() => handleApplySavedFilter(sf)}
                        className="text-right text-slate-700 font-medium hover:text-teal-700 flex-1 truncate"
                      >
                        {sf.name}
                      </button>
                      <button
                        onClick={() => handleDeleteSavedFilter(sf.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              title="حفظ الفلاتر الحالية لسرعة الاستدعاء"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>حفظ الفلتر</span>
            </button>

            <button
              onClick={() => setShowColumnModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>تخصيص الأعمدة ({activeColumns.length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          {activeDef?.availableFilters.map(filterDef => {
            const currentVal = filterValues[filterDef.key] !== undefined ? filterValues[filterDef.key] : '';

            if (filterDef.type === 'select') {
              let options = filterDef.options;
              if (!options) {
                if (filterDef.key === 'grade') {
                  const settings = storageService.getSettings();
                  options = [
                    { value: 'ALL', label: 'جميع الصفوف' },
                    ...(settings.grades || []).map(g => {
                      const val = typeof g === 'string' ? g : (g.name || g.shortName || g.id);
                      return { value: val, label: val };
                    }),
                  ];
                } else if (filterDef.key === 'classroom') {
                  const settings = storageService.getSettings();
                  options = [
                    { value: 'ALL', label: 'جميع الفصول' },
                    ...(settings.classrooms || []).map(c => {
                      const val = typeof c === 'string' ? c : (c.displayName || c.classroomNumber || c.id);
                      return { value: val, label: val };
                    }),
                  ];
                } else if (filterDef.key === 'department') {
                  const settings = storageService.getSettings();
                  options = [
                    { value: 'ALL', label: 'جميع الأقسام' },
                    ...(settings.departments || []).map(d => {
                      const val = typeof d === 'string' ? d : (d.name || d.id);
                      return { value: val, label: val };
                    }),
                  ];
                } else if (filterDef.key === 'subject') {
                  const settings = storageService.getSettings();
                  options = [
                    { value: 'ALL', label: 'جميع المواد' },
                    ...(settings.subjects || []).map(s => {
                      const val = typeof s === 'string' ? s : (s.name || s.shortName || s.id);
                      return { value: val, label: val };
                    }),
                  ];
                } else if (filterDef.key === 'teacherName') {
                  const emps = storageService.getEmployees();
                  options = [
                    { value: 'ALL', label: 'جميع المعلمين' },
                    ...emps.map(e => ({ value: e.name, label: e.name })),
                  ];
                }
              }

              return (
                <div key={filterDef.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">{filterDef.label}</label>
                  <select
                    value={currentVal}
                    onChange={e => handleFilterChange(filterDef.key, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    {(options || []).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (filterDef.type === 'date') {
              return (
                <div key={filterDef.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">{filterDef.label}</label>
                  <input
                    type="date"
                    value={currentVal}
                    onChange={e => handleFilterChange(filterDef.key, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              );
            }

            if (filterDef.type === 'month') {
              return (
                <div key={filterDef.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">{filterDef.label}</label>
                  <select
                    value={currentVal}
                    onChange={e => handleFilterChange(filterDef.key, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    {[
                      { v: '1', l: 'يناير' },
                      { v: '2', l: 'فبراير' },
                      { v: '3', l: 'مارس' },
                      { v: '4', l: 'أبريل' },
                      { v: '5', l: 'مايو' },
                      { v: '6', l: 'يونيو' },
                      { v: '7', l: 'يوليو' },
                      { v: '8', l: 'أغسطس' },
                      { v: '9', l: 'سبتمبر' },
                      { v: '10', l: 'أكتوبر' },
                      { v: '11', l: 'نوفمبر' },
                      { v: '12', l: 'ديسمبر' },
                    ].map(m => (
                      <option key={m.v} value={m.v}>
                        {m.l}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={filterDef.key} className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{filterDef.label}</label>
                <input
                  type={filterDef.type === 'number' ? 'number' : 'text'}
                  value={currentVal}
                  placeholder={filterDef.placeholder}
                  onChange={e => handleFilterChange(filterDef.key, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            );
          })}

          {/* Filter Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={runReport}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تطبيق الفلتر</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="إعادة التعيين"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Data Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Summary & Stats */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-semibold text-slate-600">
            <span>التقرير: <strong className="text-slate-900">{activeDef?.name}</strong></span>
            <span className="text-slate-300">|</span>
            <span>إجمالي السجلات: <strong className="text-teal-700">{queryResult?.totalRows || 0}</strong></span>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">عرض في الصفحة:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
            >
              <option value={25}>25 سجل</option>
              <option value={50}>50 سجل</option>
              <option value={100}>100 سجل</option>
            </select>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                {queryResult?.columns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3.5 px-4 ${
                      col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={queryResult?.columns.length || 5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span>جاري معالجة وتجهيز بيانات التقرير...</span>
                    </div>
                  </td>
                </tr>
              ) : queryResult?.rows.length === 0 ? (
                <tr>
                  <td colSpan={queryResult?.columns.length || 5} className="py-12 text-center text-slate-400">
                    لا توجد سجلات تطابق الفلاتر المحددة حالياً.
                  </td>
                </tr>
              ) : (
                queryResult?.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {queryResult.columns.map(col => {
                      const val = row[col.key];
                      const isStatus = col.key === 'status';
                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 font-medium text-slate-700 ${
                            col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                          }`}
                        >
                          {isStatus ? (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                val === 'حاضر' || val === 'نشط' || val === 'منفذة' || val === 'معتمد' || val === 'مصروف ومحول'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : val === 'متأخر' || val === 'احتياط'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {val}
                            </span>
                          ) : val !== undefined && val !== null ? (
                            val
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {queryResult && queryResult.totalPages > 1 && (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
            <div className="text-slate-500">
              الصفحة <strong>{queryResult.page}</strong> من <strong>{queryResult.totalPages}</strong> (إجمالي {queryResult.totalRows} نتيجة)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, queryResult.totalPages) }, (_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === pNum
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                disabled={page >= queryResult.totalPages}
                onClick={() => setPage(p => Math.min(queryResult.totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">حفظ نموذج الفلتر الحالي</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              اكتب اسماً مألوفاً لتسهيل استدعاء نفس خيارات الفلترة المحددة بضغطة زر لاحقاً:
            </p>
            <input
              type="text"
              value={newFilterName}
              placeholder="مثال: غياب طلاب الصف الأول بدون عذر"
              onChange={e => setNewFilterName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveFilter}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                حفظ النموذج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Columns Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">تخصيص أعمدة الجدول المعروضة</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              حدد الأعمدة التي ترغب بظهورها في شاشة العرض وملفات التصدير والطباعة:
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {activeDef?.availableColumns.map(col => {
                const isChecked = activeColumns.includes(col.key);
                return (
                  <label
                    key={col.key}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        if (e.target.checked) {
                          setActiveColumns(prev => [...prev, col.key]);
                        } else {
                          setActiveColumns(prev => prev.filter(k => k !== col.key));
                        }
                      }}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">{col.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() =>
                  setActiveColumns(activeDef?.availableColumns.map(c => c.key) || [])
                }
                className="text-xs font-bold text-teal-600 hover:underline"
              >
                تحديد جميع الأعمدة
              </button>
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                إغلاق واعتماد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
