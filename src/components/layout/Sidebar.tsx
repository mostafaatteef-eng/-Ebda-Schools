import React from 'react';
import {
  Activity,
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
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Sun,
  UploadCloud,
  UserCheck,
  Users,
} from 'lucide-react';
import { PermissionKey, User } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { canAccessTab } from '../../utils/navigation';
import { NTSSLogo } from '../common/NTSSLogo';

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'student_attendance'
  | 'behavior'
  | 'teacher_portal'
  | 'parent_portal'
  | 'parent_day_view'
  | 'daily_attendance'
  | 'monthly_matrix'
  | 'employees'
  | 'payroll'
  | 'leaves'
  | 'master_data'
  | 'import_center'
  | 'backup'
  | 'system_health'
  | 'reports'
  | 'operations'
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
      title: 'شئون الطلاب والمدرسة',
      items: [
        {
          id: 'students',
          label: 'سجلات وبيانات الطلاب والقيد',
          icon: GraduationCap,
          permission: 'students.view',
        },
        {
          id: 'student_attendance',
          label: 'رصد حضور وغياب الطلاب',
          icon: UserCheck,
          badge: 'يومي',
          permission: 'studentAttendance.view',
        },
        {
          id: 'behavior',
          label: 'لائحة الانضباط والخدمة الاجتماعية',
          icon: Shield,
          permission: 'behavior.view',
        },
        {
          id: 'teacher_portal',
          label: 'بوابة المعلم واليوم الدراسي',
          icon: BookOpen,
          permission: 'teacherPortal.access',
        },
        {
          id: 'parent_day_view',
          label: 'اليوم الدراسي لابنك',
          icon: Sun,
          badge: 'مباشر',
        },
        {
          id: 'parent_portal',
          label: 'بوابة ولي الأمر الشاملة',
          icon: HeartHandshake,
          permission: 'parentPortal.access',
        },
      ],
    },
    {
      title: 'شئون المعلمين والعاملين',
      items: [
        {
          id: 'employees',
          label: 'سجلات المعلمين والعاملين',
          icon: Users,
          permission: 'teachers.view',
        },
        {
          id: 'daily_attendance',
          label: 'دفتر دوام العاملين اليومي',
          icon: Clock,
          permission: 'teacherAttendance.view',
        },
        {
          id: 'monthly_matrix',
          label: 'المصفوفة الشهرية لدوام العاملين',
          icon: CalendarDays,
          permission: 'teacherAttendance.view',
        },
        {
          id: 'leaves',
          label: 'إدارة الإجازات والأذونات الرسمية',
          icon: CalendarRange,
          permission: 'leaves.view',
        },
        {
          id: 'payroll',
          label: 'محرك ومسير الرواتب',
          icon: Banknote,
          badge: 'إدارة فقط',
          adminOnly: true,
        },
      ],
    },
    {
      title: 'التقارير والنظام والرقابة',
      items: [
        {
          id: 'reports',
          label: 'مركز التقارير والإحصائيات',
          icon: FileText,
          permission: 'reports.view',
        },
        {
          id: 'import_center',
          label: 'مركز الاستيراد والتحديث الذكي',
          icon: UploadCloud,
          adminOnly: true,
          badge: 'استيراد',
        },
        {
          id: 'system_health',
          label: 'صحة النظام وفحص الأداء',
          icon: Activity,
          adminOnly: true,
        },
        {
          id: 'master_data',
          label: 'إدارة القوائم والتعريفات الوزارية',
          icon: Database,
          adminOnly: true,
        },
        {
          id: 'backup',
          label: 'النسخ الاحتياطي والأرشفة',
          icon: ShieldCheck,
          adminOnly: true,
        },
        {
          id: 'operations',
          label: 'مركز التشغيل والجاهزية الفنية',
          icon: Server,
          adminOnly: true,
        },
        {
          id: 'users',
          label: 'إدارة المستخدمين والصلاحيات',
          icon: ShieldCheck,
          adminOnly: true,
          permission: 'users.manage',
        },
        {
          id: 'audit',
          label: 'سجل العمليات والرقابة الأمنية',
          icon: History,
          permission: 'audit.view',
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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <NTSSLogo />
          <button
            onClick={handleCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {navSections.map(section => {
            const visibleItems = section.items.filter(item => {
              // 1. Strict route guard (enforces role boundaries: Parent, Teacher, StudentAffairs, etc.)
              if (!canAccessTab(currentUser, item.id)) return false;
              // 2. Admin-only check
              if (item.adminOnly && userRole !== 'Admin') return false;
              // 3. Permission check
              if (item.permission && !hasPermission(currentUser, item.permission)) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#008e8b] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-teal-50 text-[#008e8b] border border-teal-100'
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[10px] text-slate-400 text-center font-medium">
            نظام إدارة المدارس والموارد البشرية © 2026
          </div>
        </div>
      </aside>
    </>
  );
};
