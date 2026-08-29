import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Key,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { storageService } from '../../services/storageService';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
}

export const UsersView: React.FC<UsersViewProps> = ({ users, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('HR');
  const [department, setDepartment] = useState('الموارد البشرية');
  const [isActive, setIsActive] = useState(true);

  const isAdmin = currentUser?.role === 'Admin';

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setRole('HR');
    setDepartment('الموارد البشرية');
    setIsActive(true);
    setErrorMessage('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setPassword(u.password || '');
    setRole(u.role);
    setDepartment(u.department || 'الموارد البشرية');
    setIsActive(u.status === 'Active' || u.isActive === true);
    setErrorMessage('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setErrorMessage('اسم المستخدم والاسم الكامل مطلوبان');
      return;
    }

    if (!editingUser && !password.trim()) {
      setErrorMessage('يرجى تحديد كلمة المرور للمستخدم الجديد');
      return;
    }

    const userToSave: User = {
      id: editingUser?.id || `USR-${Date.now()}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: '',
      password: password.trim() ? password.trim() : (editingUser?.password || '123456'),
      role,
      department,
      isActive,
      status: isActive ? 'Active' : 'Inactive',
      createdAt: editingUser?.createdAt || new Date().toISOString().split('T')[0]
    };

    const res = storageService.saveUser(userToSave);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrorMessage(res.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser?.id || u.username === currentUser?.username) {
      alert('لا يمكنك حذف حسابك الشخصي المسجل به حالياً');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف المستخدم (${u.fullName})؟`)) {
      const success = storageService.deleteUser(u.id);
      if (!success) {
        alert('تعذر حذف المستخدم');
      }
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'Admin':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            مدير نظام (Admin)
          </span>
        );
      case 'HR':
        return (
          <span className="bg-teal-50 text-[#008e8b] border border-teal-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            مسؤول موارد بشرية (HR)
          </span>
        );
      case 'Supervisor':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            مشرف قسم (Supervisor)
          </span>
        );
      case 'Viewer':
        return (
          <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            مشاهد فقط (Viewer)
          </span>
        );
      default:
        return (
          <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            {r}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#008e8b]" />
            إدارة المستخدمين والصلاحيات
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            التحكم في وصول الموظفين والمشرفين للنظام وتعيين كلمات المرور ومستويات الصلاحيات
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-system-user"
            onClick={openAddModal}
            className="text-xs font-bold bg-[#008e8b] hover:bg-[#007775] text-white px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        )}
      </div>

      {/* Info Banner for Google Sheet Schema */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-teal-900">
        <Key className="w-5 h-5 text-[#008e8b] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">
            تخزين وتعديل كلمات المرور في Google Sheets (صفحة Users)
          </div>
          <p className="text-slate-600 leading-relaxed">
            تحتوي صفحة <span className="font-mono font-bold text-[#008e8b] bg-teal-100 px-1.5 py-0.5 rounded">Users</span> في الشيت على عمود مخصص لكلمة السر باسم <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-teal-200">password</span> (أو <span className="font-bold text-slate-800">كلمة المرور</span>). يمكنك كتابة أو تغيير كلمة المرور للمستخدمين مباشرة من هنا أو كتابتها يدوياً في خانة password داخل الشيت وسيقوم النظام بالتعرف عليها فوراً.
          </p>
        </div>
      </div>

      {/* Roles Permission Matrix Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          مستويات الصلاحيات المعتمدة في النظام
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-semibold text-purple-300 mb-1">مدير النظام (Admin)</div>
            <p className="text-slate-400 text-[11px]">
              صلاحيات كاملة: إدارة الموظفين، الحضور والانصراف، التقارير، إعدادات النظام، وإدارة المستخدمين.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-semibold text-teal-300 mb-1">مسؤول الموارد (HR)</div>
            <p className="text-slate-400 text-[11px]">
              تسجيل الحضور والانصراف، تعديل الموظفين، قبول ورفض الإجازات، وإصدار التقارير.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-semibold text-blue-300 mb-1">مشرف قسم (Supervisor)</div>
            <p className="text-slate-400 text-[11px]">
              تسجيل الحضور اليومي للموظفين التابعين للقسم وإصدار أذونات العمل والتقارير.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-semibold text-slate-300 mb-1">مشاهد (Viewer)</div>
            <p className="text-slate-400 text-[11px]">
              عرض مؤشرات لوحة التحكم والتقارير الشهرية دون إمكانية التعديل أو الحذف.
            </p>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#008e8b]" />
            <span className="text-xs font-bold text-slate-800">قائمة حسابات المستخدمين النشطة</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {users.length} مستخدم
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">الاسم الكامل</th>
                <th className="p-3.5">القسم</th>
                <th className="p-3.5">الدور / الصلاحية</th>
                <th className="p-3.5">كلمة المرور</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">آخر تسجيل دخول</th>
                {isAdmin && <th className="p-3.5 text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map(u => {
                const isCurrent = u.id === currentUser?.id || u.username === currentUser?.username;
                const isUserActive = u.status === 'Active' || u.isActive === true;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#008e8b]/10 text-[#008e8b] font-bold flex items-center justify-center text-xs">
                          {u.fullName ? u.fullName.charAt(0) : u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                            @{u.username}
                            {isCurrent && (
                              <span className="text-[10px] bg-teal-100 text-[#008e8b] px-1.5 py-0.2 rounded font-sans">
                                أنت
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{u.fullName}</td>
                    <td className="p-3.5 text-slate-600">{u.department || '—'}</td>
                    <td className="p-3.5">{getRoleBadge(u.role)}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-[#008e8b] rounded-lg border border-slate-200 font-mono text-[11px] transition-colors cursor-pointer"
                        title="انقر لتغيير أو تعيين كلمة المرور"
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>••••••••</span>
                        {isAdmin && <span className="text-[10px] text-[#008e8b] mr-1 font-sans">تعديل</span>}
                      </button>
                    </td>
                    <td className="p-3.5">
                      {isUserActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          <UserCheck className="w-3 h-3" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          <UserX className="w-3 h-3" />
                          معطل
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {u.lastLogin ? u.lastLogin.split('T')[0] : '—'}
                    </td>
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-[#008e8b] hover:bg-teal-50 rounded-lg transition"
                            title="تعديل المستخدم أو كلمة المرور"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'تعديل بيانات المستخدم وكلمة المرور' : 'إضافة مستخدم جديد للنظام'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اسم المستخدم (Username)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="مثال: ahmed.hr"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'أدخل كلمة مرور قوية'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">مستوى الصلاحية (Role)</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                  >
                    <option value="Admin">مدير نظام (Admin)</option>
                    <option value="HR">مسؤول موارد بشرية (HR)</option>
                    <option value="Supervisor">مشرف قسم (Supervisor)</option>
                    <option value="Viewer">مشاهد فقط (Viewer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">القسم / الإدارة</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="مثال: الموارد البشرية"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-[#008e8b] focus:ring-[#008e8b]"
                  />
                  <span>حساب نشط ومصرح له بتسجيل الدخول</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#008e8b] hover:bg-[#007775] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
