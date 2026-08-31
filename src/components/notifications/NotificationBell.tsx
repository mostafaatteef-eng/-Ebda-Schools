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
} from 'lucide-react';
import { AppNotification, UserRole } from '../../types';
import { NotificationService } from '../../services/notificationService';
import { formatEgyptianDate } from '../../utils/egyptianTime';

interface NotificationBellProps {
  userRole?: UserRole;
  userId?: string;
  onNavigate?: (actionUrl: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userRole, userId, onNavigate }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    NotificationService.getNotifications(userRole, userId)
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(NotificationService.getNotifications(userRole, userId));
    }, 10000);
    return () => clearInterval(interval);
  }, [userRole, userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    NotificationService.markAsRead(id);
    setNotifications(NotificationService.getNotifications(userRole, userId));
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(userRole, userId);
    setNotifications(NotificationService.getNotifications(userRole, userId));
  };

  const handleActionClick = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    if (notif.actionUrl && onNavigate) {
      onNavigate(notif.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
        title="التنبيهات والإشعارات"
        aria-label="مركز التنبيهات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Flyout Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Panel Header */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#008e8b]" />
                <h3 className="text-xs font-black text-slate-800">مركز التنبيهات الداخلي</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#008e8b] border border-teal-100">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-[#008e8b] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border transition-all text-right ${
                      notif.isRead
                        ? 'bg-white border-slate-100 text-slate-600'
                        : 'bg-teal-50/40 border-teal-100 text-slate-900 font-semibold'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            notif.priority === 'URGENT'
                              ? 'bg-rose-500'
                              : notif.priority === 'HIGH'
                              ? 'bg-amber-500'
                              : 'bg-[#008e8b]'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {notif.createdAt.split('T')[0]}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5">
                      {notif.actionUrl ? (
                        <button
                          onClick={() => handleActionClick(notif)}
                          className="text-[10px] font-bold text-[#008e8b] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>عرض السجل المرتبط</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                          title="تعيين كمقروء"
                        >
                          <Check className="w-3 h-3" />
                          <span>تم الاطلاع</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  لا توجد تنبيهات حالياً.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
