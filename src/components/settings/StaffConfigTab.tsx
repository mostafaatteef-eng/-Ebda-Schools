import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  DepartmentItem,
  JobTitleItem,
  LeaveTypeConfig,
  PermissionTypeConfig,
  SystemSettings,
} from '../../types';
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_JOB_TITLES,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_PERMISSION_TYPES,
} from '../../data/initialData';
import { storageService } from '../../services/storageService';

interface StaffConfigTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const StaffConfigTab: React.FC<StaffConfigTabProps> = ({ formData, setFormData }) => {
  const [subSection, setSubSection] = useState<'departments' | 'job_titles' | 'leave_types' | 'permission_types'>('departments');

  // Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptForm, setDeptForm] = useState<Partial<DepartmentItem>>({
    name: '',
    managerName: '',
    description: '',
    isActive: true,
  });

  // Job Title Modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobTitleItem | null>(null);
  const [jobForm, setJobForm] = useState<Partial<JobTitleItem>>({
    title: '',
    departmentId: '',
    isTeachingStaff: false,
    isActive: true,
  });

  // Leave Type Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveTypeConfig | null>(null);
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveTypeConfig>>({
    name: '',
    isPaid: true,
    deductFromBalance: true,
    defaultAnnualQuota: 21,
    requiresApproval: true,
    color: '#3b82f6',
    isActive: true,
  });

  // Permission Type Modal
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionTypeConfig | null>(null);
  const [permForm, setPermForm] = useState<Partial<PermissionTypeConfig>>({
    name: '',
    maxHoursPerMonth: 4,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const departments = formData.departments || DEFAULT_DEPARTMENTS;
  const jobTitles = formData.jobTitles || DEFAULT_JOB_TITLES;
  const leaveTypes = formData.leaveTypes || DEFAULT_LEAVE_TYPES;
  const permissionTypes = formData.permissionTypes || DEFAULT_PERMISSION_TYPES;

  // ---------------- Dept Handlers ----------------
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      managerName: '',
      description: '',
      isActive: true,
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptForm({ ...dept });
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name?.trim()) return;

    let updated: DepartmentItem[];
    if (editingDept) {
      updated = departments.map(d => (d.id === editingDept.id ? ({ ...d, ...deptForm } as DepartmentItem) : d));
      showNotif(`تم تحديث القسم: ${deptForm.name}`);
    } else {
      const newD: DepartmentItem = {
        id: `DEP_${Date.now()}`,
        name: deptForm.name!.trim(),
        managerName: deptForm.managerName?.trim() || '',
        description: deptForm.description?.trim() || '',
        isActive: deptForm.isActive !== undefined ? deptForm.isActive : true,
      };
      updated = [...departments, newD];
      showNotif(`تمت إضافة القسم الجديد: ${newD.name}`);
    }
    setFormData(prev => ({ ...prev, departments: updated }));
    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = (dept: DepartmentItem) => {
    const depCheck = storageService.checkDependencies('department', dept.name);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف قسم "${dept.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        departments: departments.filter(d => d.id !== dept.id),
      }));
      showNotif(`تم حذف القسم "${dept.name}"`);
    }
  };

  // ---------------- Job Title Handlers ----------------
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setJobForm({
      title: '',
      departmentId: departments[0]?.id || '',
      isTeachingStaff: false,
      isActive: true,
    });
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: JobTitleItem) => {
    setEditingJob(job);
    setJobForm({ ...job });
    setIsJobModalOpen(true);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title?.trim()) return;

    let updated: JobTitleItem[];
    if (editingJob) {
      updated = jobTitles.map(j => (j.id === editingJob.id ? ({ ...j, ...jobForm } as JobTitleItem) : j));
      showNotif(`تم تحديث المسمى الوظيفي: ${jobForm.title}`);
    } else {
      const newJ: JobTitleItem = {
        id: `JOB_${Date.now()}`,
        title: jobForm.title!.trim(),
        departmentId: jobForm.departmentId || departments[0]?.id || '',
        isTeachingStaff: !!jobForm.isTeachingStaff,
        isActive: jobForm.isActive !== undefined ? jobForm.isActive : true,
      };
      updated = [...jobTitles, newJ];
      showNotif(`تمت إضافة المسمى الوظيفي الجديد: ${newJ.title}`);
    }
    setFormData(prev => ({ ...prev, jobTitles: updated }));
    setIsJobModalOpen(false);
  };

  const handleDeleteJob = (job: JobTitleItem) => {
    const depCheck = storageService.checkDependencies('jobTitle', job.title);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف المسمى الوظيفي "${job.title}"؟`)) {
      setFormData(prev => ({
        ...prev,
        jobTitles: jobTitles.filter(j => j.id !== job.id),
      }));
      showNotif(`تم حذف المسمى الوظيفي "${job.title}"`);
    }
  };

  // ---------------- Leave Type Handlers ----------------
  const handleOpenAddLeave = () => {
    setEditingLeave(null);
    setLeaveForm({
      name: '',
      isPaid: true,
      deductFromBalance: true,
      defaultAnnualQuota: 21,
      requiresApproval: true,
      color: '#3b82f6',
      isActive: true,
    });
    setIsLeaveModalOpen(true);
  };

  const handleOpenEditLeave = (leave: LeaveTypeConfig) => {
    setEditingLeave(leave);
    setLeaveForm({ ...leave });
    setIsLeaveModalOpen(true);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.name?.trim()) return;

    let updated: LeaveTypeConfig[];
    if (editingLeave) {
      updated = leaveTypes.map(l => (l.id === editingLeave.id ? ({ ...l, ...leaveForm } as LeaveTypeConfig) : l));
      showNotif(`تم تحديث نوع الإجازة: ${leaveForm.name}`);
    } else {
      const newL: LeaveTypeConfig = {
        id: `LEV_${Date.now()}`,
        name: leaveForm.name!.trim(),
        isPaid: !!leaveForm.isPaid,
        deductFromBalance: !!leaveForm.deductFromBalance,
        defaultAnnualQuota: Number(leaveForm.defaultAnnualQuota) || 0,
        requiresApproval: leaveForm.requiresApproval !== false,
        color: leaveForm.color || '#3b82f6',
        isActive: leaveForm.isActive !== undefined ? leaveForm.isActive : true,
      };
      updated = [...leaveTypes, newL];
      showNotif(`تمت إضافة نوع الإجازة الجديد: ${newL.name}`);
    }
    setFormData(prev => ({ ...prev, leaveTypes: updated }));
    setIsLeaveModalOpen(false);
  };

  const handleDeleteLeave = (leave: LeaveTypeConfig) => {
    if (window.confirm(`هل أنت متأكد من حذف نوع الإجازة "${leave.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        leaveTypes: leaveTypes.filter(l => l.id !== leave.id),
      }));
      showNotif(`تم حذف نوع الإجازة "${leave.name}"`);
    }
  };

  return (
    <div className="space-y-6" id="staff_config_container">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubSection('departments')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'departments'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            الأقسام الإدارية ({departments.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('job_titles')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'job_titles'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            المسميات الوظيفية ({jobTitles.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('leave_types')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'leave_types'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            أنواع الإجازات والأرصدة ({leaveTypes.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('permission_types')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'permission_types'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            الأذونات والمأموريات ({permissionTypes.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('هل تريد استعادة إعدادات الكادر الافتراضية؟')) {
              storageService.resetSettingsSection('departments');
              storageService.resetSettingsSection('jobTitles');
              storageService.resetSettingsSection('leaveTypes');
              storageService.resetSettingsSection('permissionTypes');
              setFormData(storageService.getSettings());
              showNotif('تمت استعادة إعدادات الأقسام والكادر الافتراضية بنجاح');
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          استعادة الافتراضي
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* ---------------- Sub-Section: Departments ---------------- */}
      {subSection === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                إدارة الهيكل التنظيمي والأقسام
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد الأقسام الأكاديمية والإدارية والمدير المسؤول</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddDept}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, idx) => (
              <div
                key={dept.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-white">{dept.name}</h4>
                    <p className="text-xs text-teal-600 font-semibold mt-0.5">
                      المسؤول: {dept.managerName || 'غير محدد'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                    مفعل
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{dept.description || 'لا يوجد وصف'}</p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDept(dept)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDept(dept)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Job Titles ---------------- */}
      {subSection === 'job_titles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                دليل المسميات الوظيفية والكادر
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد المسمى، القسم التابع له، وتصنيف الكادر التعليمي</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddJob}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة مسمى وظيفي
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="p-3">المسمى الوظيفي</th>
                  <th className="p-3">القسم التابع له</th>
                  <th className="p-3">نوع الكادر</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {jobTitles.map((job, idx) => {
                  const dept = departments.find(d => d.id === job.departmentId);
                  return (
                    <tr key={job.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                      <td className="p-3 font-semibold text-slate-800 dark:text-white">{job.title}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">{dept?.name || 'قسم عام'}</td>
                      <td className="p-3">
                        {job.isTeachingStaff ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-bold">
                            كادر تدريسي
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            كادر إداري ومعاون
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-emerald-600 font-bold">مفعل</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditJob(job)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Leave Types ---------------- */}
      {subSection === 'leave_types' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                أنواع الإجازات وأرصدة الموظفين
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد الإجازات السنوية، العارضة، المرضية، وشروط الراتب</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddLeave}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة نوع إجازة جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map((leave, idx) => (
              <div
                key={leave.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: leave.color || '#3b82f6' }}
                />
                <div className="flex justify-between items-start mt-1">
                  <h4 className="font-bold text-base text-slate-800 dark:text-white">{leave.name}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {leave.defaultAnnualQuota > 0 ? `${leave.defaultAnnualQuota} يوم/سنة` : 'بدون حد'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p>• الأجر: <strong className={leave.isPaid ? 'text-emerald-600' : 'text-rose-600'}>{leave.isPaid ? 'مدفوعة الأجر بالكامل' : 'بدون راتب'}</strong></p>
                  <p>• الخصم: {leave.deductFromBalance ? 'تُخصم من الرصيد السنوي' : 'لا تخصم من الرصيد'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditLeave(leave)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLeave(leave)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Permission Types ---------------- */}
      {subSection === 'permission_types' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              أنواع الأذونات والمأموريات الرسمية
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد الحد الأقصى لساعات الخروج والانصراف والمأموريات شهرياً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionTypes.map(perm => (
              <div
                key={perm.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{perm.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الحد الأقصى: <strong className="text-teal-600 font-bold">{perm.maxHoursPerMonth}</strong> ساعة شهرياً
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                  {perm.isPaid ? 'محتسب الأجر' : 'يخصم'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Modal: Dept Form ---------------- */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                {editingDept ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم القسم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: هيئة التدريس، شؤون الطلاب..."
                  value={deptForm.name || ''}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المدير أو المسؤول
                </label>
                <input
                  type="text"
                  placeholder="مثال: الناظر الأكاديمي"
                  value={deptForm.managerName || ''}
                  onChange={e => setDeptForm({ ...deptForm, managerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف والمهام
                </label>
                <textarea
                  rows={2}
                  value={deptForm.description || ''}
                  onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Job Form ---------------- */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {editingJob ? 'تعديل المسمى الوظيفي' : 'إضافة مسمى وظيفي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المسمى الوظيفي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: معلم لغة عربية، محاسب مالي..."
                  value={jobForm.title || ''}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  القسم التابع له *
                </label>
                <select
                  value={jobForm.departmentId || departments[0]?.id || ''}
                  onChange={e => setJobForm({ ...jobForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!jobForm.isTeachingStaff}
                    onChange={e => setJobForm({ ...jobForm, isTeachingStaff: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>يتبع الكادر التدريسي (يُسند إليه حصص وفصول)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ المسمى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Leave Form ---------------- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                {editingLeave ? 'تعديل نوع الإجازة' : 'إضافة نوع إجازة جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم نوع الإجازة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إجازة اعتيادية، عارضة، وضع..."
                  value={leaveForm.name || ''}
                  onChange={e => setLeaveForm({ ...leaveForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرصيد السنوي (أيام)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={leaveForm.defaultAnnualQuota || 0}
                    onChange={e => setLeaveForm({ ...leaveForm, defaultAnnualQuota: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اللون المميز
                  </label>
                  <input
                    type="color"
                    value={leaveForm.color || '#3b82f6'}
                    onChange={e => setLeaveForm({ ...leaveForm, color: e.target.value })}
                    className="w-full h-9 rounded cursor-pointer border-0 p-0"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leaveForm.isPaid !== false}
                    onChange={e => setLeaveForm({ ...leaveForm, isPaid: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>إجازة مدفوعة الأجر بالكامل</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leaveForm.deductFromBalance !== false}
                    onChange={e => setLeaveForm({ ...leaveForm, deductFromBalance: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>تخصم من رصيد الإجازات السنوي للموظف</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ نوع الإجازة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
