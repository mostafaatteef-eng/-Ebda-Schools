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

  const filteredLogs = logs.filter(log => {
    const matchAction = actionFilter === 'الكل' || log.action === actionFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      (log.performedBy || log.username || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.targetId || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.targetEntity || '').toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-semibold">إضافة (CREATE)</span>;
      case 'UPDATE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">تعديل (UPDATE)</span>;
      case 'DELETE':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-semibold">حذف (DELETE)</span>;
      case 'SYNC':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-semibold">مزامنة (SYNC)</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">{action}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            سجل العمليات والرقابة (Audit Log)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل توثيقي غير قابل للتلاعب لكافة عمليات الإضافة والتعديل والحذف وتاريخ تنفيذها
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          إجمالي العمليات المسجلة: <strong className="text-slate-800">{logs.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في تفاصيل العملية أو المستخدم..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span>نوع العملية:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-indigo-600 font-semibold"
          >
            <option value="الكل">الكل</option>
            <option value="CREATE">إضافة (CREATE)</option>
            <option value="UPDATE">تعديل (UPDATE)</option>
            <option value="DELETE">حذف (DELETE)</option>
            <option value="SYNC">مزامنة (SYNC)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم العملية</th>
                <th className="py-3 px-4">التوقيت والتاريخ</th>
                <th className="py-3 px-4">المستخدم المنفذ</th>
                <th className="py-3 px-4">نوع العملية</th>
                <th className="py-3 px-4">الكيان / المستهدف</th>
                <th className="py-3 px-4">التفاصيل والتغييرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد سجلات تطابق عوامل البحث.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{log.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.performedBy}</td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">{log.targetEntity}</span> #{log.targetId}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
