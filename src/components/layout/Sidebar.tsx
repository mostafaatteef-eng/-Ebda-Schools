import React from 'react';
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCheck,
  Users,
  ChevronLeft
} from 'lucide-react';
import { User } from '../../types';
import { NTSSLogo } from '../common/NTSSLogo';

export type ActiveTab =
  | 'dashboard'
  | 'daily_attendance'
  | 'monthly_matrix'
  | 'annual_summary'
  | 'employees'
  | 'leaves'
  | 'reports'
  | 'users'
  | 'settings'
  | 'audit';

interface SidebarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: any) => void;
  currentUser: User | null;
  isMobileMenuOpen?: boolean;
  isOpenMobile?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    roles: string[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  currentUser,
  isMobileMenuOpen,
  isOpenMobile,
  setIsMobileMenuOpen,
  onCloseMobile
}) => {
  const isMobileOpen = isMobileMenuOpen ?? isOpenMobile ?? false;
  const handleCloseMobile = () => {
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelect = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
    handleCloseMobile();
  };

  const role = currentUser?.role || 'Admin';

  const navSections: NavSection[] = [
    {
      title: 'الرئيسية واليوميات',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة التحكم',
          icon: LayoutDashboard,
          roles: ['Admin', 'HR', 'Supervisor', 'Employee', 'Viewer']
        },
        {
          id: 'daily_attendance',
          label: 'تسجيل الحضور اليومي',
          icon: Clock,
          badge: 'اليوم',
          roles: ['Admin', 'HR', 'Supervisor', 'Employee', 'Viewer']
        },
        {
          id: 'monthly_matrix',
          label: 'المصفوفة الشهرية',
          icon: CalendarDays,
          roles: ['Admin', 'HR', 'Supervisor', 'Viewer']
        },
        {
          id: 'annual_summary',
          label: 'الملخص السنوي',
          icon: CalendarRange,
          roles: ['Admin', 'HR', 'Supervisor', 'Viewer']
        }
      ]
    },
    {
      title: 'إدارة الفريق والطلبات',
      items: [
        {
          id: 'employees',
          label: 'دليل الموظفين',
          icon: Users,
          roles: ['Admin', 'HR', 'Supervisor', 'Viewer']
        },
        {
          id: 'leaves',
          label: 'الإجازات والأذونات',
          icon: UserCheck,
          roles: ['Admin', 'HR', 'Supervisor', 'Employee', 'Viewer']
        }
      ]
    },
    {
      title: 'التحليلات والنظام',
      items: [
        {
          id: 'reports',
          label: 'التقارير والتصدير',
          icon: FileText,
          roles: ['Admin', 'HR', 'Supervisor', 'Viewer']
        },
        {
          id: 'users',
          label: 'المستخدمون والصلاحيات',
          icon: ShieldCheck,
          roles: ['Admin']
        },
        {
          id: 'audit',
          label: 'سجل العمليات والرقابة',
          icon: History,
          roles: ['Admin', 'HR']
        },
        {
          id: 'settings',
          label: 'إعدادات النظام',
          icon: SettingsIcon,
          roles: ['Admin']
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={handleCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 right-0 bottom-0 w-64 bg-[#ffffff] border-l border-slate-200/80 p-3 z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 select-none shadow-xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-5 overflow-y-auto custom-scrollbar flex-1 px-1 pt-1">
          {navSections.map((section, idx) => {
            const allowedItems = section.items.filter(item => item.roles.includes(role));
            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1">
                  {section.title}
                </div>

                <div className="space-y-0.5">
                  {allowedItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        id={`nav-link-${item.id}`}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#008e8b] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-teal-50 text-[#008e8b]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal Bottom Footer */}
        <div className="pt-3 mt-2 border-t border-slate-100 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>متصل مباشرة</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v2.5 SaaS</span>
        </div>
      </aside>
    </>
  );
};
