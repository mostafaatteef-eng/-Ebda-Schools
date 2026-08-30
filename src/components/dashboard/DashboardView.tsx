import React from 'react';
import { AttendanceRecord, Employee, LeaveRecord, SystemSettings, User } from '../../types';
import { getDashboardForUser } from '../../utils/permissions';
import { AdminDashboard } from './AdminDashboard';
import { StudentAffairsDashboard } from './StudentAffairsDashboard';
import { TeacherAffairsDashboard } from './TeacherAffairsDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { SocialSpecialistDashboard } from './SocialSpecialistDashboard';
import { ParentDashboard } from './ParentDashboard';

interface DashboardViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  onNavigate?: (tab: string, params?: any) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendance,
  leaves,
  settings,
  currentUser,
  onNavigate,
  onNavigateToTab,
}) => {
  const handleNavigate = (tab: string, params?: any) => {
    if (onNavigate) onNavigate(tab, params);
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  const dashboardType = getDashboardForUser(currentUser);

  switch (dashboardType) {
    case 'StudentAffairsDashboard':
      return (
        <StudentAffairsDashboard
          settings={settings}
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );

    case 'TeacherAffairsDashboard':
      return (
        <TeacherAffairsDashboard
          employees={employees}
          attendance={attendance}
          leaves={leaves}
          settings={settings}
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );

    case 'TeacherDashboard':
      return (
        <TeacherDashboard
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );

    case 'SocialSpecialistDashboard':
      return (
        <SocialSpecialistDashboard
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );

    case 'ParentDashboard':
      return (
        <ParentDashboard
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );

    case 'AdminDashboard':
    default:
      return (
        <AdminDashboard
          employees={employees}
          attendance={attendance}
          leaves={leaves}
          settings={settings}
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );
  }
};
