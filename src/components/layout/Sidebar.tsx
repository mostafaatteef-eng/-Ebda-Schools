import React from 'react';
import {
  Banknote,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  Clock,
  Database,
  FileText,
  GraduationCap,
  HeartHandshake,
  History,
  LayoutDashboard,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { PermissionKey, User } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { NTSSLogo } from '../common/NTSSLogo';

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'student_attendance'
  | 'behavior'
  | 'teacher_portal'
  | 'parent_portal'
  | 'daily_attendance'
  | 'monthly_matrix'
  | 'employees'
  | 'payroll'
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  permission?: PermissionKey;
  adminOnly?: boolean;
  hideForRoles?: string[];
  showForRoles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  currentUser,
  isMobileMenuOpen,
  isOpenMobile,
  setIsMobileMenuOpen,
  onCloseMobile,
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

  const userRole = currentUser?.role || 'Admin';

  const navSections: NavSection[] = [
    {
      title: 'الرئيسية والمتابعة',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة التحكم',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'شؤون الطلاب والمدرسة',
      items: [
        {
          id: 'students',
          label: 'سجلات وبيانات الطلاب',
          icon: GraduationCap,
          permission: 'students.view',
          hideForRoles: ['TeacherAffairs', 'Parent'],
        },
        {
          id: 'student_attendance',
          label: 'رصد حضور الطلاب',
          icon: UserCheck,
          badge: 'يومي',
          permission: 'studentAttendance.view',
          hideForRoles: ['TeacherAffairs', 'Parent'],
        },
        {
          id: 'behavior',
          label: 'لائحة الانضباط والسلوك',
          icon: Shield,
          permission: 'behavior.view',
          hideForRoles: ['TeacherAffairs', 'Parent'],
        },
        {
          id: 'teacher_portal',
          label: 'الجدول وبوابة المعلم',
          icon: BookOpen,
          permission: 'schedule.view',
          hideForRoles: ['Parent', 'TeacherAffairs'],
        },
        {
          id: 'parent_portal',
          label: 'بوابة ولي الأمر',
          icon: HeartHandshake,
          permission: 'parentPortal.access',
          showForRoles: ['Parent', 'Admin'],
        },
      ],
    },
    {
      title: 'شؤون المعلمين والموظفين',
      items: [
        {
          id: 'employees',
          label: 'المعلمون والموظفون',
          icon: Users,
          permission: 'teachers.view',
          hideForRoles: ['StudentAffairs', 'SocialSpecialist', 'Teacher', 'Parent'],
        },
        {
          id: 'daily_attendance',
          label: 'دوام الموظفين اليومي',
          icon: Clock,
          permission: 'teacherAttendance.view',
          hideForRoles: ['StudentAffairs', 'SocialSpecialist', 'Teacher', 'Parent'],
        },
        {
          id: 'monthly_matrix',
          label: 'المصفوفة الشهرية للدوام',
          icon: CalendarDays,
          permission: 'teacherAttendance.view',
          hideForRoles: ['StudentAffairs', 'SocialSpecialist', 'Teacher', 'Parent'],
        },
        {
          id: 'leaves',
          label: 'الإجازات والأذونات',
          icon: CalendarRange,
          permission: 'leaves.view',
          hideForRoles: ['StudentAffairs', 'Parent'],
        },
        {
          id: 'payroll',
          label: 'محرك ومسير الرواتب',
          icon: Banknote,
          badge: 'إدارة فقط',
          adminOnly: true, // STRICT ADMIN ONLY
          hideForRoles: ['TeacherAffairs', 'StudentAffairs', 'Teacher', 'SocialSpecialist', 'Parent', 'HR', 'Supervisor'],
        },
      ],
    },
    {
      title: 'النظام والتقارير والرقابة',
      items: [
        {
          id: 'reports',
          label: 'التقارير المدرسية',
          icon: FileText,
          permission: 'reports.view',
          hideForRoles: ['Parent'],
        },
        {
          id: 'users',
          label: 'المستخدمون والصلاحيات',
          icon: ShieldCheck,
          adminOnly: true,
          permission: 'users.manage',
        },
        {
          id: 'audit',
          label: 'سجل العمليات والرقابة',
          icon: History,
          permission: 'audit.view',
          hideForRoles: ['Teacher', 'Parent'],
        },
        {
          id: 'settings',
          label: 'إعدادات النظام والمدرسة',
          icon: SettingsIcon,
          adminOnly: true,
          permission: 'settings.manage',
        },
      ],
    },
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
        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 px-1 pt-1">
          {navSections.map((section, idx) => {
            const allowedItems = section.items.filter(item => {
              // 1. Check Admin Only
              if (item.adminOnly && userRole !== 'Admin') {
                return false;
              }

              // 2. Check Role Whitelist
              if (item.showForRoles && !item.showForRoles.includes(userRole)) {
                return false;
              }

              // 3. Check Role Blacklist
              if (item.hideForRoles && item.hideForRoles.includes(userRole)) {
                return false;
              }

              // 4. Check Granular Permission
              if (item.permission) {
                return hasPermission(currentUser, item.permission);
              }

              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
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
            <span>نظام مدرسي متكامل</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v3.0 Egypt</span>
        </div>
      </aside>
    </>
  );
};
