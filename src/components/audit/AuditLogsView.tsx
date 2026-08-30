import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Download,
  Filter,
  History,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react';
import { AuditLog } from '../../types';
import { storageService } from '../../services/storageService';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('الكل');
  const [entityFilter, setEntityFilter] = useState('الكل');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchAction = actionFilter === 'الكل' || log.action === actionFilter;
    const matchEntity = entityFilter === 'الكل' || log.entity === entityFilter || log.targetEntity === entityFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      (log.performedBy || log.username || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.targetId || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity || '').toLowerCase().includes(q) ||
      (log.targetEntity || '').toLowerCase().includes(q);
    return matchAction && matchEntity && matchSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold">إضافة (CREATE)</span>;
      case 'UPDATE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold">تعديل (UPDATE)</span>;
      case 'DELETE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-bold">حذف (DELETE)</span>;
      case 'SYNC':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[11px] font-bold">مزامنة (SYNC)</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-bold">{action}</span>;
    }
  };

  const getEntityBadge = (entity?: string) => {
    switch (entity) {
      case 'SETTINGS':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">إعدادات النظام</span>;
      case 'STUDENT':
      case 'STUDENTS':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">شؤون الطلاب</span>;
      case 'STUDENT_ATTENDANCE':
      case 'ATTENDANCE':
        return <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">سجلات الحضور</span>;
      case 'PAYROLL':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">المرتبات والأجور</span>;
      case 'BEHAVIOR':
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">الانضباط والسلوك</span>;
      case 'SCHEDULE':
      case 'LESSON':
        return <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">الجدول والدروس</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{entity || 'عام'}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-[#008e8b]" />
            سجل العمليات والرقابة (Audit Log)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق إلكتروني فوري ودقيق لكافة عمليات النظام وتعديلات الإعدادات مع حفظ القيمة السابقة والجديدة والتوقيت
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
          إجمالي العمليات المسجلة: <strong className="text-slate-900 font-mono">{logs.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في تفاصيل العملية، المستخدم، أو الكيان..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-900 focus:outline-hidden focus:border-[#008e8b]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span>القسم / الكيان:</span>
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="الكل">كافة الأقسام</option>
              <option value="SETTINGS">إعدادات النظام (Settings)</option>
              <option value="STUDENT">شؤون الطلاب</option>
              <option value="ATTENDANCE">سجلات الحضور</option>
              <option value="BEHAVIOR">السلوك والانضباط</option>
              <option value="SCHEDULE">الجدول المدرسي</option>
              <option value="PAYROLL">المرتبات والأجور</option>
              <option value="LEAVE">الإجازات والأذونات</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>نوع العملية:</span>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="الكل">كافة العمليات</option>
              <option value="CREATE">إضافة (CREATE)</option>
              <option value="UPDATE">تعديل (UPDATE)</option>
              <option value="DELETE">حذف (DELETE)</option>
              <option value="SYNC">مزامنة (SYNC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم العملية</th>
                <th className="py-3 px-4">التوقيت والتاريخ</th>
                <th className="py-3 px-4">المستخدم المنفذ</th>
                <th className="py-3 px-4">نوع العملية</th>
                <th className="py-3 px-4">الكيان المستهدف</th>
                <th className="py-3 px-4">التفاصيل والتغييرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد سجلات رقابية تطابق عوامل البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDiff = !!(log.oldValue || log.newValue);

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 text-[11px]">{log.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{log.performedBy || log.username}</div>
                          {log.userRole && (
                            <span className="text-[10px] text-slate-400 font-mono">({log.userRole})</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                        <td className="py-3 px-4">
                          {getEntityBadge(log.entity || log.targetEntity)}
                          {log.targetId && (
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">#{log.targetId}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <div className="text-slate-800 font-semibold">{log.details}</div>
                          {hasDiff && (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="mt-1 text-[11px] text-[#008e8b] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? 'إخفاء مقارنة القيم السابقة والجديدة ▴' : 'عرض القيم السابقة والجديدة ▾'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasDiff && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="space-y-1">
                                <span className="font-bold text-rose-700 block text-[11px]">القيمة السابقة (Old Value):</span>
                                <pre className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                  {log.oldValue || '— (لا يوجد)'}
                                </pre>
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-emerald-700 block text-[11px]">القيمة الجديدة (New Value):</span>
                                <pre className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                  {log.newValue || '— (لا يوجد)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
