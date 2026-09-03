import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  Shield,
  X,
  ExternalLink,
  Trash2,
  Filter,
  Sparkles,
  Award,
} from 'lucide-react';
import { AppNotification, NotificationCategory, UserRole } from '../../types';
import { NotificationService } from '../../services/notificationService';
import { formatEgyptianDate } from '../../utils/egyptianTime';

interface NotificationBellProps {
  userRole?: UserRole;
  userId?: string;
  targetStudentId?: string;
  onNavigate?: (actionUrl: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userRole,
  userId,
  targetStudentId,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    NotificationService.getNotifications(userRole, userId, targetStudentId)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'ALL'>('ALL');

  const refresh = () => {
    setNotifications(NotificationService.getNotifications(userRole, userId, targetStudentId));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [userRole, userId, targetStudentId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    NotificationService.markAsRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(userRole, userId, targetStudentId);
    refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.deleteNotification(id);
    refresh();
  };

  const handleActionClick = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    if (notif.actionUrl && onNavigate) {
      onNavigate(notif.actionUrl);
      setIsOpen(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'ALL') return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category?: NotificationCategory) => {
    switch (category) {
      case 'Attendance':
        return <Clock className="w-3.5 h-3.5 text-rose-500" />;
      case 'Behavior':
        return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      case 'Homework':
        return <BookOpen className="w-3.5 h-3.5 text-[#008e8b]" />;
      case 'Schedule':
        return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="relative" id="notification-center-container">
      {/* Bell Icon Trigger */}
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
        title="التنبيهات والإشعارات"
        aria-label="مركز التنبيهات"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Flyout Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[92vw] sm:w-[420px] max-w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Panel Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#008e8b] flex items-center justify-center border border-teal-100">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">مركز التنبيهات الداخلي</h3>
                  <p className="text-[10px] text-slate-500">إشعارات الحضور، الواجبات، والسلوك</p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-[#008e8b] hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px] font-bold">
              {(
                [
                  { key: 'ALL', label: 'الكل' },
                  { key: 'Attendance', label: 'الحضور' },
                  { key: 'Homework', label: 'الواجبات' },
                  { key: 'Behavior', label: 'السلوك' },
                  { key: 'Schedule', label: 'الجدول' },
                ] as const
              ).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.key
                      ? 'bg-[#008e8b] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2.5 space-y-2">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    className={`p-3.5 rounded-2xl border transition-all text-right relative group cursor-pointer ${
                      notif.isRead
                        ? 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        : 'bg-teal-50/30 border-teal-200 text-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100">
                          {getCategoryIcon(notif.category)}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900">{notif.title}</span>
                          {notif.priority === 'HIGH' || notif.priority === 'URGENT' ? (
                            <span className="mr-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                              عاجل
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {notif.createdAt?.split('T')[0] || ''}
                        </span>
                        <button
                          onClick={e => handleDelete(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-md transition-opacity"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed pr-8">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
                      {notif.actionUrl ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleActionClick(notif);
                          }}
                          className="font-bold text-[#008e8b] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>عرض التفاصيل</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">إشعار مدرسي تلقائي</span>
                      )}

                      {!notif.isRead ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="text-[#008e8b] font-bold flex items-center gap-1 hover:underline"
                        >
                          <Check className="w-3 h-3" />
                          <span>تحديد كمقروء</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <CheckCheck className="w-3 h-3 text-emerald-500" />
                          <span>تم الاطلاع</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-6 h-6" />
                  </div>
                  لا توجد تنبيهات في هذا التصنيف حالياً.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
