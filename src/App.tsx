import React, { useState, useEffect } from 'react';
import {
  AttendanceRecord,
  AuditLog,
  Employee,
  LeaveRecord,
  SyncState,
  SystemSettings,
  User
} from './types';
import { storageService } from './services/storageService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DailyAttendanceView } from './components/attendance/DailyAttendanceView';
import { MonthlyMatrixView } from './components/attendance/MonthlyMatrixView';
import { AnnualSummaryView } from './components/summary/AnnualSummaryView';
import { EmployeesView } from './components/employees/EmployeesView';
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
