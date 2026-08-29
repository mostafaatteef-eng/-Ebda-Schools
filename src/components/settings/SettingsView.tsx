import React, { useState } from 'react';
import {
  Save,
  Building,
  Clock,
  Calendar,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, currentUser }) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const handleCheckboxChange = (day: string) => {
    const currentDays = formData.weekendDays || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        weekendDays: currentDays.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        weekendDays: [...currentDays, day]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportFullBackup = () => {
    const employees = storageService.getEmployees();
    const attendance = storageService.getAttendance();
    const leaves = storageService.getLeaves();
    const permissions = storageService.getPermissions();
    const users = storageService.getUsers();

    const wb = XLSX.utils.book_new();

    const empWs = XLSX.utils.json_to_sheet(employees);
    XLSX.utils.book_append_sheet(wb, empWs, 'Employees');

    const attWs = XLSX.utils.json_to_sheet(attendance);
    XLSX.utils.book_append_sheet(wb, attWs, 'Attendance');

    const leavesWs = XLSX.utils.json_to_sheet(leaves);
    XLSX.utils.book_append_sheet(wb, leavesWs, 'Leaves');

    const permWs = XLSX.utils.json_to_sheet(permissions);
    XLSX.utils.book_append_sheet(wb, permWs, 'Permissions');

    const usersWs = XLSX.utils.json_to_sheet(users);
    XLSX.utils.book_append_sheet(wb, usersWs, 'Users');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `HR_System_Backup_${dateStr}.xlsx`);
  };

  const allWeekDays = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعبعاء',
    'الخميس',
    'الجمعة',
    'السبت'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#008e8b]" />
            إعدادات النظام وسياسات العمل
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تهيئة مواعيد الدوام الرسمي، فترات السماح، رصيد الإجازات وسياسات الحضور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير نسخة احتياطية (Excel)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم حفظ وتطبيق كافة إعدادات وسياسات العمل بنجاح.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. General Company & System Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-[#008e8b]" />
            <h3 className="text-sm font-bold text-slate-800">بيانات المنشأة العامة</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المنشأة / الشركة</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.companyName || ''}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                placeholder="أدخل اسم المنشأة"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">عدد ساعات العمل القياسية يومياً</label>
              <input
                type="number"
                disabled={!isAdmin}
                min="1"
                max="24"
                value={formData.standardDailyHours || 8}
                onChange={e =>
                  setFormData({ ...formData, standardDailyHours: parseFloat(e.target.value) || 8 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>
          </div>
        </div>

        {/* 2. Official Working Hours & Grace Period */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-[#008e8b]" />
            <h3 className="text-sm font-bold text-slate-800">مواعيد الدوام الرسمي واحتساب التأخير</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">بداية الدوام الرسمي</label>
              <input
                type="time"
                disabled={!isAdmin}
                value={formData.officialStartTime || '09:00'}
                onChange={e => setFormData({ ...formData, officialStartTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نهاية الدوام الرسمي</label>
              <input
                type="time"
                disabled={!isAdmin}
                value={formData.officialEndTime || '17:00'}
                onChange={e => setFormData({ ...formData, officialEndTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">فترة السماح للتأخير (بالدقائق)</label>
              <input
                type="number"
                disabled={!isAdmin}
                min="0"
                max="120"
                value={formData.gracePeriodMinutes ?? 15}
                onChange={e =>
                  setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
              <p className="text-[11px] text-slate-400">
                لا يُحسب الموظف متأخراً إذا سجل حضوره خلال هذه الدقائق بعد بداية الدوام
              </p>
            </div>
          </div>
        </div>

        {/* 3. Weekend Days */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-[#008e8b]" />
            <h3 className="text-sm font-bold text-slate-800">أيام العطلة الأسبوعية الرسمية</h3>
          </div>

          <p className="text-xs text-slate-500">
            حدد الأيام المعتمدة كعطلة أسبوعية للمنشأة (يتم تمييزها تلقائياً في السجلات والمصفوفة)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1">
            {allWeekDays.map(day => {
              const isSelected = (formData.weekendDays || []).includes(day);
              return (
                <label
                  key={day}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#008e8b]/10 border-[#008e8b] text-[#008e8b]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  } ${!isAdmin ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={isSelected}
                    onChange={() => handleCheckboxChange(day)}
                    className="rounded text-[#008e8b] focus:ring-[#008e8b]"
                  />
                  <span>{day}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. Leave Allowances & Overtime Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#008e8b]" />
            <h3 className="text-sm font-bold text-slate-800">أرصدة الإجازات السنوية وسياسات الإضافي</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رصيد الإجازة السنوية (يوم)</label>
              <input
                type="number"
                disabled={!isAdmin}
                min="0"
                value={formData.annualLeaveAllowance ?? 21}
                onChange={e =>
                  setFormData({ ...formData, annualLeaveAllowance: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رصيد الإجازة المرضية (يوم)</label>
              <input
                type="number"
                disabled={!isAdmin}
                min="0"
                value={formData.sickLeaveAllowance ?? 15}
                onChange={e =>
                  setFormData({ ...formData, sickLeaveAllowance: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رصيد الإجازة العارضة / الطارئة (يوم)</label>
              <input
                type="number"
                disabled={!isAdmin}
                min="0"
                value={formData.emergencyLeaveAllowance ?? 6}
                onChange={e =>
                  setFormData({ ...formData, emergencyLeaveAllowance: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">معامل الساعة الإضافية</label>
              <input
                type="number"
                step="0.1"
                disabled={!isAdmin}
                min="1"
                value={formData.overtimeRate ?? 1.5}
                onChange={e =>
                  setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) || 1 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
              />
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              id="btn-save-system-settings"
              type="submit"
              className="px-6 py-3 bg-[#008e8b] hover:bg-[#007775] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات وتطبيق السياسات</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
