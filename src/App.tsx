import React, { useState, useEffect } from 'react';
import {
  AttendanceRecord,
  AuditLog,
  Employee,
  LeaveRecord,
  SyncState,
  SystemSettings,
  User,
} from './types';
import { storageService } from './services/storageService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { StudentAttendanceView } from './components/students/StudentAttendanceView';
import { BehaviorView } from './components/behavior/BehaviorView';
import { TeacherPortalView } from './components/schedule/TeacherPortalView';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { DailyAttendanceView } from './components/attendance/DailyAttendanceView';
import { MonthlyMatrixView } from './components/attendance/MonthlyMatrixView';
import { AnnualSummaryView } from './components/summary/AnnualSummaryView';
import { EmployeesView } from './components/employees/EmployeesView';
import { PayrollView } from './components/payroll/PayrollView';
import { LeavesView } from './components/leaves/LeavesView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [employees, setEmployees] = useState<Employee[]>(() => storageService.getEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storageService.getAttendance());
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => storageService.getLeaves());
  const [settings, setSettings] = useState<SystemSettings>(() => storageService.getSettings());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const [syncState, setSyncState] = useState<SyncState>(() => storageService.getSyncState());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setEmployees(storageService.getEmployees());
      setAttendance(storageService.getAttendance());
      setLeaves(storageService.getLeaves());
      setSettings(storageService.getSettings());
      setUsers(storageService.getUsers());
      setAuditLogs(storageService.getAuditLogs());
      setSyncState(storageService.getSyncState());
      setCurrentUser(storageService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Check login state
  if (!currentUser) {
    return <LoginView onLoginSuccess={user => setCurrentUser(user)} />;
  }

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const renderActiveView = () => {
    // 1. Strict Payroll Guard: ADMIN ONLY
    if (activeTab === 'payroll' && currentUser?.role !== 'Admin') {
      return (
        <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto text-center border border-rose-200 shadow-xs space-y-4 my-12">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🔒
          </div>
          <h2 className="text-lg font-black text-slate-900">غير مصرح بالوصول إلى مسير الرواتب</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            الوصول إلى قسم الرواتب والأمور المالية مخصص حصرياً لمدير النظام (Admin) للحفاظ على سرية البيانات المالية.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      );
    }

    // 2. Strict User / Settings / Payroll Management Guard
    if ((activeTab === 'users' || activeTab === 'settings' || activeTab === 'payroll' || activeTab === 'audit') && currentUser?.role !== 'Admin') {
      return (
        <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto text-center border border-rose-200 shadow-xs space-y-4 my-12">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🛡️
          </div>
          <h2 className="text-lg font-black text-slate-900">صلاحية مدير النظام مطلوبة (Admin Access Required)</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            الوصول إلى مسير الرواتب، سجل الرقابة والعمليات، إدارة المستخدمين، وإعدادات النظام تتطلب حصراً حساب مدير النظام (Admin).
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      );
    }

    // 3. Separation of Concerns Guards
    if ((activeTab === 'students' || activeTab === 'student_attendance') && currentUser?.role === 'TeacherAffairs') {
      return (
        <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto text-center border border-amber-200 shadow-xs space-y-4 my-12">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">القسم خاص بشؤون الطلاب</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            حساب شؤون المعلمين مخصص لدوام وسجلات المعلمين والموظفين فقط.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      );
    }

    if ((activeTab === 'employees' || activeTab === 'daily_attendance' || activeTab === 'monthly_matrix') && currentUser?.role === 'StudentAffairs') {
      return (
        <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto text-center border border-amber-200 shadow-xs space-y-4 my-12">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">القسم خاص بشؤون المعلمين والعاملين</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            حساب شؤون الطلاب مخصص لسجلات وحضور الطلاب والمدرسة فقط.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
            onNavigate={tab => setActiveTab(tab)}
          />
        );

      case 'students':
        return <StudentsView />;

      case 'student_attendance':
        return <StudentAttendanceView />;

      case 'behavior':
        return <BehaviorView />;

      case 'teacher_portal':
        return <TeacherPortalView />;

      case 'parent_portal':
        return <ParentPortalView />;

      case 'payroll':
        return <PayrollView />;

      case 'daily_attendance':
        return (
          <DailyAttendanceView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'monthly_matrix':
        return (
          <MonthlyMatrixView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'annual_summary':
        return (
          <AnnualSummaryView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'employees':
        return (
          <EmployeesView
            employees={employees}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'leaves':
        return (
          <LeavesView
            employees={employees}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'reports':
        return (
          <ReportsView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
          />
        );

      case 'users':
        return (
          <UsersView
            users={users}
            currentUser={currentUser}
          />
        );

      case 'audit':
        return (
          <AuditLogsView
            logs={auditLogs}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            currentUser={currentUser}
          />
        );

      default:
        return (
          <DashboardView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            settings={settings}
            currentUser={currentUser}
            onNavigate={tab => setActiveTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900 font-sans" dir="rtl">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        syncState={syncState}
        settings={settings}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={tab => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
