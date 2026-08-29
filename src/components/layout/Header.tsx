import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Menu,
  RefreshCw,
  LogOut,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SyncStatus, SystemSettings, User as UserType } from '../../types';
import { ARABIC_DAYS, ARABIC_MONTHS } from '../../utils/attendanceUtils';
import { NTSSLogo } from '../common/NTSSLogo';

interface HeaderProps {
  currentUser: UserType | null;
  syncState?: SyncStatus;
  settings?: SystemSettings;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenSyncModal?: () => void;
  onOpenUserSwitchModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  syncState,
  settings: propSettings,
  onLogout,
  onToggleMobileMenu
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncState || storageService.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setSyncStatus(storageService.getSyncStatus());
    });
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleQuickSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await storageService.syncWithGoogleSheets();
    setIsSyncing(false);
  };

  const formattedDate = `${ARABIC_DAYS[currentTime.getDay()]}، ${currentTime.getDate()} ${
    ARABIC_MONTHS[currentTime.getMonth()]
  } ${currentTime.getFullYear()}`;
  const formattedTime = currentTime.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'مدير النظام';
      case 'HR':
        return 'الموارد البشرية';
      case 'Supervisor':
        return 'مشرف قسم';
      case 'Employee':
        return 'موظف';
      case 'Viewer':
        return 'مشاهد';
      default:
        return 'مستخدم';
    }
  };

  const userInitial = currentUser?.fullName ? currentUser.fullName.charAt(0) : 'م';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* 1. Left: Brand & Mobile Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="القائمة الرئيسية"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <NTSSLogo variant="compact" size="sm" />
        </div>
      </div>

      {/* 2. Center: Live Date & Clock Pill (Apple-style subtle surface) */}
      <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/60 px-3.5 py-1.5 rounded-full">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-[#008e8b]" />
          <span>{formattedDate}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold tracking-tight">
          <Clock className="w-3.5 h-3.5 text-[#008e8b]" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* 3. Right: Live Server Sync Refresh & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh Data Button */}
        <button
          id="btn-refresh-data"
          onClick={handleQuickSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-[#008e8b] border border-slate-200 hover:border-teal-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          title="تحديث ومزامنة البيانات مع الخادم"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#008e8b]' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'جارٍ التحديث...' : 'تحديث'}</span>
        </button>

        {/* User Card Pill */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <div className="flex items-center gap-2.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200/60">
            <div className="w-7 h-7 rounded-full bg-[#008e8b]/10 border border-[#008e8b]/20 flex items-center justify-center text-[#008e8b] font-bold text-xs">
              {userInitial}
            </div>
            <div className="flex flex-col items-start text-right hidden sm:flex">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.fullName || 'المستخدم'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                {getRoleTitle(currentUser?.role)}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
