import React, { useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X
} from 'lucide-react';
import { Employee, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';

interface EmployeesViewProps {
  employees: Employee[];
  settings: SystemSettings;
  currentUser: User | null;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  settings,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [department, setDepartment] = useState('الموارد البشرية');
  const [jobTitle, setJobTitle] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [basicSalary, setBasicSalary] = useState<number>(10000);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [daysOff, setDaysOff] = useState<string[]>(['الجمعة', 'السبت']);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'HR';

  const departments = ['الكل', ...Array.from(new Set(employees.map(e => e.department)))];

  const filteredEmployees = employees.filter(emp => {
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

  const openAddModal = () => {
    // suggest next ID
    const nextNum = employees.length + 1;
    const nextId = `EMP${String(nextNum).padStart(3, '0')}`;

    setEditingEmp(null);
    setId(nextId);
    setName('');
    setNationalId('');
    setDepartment('تقنية المعلومات');
    setJobTitle('');
    setHireDate(new Date().toISOString().split('T')[0]);
    setBasicSalary(10000);
    setWorkingHours(settings.standardDailyHours || 8);
    setWorkStartTime(settings.officialStartTime || '09:00');
    setWorkEndTime(settings.officialEndTime || '17:00');
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
    setWorkingHours(emp.workingHours);
    setWorkStartTime(emp.workStartTime);
    setWorkEndTime(emp.workEndTime);
    setDaysOff(emp.daysOff || ['الجمعة', 'السبت']);
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
      department,
      jobTitle: jobTitle.trim(),
      hireDate,
      basicSalary: Number(basicSalary) || 0,
      workingHours: Number(workingHours) || 8,
      workStartTime,
      workEndTime,
      daysOff,
      status,
      phone: phone.trim(),
      email: email.trim()
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            دليل وإدارة الموظفين
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بطاقات الموظفين، مواعيد الدوام المحددة، الرواتب، والأقسام
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              id="btn-add-new-employee"
              onClick={openAddModal}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              إضافة موظف جديد
            </button>
          )}

          <button
            onClick={handleExport}
            className="text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-600" />
            تصدير الموظفين
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرقم الوظيفي، أو المسمى..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1">
            <span>القسم:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-600"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 mr-2">
            <span>الحالة:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-600"
            >
              <option value="الكل">الكل</option>
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط / معطل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الموظف</th>
                <th className="py-3.5 px-4">الاسم الكامل</th>
                <th className="py-3.5 px-4">القسم</th>
                <th className="py-3.5 px-4">المسمى الوظيفي</th>
                <th className="py-3.5 px-4">تاريخ التعيين</th>
                <th className="py-3.5 px-4">مواعيد العمل</th>
                <th className="py-3.5 px-4">الراتب الأساسي</th>
                <th className="py-3.5 px-4">الحالة</th>
                {canManage && <th className="py-3.5 px-4 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
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
                            ? 'ابدأ بإضافة موظفي منشأتك لتفعيل تسجيل الحضور والانصراف وإدارة الإجازات.'
                            : 'جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر.'}
                        </p>
                      </div>
                      {canManage && employees.length === 0 && (
                        <button
                          onClick={openAddModal}
                          className="mt-2 text-xs font-bold bg-[#008e8b] hover:bg-[#007b78] text-white px-4 py-2 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
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
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{emp.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{emp.name}</div>
                      {emp.email && <div className="text-[10px] text-slate-400 font-normal">{emp.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{emp.department}</td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.jobTitle}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{emp.hireDate}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {emp.workStartTime} - {emp.workEndTime} ({emp.workingHours}س)
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {emp.basicSalary ? `${emp.basicSalary.toLocaleString()} ر.س` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === 'Active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {emp.status === 'Active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="تعديل الموظف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.status === 'Active'
                                ? 'text-orange-500 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={emp.status === 'Active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                          >
                            {emp.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          {currentUser?.role === 'Admin' && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الموظف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الرقم الوظيفي (ID):</label>
                  <input
                    type="text"
                    value={id}
                    onChange={e => setId(e.target.value)}
                    placeholder="EMP001"
                    disabled={Boolean(editingEmp)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الموظف الكامل:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: عبد الله أحمد السعيد"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">القسم / الإدارة:</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  >
                    <option value="الموارد البشرية">الموارد البشرية</option>
                    <option value="تقنية المعلومات">تقنية المعلومات</option>
                    <option value="المحاسبة والمالية">المحاسبة والمالية</option>
                    <option value="المبيعات والتسويق">المبيعات والتسويق</option>
                    <option value="العمليات والتشغيل">العمليات والتشغيل</option>
                    <option value="الشؤون القانونية">الشؤون القانونية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المسمى الوظيفي:</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="مثال: أخصائي موارد بشرية"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهوية الوطنية:</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                    placeholder="10XXXXXXXX"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ التعيين:</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={e => setHireDate(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الراتب الأساسي (ر.س):</label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={e => setBasicSalary(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">وقت بدء العمل:</label>
                  <input
                    type="time"
                    value={workStartTime}
                    onChange={e => setWorkStartTime(e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">وقت نهاية العمل:</label>
                  <input
                    type="time"
                    value={workEndTime}
                    onChange={e => setWorkEndTime(e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ساعات العمل اليومية:</label>
                  <input
                    type="number"
                    value={workingHours}
                    onChange={e => setWorkingHours(Number(e.target.value))}
                    className="w-full text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="emp@company.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                  حفظ بطاقة الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
