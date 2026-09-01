import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Menu,
  RefreshCw,
  LogOut,
  User as UserIcon,
  GraduationCap,
  Building,
  Search,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SyncStatus, SystemSettings, User as UserType } from '../../types';
import { getCairoCurrentTimeString, getEgyptianDayName, formatEgyptianDate, getCairoCurrentDate } from '../../utils/egyptianTime';
import { NotificationBell } from '../notifications/NotificationBell';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { SyncDetailsModal } from '../sync/SyncDetailsModal';

interface HeaderProps {
  currentUser: UserType | null;
  syncState?: SyncStatus;
  settings?: SystemSettings;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenSyncModal?: () => void;
  onOpenUserSwitchModal?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  syncState,
  settings: propSettings,
  onLogout,
  onToggleMobileMenu,
  onNavigate,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncState || storageService.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [cairoTime, setCairoTime] = useState<string>(getCairoCurrentTimeString());
  const [settings, setSettings] = useState<SystemSettings>(() => propSettings || storageService.getSettings());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setSyncStatus(storageService.getSyncStatus());
      setSettings(storageService.getSettings());
    });
    const timer = setInterval(() => {
      setCairoTime(getCairoCurrentTimeString());
    }, 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [propSettings]);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await storageService.syncWithGoogleSheets();
    setIsSyncing(false);
  };

  const todayKey = getCairoCurrentDate();
  const formattedDate = `${getEgyptianDayName(todayKey)}، ${formatEgyptianDate(todayKey)}`;

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'مدير النظام والمدرسة';
      case 'StudentAffairs':
        return 'شؤون الطلاب والقيد';
      case 'TeacherAffairs':
        return 'شؤون المعلمين والدوام';
      case 'Teacher':
        return 'معلم / هيئة التدريس';
      case 'SocialSpecialist':
        return 'أخصائي اجتماعي وإرشاد';
      case 'Parent':
        return 'ولي أمر طالب';
      case 'Viewer':
        return 'مشاهد ومراقب';
      default:
        return 'مستخدم';
    }
  };

  const userInitial = currentUser?.fullName ? currentUser.fullName.charAt(0) : 'م';

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30 shadow-xs">
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

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#008e8b] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {settings.schoolName || 'نظام الإدارة المدرسية والموارد البشرية'}
              </div>
              <div className="text-[10px] text-teal-700 font-semibold hidden sm:block">
                جمهورية مصر العربية • {settings.currentAcademicYear || '2026/2027'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Center: Global Search Bar Trigger & Live Clock */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search Button */}
          {currentUser?.role !== 'Parent' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>بحث سريع في النظام...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white text-slate-500 border border-slate-200 rounded-md">
                Ctrl+K
              </kbd>
            </button>
          )}

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/60 px-3.5 py-1.5 rounded-full">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#008e8b]" />
              <span>{formattedDate}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold tracking-tight" title="توقيت القاهرة الرسمي Africa/Cairo">
              <Clock className="w-3.5 h-3.5 text-[#008e8b]" />
              <span>{cairoTime} (القاهرة)</span>
            </div>
          </div>
        </div>

        {/* 3. Right: Notifications, Live Server Sync Refresh & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Internal Notifications Bell */}
          <NotificationBell
            userRole={currentUser?.role}
            userId={currentUser?.id}
            onNavigate={tab => onNavigate && onNavigate(tab)}
          />

          {/* Refresh Data Button & Queue Indicator */}
          <button
            id="btn-refresh-data"
            onClick={() => setIsSyncModalOpen(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-[#008e8b] border border-slate-200 hover:border-teal-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="حالة المزامنة وقائمة العمليات السحابية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#008e8b]' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'جارٍ المزامنة...' : 'المزامنة السحابية'}</span>
            {syncStatus.hasPendingChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="توجد تغييرات بانتظار المزامنة" />
            )}
          </button>

          {/* User Card Pill */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60">
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

      {/* Global Search Modal */}
      <GlobalSearchModal
        userRole={currentUser?.role}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(entity, item) => {
          if (entity === 'STUDENT' && onNavigate) onNavigate('students');
          if (entity === 'EMPLOYEE' && onNavigate) onNavigate('employees');
          if (entity === 'BEHAVIOR' && onNavigate) onNavigate('behavior');
        }}
      />

      {/* Cloud Sync & Queue Details Modal */}
      <SyncDetailsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </>
  );
};
