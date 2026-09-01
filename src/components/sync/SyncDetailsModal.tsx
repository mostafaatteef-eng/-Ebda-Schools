import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cloud,
  CloudOff,
  Clock,
  ArrowRightLeft,
  X,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SyncQueueService } from '../../services/syncQueueService';
import { SyncQueueItem, SyncStatus } from '../../types';
import { formatEgyptianDate } from '../../utils/egyptianTime';

interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDetailsModal: React.FC<SyncDetailsModalProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(storageService.getSyncStatus());
  const [queueSummary, setQueueSummary] = useState(SyncQueueService.getQueueSummary());
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshState = () => {
    setSyncStatus(storageService.getSyncStatus());
    setQueueSummary(SyncQueueService.getQueueSummary());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
      const unsub = storageService.subscribe(() => {
        refreshState();
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActionMessage('جارٍ المزامنة السحابية وسحب البيانات...');
    try {
      const ok = await storageService.syncWithGoogleSheets();
      if (ok) {
        setActionMessage('تمت المزامنة بنجاح');
      } else {
        setActionMessage('تعذر إكمال المزامنة السحابية');
      }
    } catch (e: any) {
      setActionMessage(`خطأ: ${e.message || 'فشلت المزامنة'}`);
    } finally {
      setIsProcessing(false);
      refreshState();
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRetryFailed = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActionMessage('جارٍ إعادة محاولة العمليات المعلقة...');
    try {
      const res = await storageService.retrySyncQueue();
      setActionMessage(`تمت معالجة ${res.processed} عملية (نجح: ${res.succeeded}، فشل: ${res.failed})`);
    } catch (e: any) {
      setActionMessage(`خطأ أثناء المحاولة: ${e.message}`);
    } finally {
      setIsProcessing(false);
      refreshState();
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleClearSynced = () => {
    SyncQueueService.clearSynced();
    refreshState();
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOnline ? 'bg-teal-50 text-[#008e8b] border border-teal-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">حالة المزامنة السحابية وقائمة العمليات</h3>
              <p className="text-[11px] text-slate-500">
                {isOnline ? 'متصل بالإنترنت • خادم Google Sheets' : 'وضع عدم الاتصال (Offline) • التغييرات محفوظة محلياً'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action notification */}
        {actionMessage && (
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-[#008e8b] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Sync Summary Cards */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-[10px] font-bold text-slate-500 mb-1">العمليات المعلقة</div>
            <div className="text-base font-black text-amber-600">{queueSummary.pending}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-[10px] font-bold text-slate-500 mb-1">فشلت بعد محاولات</div>
            <div className="text-base font-black text-rose-600">{queueSummary.failed}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-[10px] font-bold text-slate-500 mb-1">المزامنة الأخيرة</div>
            <div className="text-[11px] font-mono font-bold text-slate-700 truncate">
              {syncStatus.lastSyncTime ? syncStatus.lastSyncTime.split('T')[1]?.slice(0, 5) : 'لم تتم بعد'}
            </div>
          </div>
        </div>

        {/* Queue List Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>سجل العمليات السحابية ({queueSummary.total}):</span>
            {queueSummary.synced > 0 && (
              <button
                onClick={handleClearSynced}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                تنظيف المكتمل
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
            {queueSummary.items.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                جميع التغييرات والبيانات متزامنة تماماً مع السيرفر السحابي.
              </div>
            ) : (
              queueSummary.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      item.status === 'synced'
                        ? 'bg-emerald-500'
                        : item.status === 'syncing'
                        ? 'bg-blue-500 animate-pulse'
                        : item.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`} />
                    <span className="font-bold text-slate-800">{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.entity})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.status === 'synced'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'syncing'
                        ? 'bg-blue-50 text-blue-700'
                        : item.status === 'failed'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status === 'synced'
                        ? 'مكتمل'
                        : item.status === 'syncing'
                        ? 'جارٍ المزامنة'
                        : item.status === 'failed'
                        ? `فشل (${item.attempts})`
                        : 'معلق'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.createdAt.split('T')[1]?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {queueSummary.failed > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={isProcessing}
              className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة محاولة العمليات الفاشلة
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handleManualSync}
              disabled={isProcessing}
              className="text-xs font-bold bg-[#008e8b] hover:bg-[#007a77] text-white px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              مزامنة سحابية كاملة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
