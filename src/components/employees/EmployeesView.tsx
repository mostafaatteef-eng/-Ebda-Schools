import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Download,
  Edit2,
  Eye,
  History,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { Employee, SalaryHistoryEntry, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { HRPayrollService } from '../../services/hrPayrollService';
import { formatEgyptianCurrency, formatEgyptianDate } from '../../utils/egyptianTime';

interface EmployeesViewProps {
  employees: Employee[];
  settings: SystemSettings;
  currentUser: User | null;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  settings,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Salary Adjustment Modal for Admins
  const [salaryModalEmp, setSalaryModalEmp] = useState<Employee | null>(null);
  const [newBasicSalary, setNewBasicSalary] = useState<number>(0);
  const [newAllowances, setNewAllowances] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [salaryHistoryList, setSalaryHistoryList] = useState<SalaryHistoryEntry[]>([]);

  // Form Fields
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [basicSalary, setBasicSalary] = useState<number>(10000);
  const [allowances, setAllowances] = useState<number>(0);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [workStartTime, setWorkStartTime] = useState('07:30');
  const [workEndTime, setWorkEndTime] = useState('14:30');
  const [daysOff, setDaysOff] = useState<string[]>(['الجمعة', 'السبت']);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const isAdmin = currentUser?.role === 'Admin';
  const canManage = isAdmin || currentUser?.role === 'HR';

  // Dynamic Departments & Job Titles from Settings & Master Data
  const configuredDepts = useMemo(() => {
    const fromSettings = (settings.departments || []).map(d => d.name);
    const fromEmps = employees.map(e => e.department).filter(Boolean);
    return Array.from(new Set([...fromSettings, ...fromEmps]));
  }, [settings.departments, employees]);

  const configuredJobTitles = useMemo(() => {
    const fromSettings = (settings.jobTitles || []).map(j => j.name);
    const fromEmps = employees.map(e => e.jobTitle).filter(Boolean);
    return Array.from(new Set([...fromSettings, ...fromEmps]));
  }, [settings.jobTitles, employees]);

  const departmentsFilterList = ['الكل', ...configuredDepts];

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === 'الكل' || emp.department === deptFilter;
      const matchStatus = statusFilter === 'الكل' || emp.status === statusFilter;
      const q = (searchQuery || '').trim().toLowerCase();
      const matchSearch =
        !q ||
        (emp.name || '').toLowerCase().includes(q) ||
        (emp.id || '').toLowerCase().includes(q) ||
        (emp.jobTitle || '').toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q) ||
        (emp.nationalId ? emp.nationalId.includes(q) : false);
      return matchDept && matchStatus && matchSearch;
    });
  }, [employees, deptFilter, statusFilter, searchQuery]);

  const openAddModal = () => {
    const nextNum = employees.length + 1;
    const nextId = `EMP${String(nextNum).padStart(3, '0')}`;

    setEditingEmp(null);
    setId(nextId);
    setName('');
    setNationalId('');
    setDepartment(configuredDepts[0] || 'الموارد البشرية');
    setJobTitle(configuredJobTitles[0] || 'معلم');
    setHireDate(new Date().toISOString().split('T')[0]);
    setBasicSalary(10000);
    setAllowances(1500);
    setWorkingHours(settings.standardDailyHours || 7);
    setWorkStartTime(settings.officialStartTime || '07:30');
    setWorkEndTime(settings.officialEndTime || '14:30');
    setDaysOff(settings.weekendDays || ['الجمعة', 'السبت']);
    setStatus('Active');
    setPhone('');
    setEmail('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setId(emp.id);
    setName(emp.name);
    setNationalId(emp.nationalId || '');
    setDepartment(emp.department);
    setJobTitle(emp.jobTitle);
    setHireDate(emp.hireDate);
    setBasicSalary(emp.basicSalary || 0);
    setAllowances(emp.allowances || 0);
    setWorkingHours(emp.workingHours || settings.standardDailyHours || 7);
    setWorkStartTime(emp.workStartTime || settings.officialStartTime || '07:30');
    setWorkEndTime(emp.workEndTime || settings.officialEndTime || '14:30');
    setDaysOff(emp.daysOff || settings.weekendDays || ['الجمعة', 'السبت']);
    setStatus(emp.status);
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) {
      setErrorMessage('رقم الموظف واسم الموظف حقول مطلوبة');
      return;
    }

    const empToSave: Employee = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      nationalId: nationalId.trim(),
      department: department.trim() || 'الإدارة العامة',
      jobTitle: jobTitle.trim() || 'موظف',
      hireDate,
      // If non-admin is editing, preserve existing salary values
      basicSalary: isAdmin ? Number(basicSalary) || 0 : editingEmp?.basicSalary || 0,
      allowances: isAdmin ? Number(allowances) || 0 : editingEmp?.allowances || 0,
      workingHours: Number(workingHours) || 7,
      workStartTime,
      workEndTime,
      daysOff,
      status,
      phone: phone.trim(),
      email: email.trim(),
    };

    const res = storageService.saveEmployee(empToSave);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrorMessage(res.message || 'فشلت عملية الحفظ');
    }
  };

  const handleToggleStatus = (emp: Employee) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    storageService.saveEmployee({ ...emp, status: nextStatus });
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف (${emp.name}) نهائياً من النظام؟`)) {
      storageService.deleteEmployee(emp.id);
    }
  };

  const handleOpenSalaryAdjustmentModal = (emp: Employee) => {
    if (!isAdmin) return;
    setSalaryModalEmp(emp);
    setNewBasicSalary(emp.basicSalary || 0);
    setNewAllowances(emp.allowances || 0);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setAdjustmentReason('');
    setSalaryHistoryList(HRPayrollService.getSalaryHistory(emp.id));
  };

  const handleSaveSalaryAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModalEmp) return;

    const res = HRPayrollService.recordSalaryAdjustment(
      salaryModalEmp,
      newBasicSalary,
      newAllowances,
      effectiveDate,
      adjustmentReason,
      currentUser
    );

    if (res.success) {
      setSalaryHistoryList(HRPayrollService.getSalaryHistory(salaryModalEmp.id));
      setSalaryModalEmp(null);
      alert(`تم بنجاح تثبيت وتطبيق التعديل المالي بسريان من تاريخ ${effectiveDate}`);
    }
  };

  const handleExport = () => {
    ExportService.exportFullDatabaseToExcel(
      employees,
      storageService.getAttendance(),
      storageService.getLeaves(),
      settings,
      storageService.getAuditLogs()
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span>دليل وهيكل المعلمين والموظفين (HR Structure)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بطاقات الموظفين، مواعيد الدوام وساعات العمل، والأقسام والمسميات الوظيفية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              id="btn-add-new-employee"
              onClick={openAddModal}
              className="text-xs font-bold bg-[#008e8b] hover:bg-teal-700 text-white px-4 py-2.5 rounded-2xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف / معلم جديد</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-1.5 border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>تصدير الموظفين Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرقم الوظيفي، أو المسمى..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-900 focus:outline-hidden focus:border-[#008e8b]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">القسم / التخصص:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              {departmentsFilterList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold">الحالة:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="Active">نشط بالخدمة</option>
              <option value="Inactive">غير نشط / معطل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الموظف</th>
                <th className="py-3.5 px-4">الاسم الكامل</th>
                <th className="py-3.5 px-4">القسم</th>
                <th className="py-3.5 px-4">المسمى الوظيفي</th>
                <th className="py-3.5 px-4">مواعيد العمل الرسمية</th>
                {isAdmin && <th className="py-3.5 px-4">الراتب الأساسي (EGP)</th>}
                <th className="py-3.5 px-4">الحالة</th>
                {canManage && <th className="py-3.5 px-4 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">
                          {employees.length === 0 ? 'لا يوجد موظفون مسجلون بعد' : 'لا توجد نتائج تطابق البحث'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {employees.length === 0
                            ? 'ابدأ بإضافة موظفي ومعلمي المدرسة لتفعيل تسجيل الحضور ومسير الرواتب.'
                            : 'جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر.'}
                        </p>
                      </div>
                      {canManage && employees.length === 0 && (
                        <button
                          onClick={openAddModal}
                          className="mt-2 text-xs font-bold bg-[#008e8b] hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>إضافة أول موظف الآن</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{emp.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      {emp.phone && <div className="text-[10px] text-slate-400 mt-0.5">{emp.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {emp.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.jobTitle}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-mono text-[11px]">
                        {emp.workStartTime || '07:30'} - {emp.workEndTime || '14:30'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {emp.workingHours || 7} ساعات يومياً
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        <div className="flex items-center gap-2">
                          <span>{formatEgyptianCurrency(emp.basicSalary || 0)}</span>
                          <button
                            onClick={() => handleOpenSalaryAdjustmentModal(emp)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                            title="تعديل الراتب مع تاريخ السريان"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {emp.status === 'Active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.status === 'Active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={emp.status === 'Active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                          >
                            {emp.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الموظف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#008e8b]" />
                <span>{editingEmp ? 'تعديل بيانات الموظف / المعلم' : 'إضافة موظف أو معلم جديد'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرقم الوظيفي / الكود *</label>
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={e => setId(e.target.value)}
                    disabled={!!editingEmp}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    placeholder="مثال: أحمد محمد علي"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">القسم / الإدارة</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {configuredDepts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">المسمى الوظيفي</label>
                  <select
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {configuredJobTitles.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ التعيين</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={e => setHireDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرقم القومي</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    placeholder="14 رقم"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">بداية الدوام</label>
                  <input
                    type="time"
                    value={workStartTime}
                    onChange={e => setWorkStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نهاية الدوام</label>
                  <input
                    type="time"
                    value={workEndTime}
                    onChange={e => setWorkEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ساعات العمل اليومية</label>
                  <input
                    type="number"
                    value={workingHours}
                    onChange={e => setWorkingHours(Number(e.target.value))}
                    min={1}
                    max={16}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                {/* Salary inputs only visible to Admin */}
                {isAdmin && (
                  <>
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
                      <label className="font-bold text-emerald-900 block mb-1">الراتب الأساسي (ج.م) *</label>
                      <input
                        type="number"
                        value={basicSalary}
                        onChange={e => setBasicSalary(Number(e.target.value))}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
                      <label className="font-bold text-emerald-900 block mb-1">البدلات الشهرية (ج.م)</label>
                      <input
                        type="number"
                        value={allowances}
                        onChange={e => setAllowances(Number(e.target.value))}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Adjustment & Effective Dating Modal (Admin Only) */}
      {salaryModalEmp && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>تعديل الراتب وسجل السريان (Effective Salary) - {salaryModalEmp.name}</span>
              </h3>
              <button onClick={() => setSalaryModalEmp(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryAdjustment} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">الراتب الأساسي الحالي:</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    {formatEgyptianCurrency(salaryModalEmp.basicSalary || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">البدلات الحالية:</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    {formatEgyptianCurrency(salaryModalEmp.allowances || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الراتب الأساسي الجديد (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={newBasicSalary}
                    onChange={e => setNewBasicSalary(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">البدلات الجديدة (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={newAllowances}
                    onChange={e => setNewAllowances(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ سريان التعديل (Effective Date) *</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">سبب التعديل / القرار الإداري *</label>
                  <input
                    type="text"
                    required
                    value={adjustmentReason}
                    onChange={e => setAdjustmentReason(e.target.value)}
                    placeholder="مثال: ترقية سنوية، علاوة تميز، تعديل هيكل الأجور"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Historical Log */}
              {salaryHistoryList.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" />
                    <span>سجل التعديلات السابقة لهذا الموظف</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {salaryHistoryList.map(h => (
                      <div key={h.id} className="text-[11px] p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{h.reason}</span>
                          <span className="text-slate-400 block">سريان: {h.effectiveDate} - معتمد بواسطة: {h.approvedBy}</span>
                        </div>
                        <div className="font-mono text-emerald-700 font-bold">
                          {formatEgyptianCurrency(h.newBasicSalary)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setSalaryModalEmp(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  تثبيت وتطبيق التعديل المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
