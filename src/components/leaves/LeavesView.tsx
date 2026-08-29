import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  X,
  XCircle
} from 'lucide-react';
import { Employee, LeaveRecord, LeaveStatus, LeaveType, SystemSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';

interface LeavesViewProps {
  employees: Employee[];
  leaves: LeaveRecord[];
  settings: SystemSettings;
  currentUser: User | null;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  employees,
  leaves,
  settings,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [typeFilter, setTypeFilter] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [empId, setEmpId] = useState(employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('سنوية');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const canApprove = currentUser?.role === 'Admin' || currentUser?.role === 'HR';

  const calculateDaysCount = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const daysCount = calculateDaysCount(startDate, endDate);

  const filteredLeaves = leaves.filter(l => {
    const matchStatus = statusFilter === 'الكل' || l.status === statusFilter;
    const matchType = typeFilter === 'الكل' || l.leaveType === typeFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      (l.employeeName || '').toLowerCase().includes(q) ||
      (l.employeeId || '').toLowerCase().includes(q) ||
      (l.department || '').toLowerCase().includes(q) ||
      (l.leaveType || '').toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const handleOpenModal = () => {
    setEmpId(employees[0]?.id || '');
    setLeaveType('سنوية');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === empId);
    if (!emp) {
      setErrorMessage('الموظف غير محدد');
      return;
    }

    if (endDate < startDate) {
      setErrorMessage('تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية');
      return;
    }

    const newLeave: LeaveRecord = {
      id: `LV-${new Date().getFullYear()}-${String(leaves.length + 1).padStart(3, '0')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      leaveType,
      startDate,
      endDate,
      daysCount,
      status: canApprove ? 'مقبولة' : 'معلقة',
      reason,
      approvedBy: canApprove ? currentUser?.fullName : undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const res = storageService.saveLeave(newLeave);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrorMessage(res.message || 'حدث خطأ');
    }
  };

  const handleUpdateStatus = (leave: LeaveRecord, newStatus: LeaveStatus) => {
    storageService.saveLeave({
      ...leave,
      status: newStatus,
      approvedBy: newStatus === 'مقبولة' ? currentUser?.fullName : undefined
    });
  };

  const handleDelete = (leaveId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      storageService.deleteLeave(leaveId);
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'مقبولة':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">مقبولة</span>;
      case 'معلقة':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">معلقة للمراجعة</span>;
      case 'مرفوضة':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">مرفوضة</span>;
    }
  };

  // KPIs
  const pendingCount = leaves.filter(l => l.status === 'معلقة').length;
  const approvedCount = leaves.filter(l => l.status === 'مقبولة').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            إدارة طلبات الإجازات والأذونات
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة أرصدة الإجازات السنوية والمرضية واعتماد طلبات الموظفين
          </p>
        </div>

        <button
          id="btn-add-leave-request"
          onClick={handleOpenModal}
          className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          تقديم طلب إجازة جديد
        </button>
      </div>

      {/* Balance Policy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">رصيد الإجازات السنوية</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {settings.annualLeaveAllowance} <span className="text-xs font-normal text-slate-500">يوم/سنة</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">
            سنوية
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">رصيد الإجازات المرضية</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {settings.sickLeaveAllowance} <span className="text-xs font-normal text-slate-500">يوم/سنة</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            مرضية
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">طلبات معلقة تنتظر الموافقة</span>
            <div className="text-2xl font-bold text-orange-600 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
            مراجعة
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم أو السبب..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1">
            <span>الحالة:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-600"
            >
              <option value="الكل">الكل</option>
              <option value="معلقة">معلقة</option>
              <option value="مقبولة">مقبولة</option>
              <option value="مرفوضة">مرفوضة</option>
            </select>
          </div>

          <div className="flex items-center gap-1 mr-2">
            <span>نوع الإجازة:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-600"
            >
              <option value="الكل">الكل</option>
              <option value="سنوية">سنوية</option>
              <option value="مرضية">مرضية</option>
              <option value="طارئة">طارئة</option>
              <option value="بدون راتب">بدون راتب</option>
              <option value="أمومة/أبوة">أمومة/أبوة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الإجازة</th>
                <th className="py-3.5 px-4">الموظف</th>
                <th className="py-3.5 px-4">القسم</th>
                <th className="py-3.5 px-4">نوع الإجازة</th>
                <th className="py-3.5 px-4">من تاريخ</th>
                <th className="py-3.5 px-4">إلى تاريخ</th>
                <th className="py-3.5 px-4 text-center">المدة</th>
                <th className="py-3.5 px-4">السبب / المبرر</th>
                <th className="py-3.5 px-4">الحالة</th>
                {canApprove && <th className="py-3.5 px-4 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">
                          {leaves.length === 0 ? 'لا توجد طلبات إجازة مسجلة بعد' : 'لا توجد نتائج تطابق البحث'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {leaves.length === 0
                            ? 'يمكنك إضافة طلب إجازة جديد للموظف أو اعتماد الطلبات الواردة.'
                            : 'جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر.'}
                        </p>
                      </div>
                      {leaves.length === 0 && employees.length > 0 && (
                        <button
                          onClick={handleOpenModal}
                          className="mt-2 text-xs font-bold bg-[#008e8b] hover:bg-[#007b78] text-white px-4 py-2 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تقديم أول طلب إجازة</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(lv => (
                  <tr key={lv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{lv.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{lv.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400 font-normal">{lv.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{lv.department}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{lv.leaveType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{lv.startDate}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{lv.endDate}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{lv.daysCount} يوم</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{lv.reason || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        lv.status === 'مقبولة'
                          ? 'bg-green-50 text-green-700'
                          : lv.status === 'معلقة'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {lv.status === 'مقبولة' ? 'مقبولة' : lv.status === 'معلقة' ? 'معلقة للمراجعة' : 'مرفوضة'}
                      </span>
                    </td>
                    {canApprove && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {lv.status === 'معلقة' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(lv, 'مقبولة')}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                title="قبول الطلب"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(lv, 'مرفوضة')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                title="رفض الطلب"
                              >
                                رفض
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(lv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">طلب إجازة جديد</h3>
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

            <form onSubmit={handleSaveLeave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الموظف:</label>
                <select
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الإجازة:</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                >
                  <option value="سنوية">سنوية (رصيد متاح: {settings.annualLeaveAllowance} يوم)</option>
                  <option value="مرضية">مرضية (رصيد متاح: {settings.sickLeaveAllowance} يوم)</option>
                  <option value="طارئة">طارئة (رصيد متاح: {settings.emergencyLeaveAllowance} يوم)</option>
                  <option value="بدون راتب">بدون راتب</option>
                  <option value="أمومة/أبوة">أمومة/أبوة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-center text-xs font-bold text-indigo-700">
                إجمالي الأيام المطلوبة: {daysCount} يوم
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المبرر والسبب:</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="اكتب سبب طلب الإجازة..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-600"
                />
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
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
