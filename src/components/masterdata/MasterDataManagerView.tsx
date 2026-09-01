import React, { useState } from 'react';
import {
  Database,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  FolderTree,
  ListFilter,
  Save,
  Trash2,
  Search,
  Building,
  GraduationCap,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  Download,
  Info,
  Check
} from 'lucide-react';
import { MasterDataCategory, MasterDataItem } from '../../types';
import { MasterDataService } from '../../services/masterDataService';
import { storageService } from '../../services/storageService';
import { AcademicYearsManagement } from '../settings/AcademicYearsManagement';

type MainTab = 'ACADEMIC' | 'YEARS' | 'HR' | 'STUDENTS' | 'BEHAVIOR';

export const MasterDataManagerView: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('ACADEMIC');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [masterData, setMasterData] = useState<MasterDataItem[]>(() => MasterDataService.getMasterData());
  const [editingItem, setEditingItem] = useState<Partial<MasterDataItem> | null>(null);
  const [dependencyWarning, setDependencyWarning] = useState<{ isOpen: boolean; message: string; itemId?: string; itemName?: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const reloadData = () => {
    setMasterData(MasterDataService.getMasterData());
  };

  const subTypeOptions: Record<string, Array<{ key: string; label: string }>> = {
    ACADEMIC: [
      { key: 'ALL', label: 'كافة البنود الأكاديمية' },
      { key: 'STAGES', label: 'المراحل التعليمية' },
      { key: 'GRADES', label: 'الصفوف الدراسية' },
      { key: 'CLASSROOMS', label: 'الفصول والشعب' },
      { key: 'SUBJECTS', label: 'المواد الدراسية' },
      { key: 'LOCATIONS', label: 'القاعات والمعامل' },
    ],
    HR: [
      { key: 'ALL', label: 'كافة بنود الموارد البشرية' },
      { key: 'DEPARTMENTS', label: 'الأقسام الإدارية والتعليمية' },
      { key: 'JOB_TITLES', label: 'المسميات والوظائف' },
      { key: 'LEAVE_TYPES', label: 'أنواع الإجازات' },
      { key: 'PERMISSION_TYPES', label: 'أنواع الأذونات' },
    ],
    STUDENTS: [
      { key: 'ALL', label: 'كافة بنود شؤون الطلاب' },
      { key: 'STUDENT_STATUS', label: 'حالات قيد الطلاب' },
      { key: 'ATTENDANCE_STATUS', label: 'حالات الحضور والغياب' },
      { key: 'ABSENCE_REASONS', label: 'أسباب وأعذار الغياب' },
      { key: 'TRANSFER_TYPES', label: 'أنواع التحويلات والحركات' },
    ],
    BEHAVIOR: [
      { key: 'ALL', label: 'كافة بنود اللائحة والسلوك' },
      { key: 'VIOLATION_TYPES', label: 'المخالفات السلوكية (-)' },
      { key: 'POSITIVE_TYPES', label: 'التعزيزات الإيجابية (+)' },
      { key: 'ACTIONS', label: 'الإجراءات والتدابير' },
    ],
  };

  const filteredItems = masterData.filter(item => {
    if (activeMainTab !== 'YEARS' && item.category !== (activeMainTab as MasterDataCategory)) return false;
    if (activeSubFilter !== 'ALL' && item.typeKey !== activeSubFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.nameAr.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.typeKey.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.nameAr?.trim() || !editingItem.code?.trim()) {
      alert('يرجى ملء اسم البند والكود الفريد');
      return;
    }

    const res = MasterDataService.saveMasterDataItem({
      ...editingItem,
      category: activeMainTab === 'YEARS' ? 'ACADEMIC' : (activeMainTab as MasterDataCategory),
      nameAr: editingItem.nameAr.trim(),
      code: editingItem.code.trim().toUpperCase(),
    });

    if (res.success) {
      showNotif(res.message || 'تم حفظ البند بنجاح');
      reloadData();
      setEditingItem(null);
    }
  };

  const handleToggleActive = (id: string) => {
    MasterDataService.toggleActive(id);
    reloadData();
    showNotif('تم تغيير حالة تفعيل البند');
  };

  const handleDeleteCheck = (item: MasterDataItem) => {
    // Dependency safeguard
    let entityType: any = 'subject';
    if (item.typeKey === 'GRADES') entityType = 'grade';
    else if (item.typeKey === 'CLASSROOMS') entityType = 'classroom';
    else if (item.typeKey === 'DEPARTMENTS') entityType = 'department';
    else if (item.typeKey === 'JOB_TITLES') entityType = 'jobTitle';
    else if (item.typeKey === 'VIOLATION_TYPES') entityType = 'behaviorType';

    const check = storageService.checkDependencies(entityType, item.nameAr);
    if (!check.canDelete) {
      setDependencyWarning({
        isOpen: true,
        message: check.message,
        itemId: item.id,
        itemName: item.nameAr,
      });
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف البند "${item.nameAr}" نهائياً من القوائم؟`)) {
      handleToggleActive(item.id);
      showNotif('تم تعطيل البند بأمان');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">إدارة القوائم والتعريفات (Master Data Hub)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة ديناميكية مركزية لكافة خيارات النظام، الصفوف، الفصول، المواد، واللائحة بدون أي Hardcoding
            </p>
          </div>
        </div>

        {activeMainTab !== 'YEARS' && (
          <button
            onClick={() =>
              setEditingItem({
                category: activeMainTab as MasterDataCategory,
                typeKey: activeSubFilter !== 'ALL' ? activeSubFilter : (activeMainTab === 'HR' ? 'DEPARTMENTS' : 'SUBJECTS'),
                code: '',
                nameAr: '',
                isActive: true,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بند جديد</span>
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* 2. Main Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => {
            setActiveMainTab('ACADEMIC');
            setActiveSubFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeMainTab === 'ACADEMIC'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>البيانات الأكاديمية (المراحل، الصفوف، المواد)</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('YEARS');
            setActiveSubFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeMainTab === 'YEARS'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>الأعوام والفصول الدراسية وقواعد الترحيل</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('STUDENTS');
            setActiveSubFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeMainTab === 'STUDENTS'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>شؤون الطلاب وحالات الحضور</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('BEHAVIOR');
            setActiveSubFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeMainTab === 'BEHAVIOR'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>لائحة السلوك والانضباط</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('HR');
            setActiveSubFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeMainTab === 'HR'
              ? 'bg-[#008e8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الموارد البشرية وشؤون الموظفين</span>
        </button>
      </div>

      {/* 3. Render Academic Years Management if selected */}
      {activeMainTab === 'YEARS' ? (
        <AcademicYearsManagement />
      ) : (
        /* Master Data Table Container */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          {/* Sub Filters Pills */}
          {subTypeOptions[activeMainTab] && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                <ListFilter className="w-3.5 h-3.5" />
                <span>التصنيف الفرعي:</span>
              </span>
              {subTypeOptions[activeMainTab].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubFilter(sub.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSubFilter === sub.key
                      ? 'bg-teal-100 text-[#008e8b] border border-teal-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Search bar & Counts */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في البنود، الأسماء، أو الرموز..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#008e8b]"
              />
            </div>
            <div className="text-xs font-bold text-slate-500">
              إجمالي البنود: <span className="text-[#008e8b] font-mono">{filteredItems.length}</span> بند
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الرمز الفريد (Code)</th>
                  <th className="p-3.5">النوع والتصنيف</th>
                  <th className="p-3.5">الاسم بالعربية</th>
                  <th className="p-3.5">الوصف / ملاحظات</th>
                  <th className="p-3.5">حالة التفعيل</th>
                  <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#008e8b]">{item.code}</td>
                      <td className="p-3.5 text-slate-600 font-semibold">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">{item.typeKey}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{item.nameAr}</td>
                      <td className="p-3.5 text-slate-500">{item.description || '—'}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.isActive ? 'مفعل نشط' : 'معطل / مؤرشف'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                            title="تعديل البند"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              item.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.isActive ? 'تعطيل وأرشفة' : 'إعادة تفعيل'}
                          >
                            {item.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCheck(item)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="فحص الاعتمادية والحذف الآمن"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 text-xs">
                      لا توجد بنود مسجلة مطابقة للبحث أو الفلتر المختار.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dependency Warning Modal */}
      {dependencyWarning && dependencyWarning.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">تنبيه أمان البيانات والاعتماديات</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{dependencyWarning.message}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>لحماية سلامة السجلات التاريخية للطلاب والموظفين، نوصي بتعطيل البند فقط دون حذفه نهائياً.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDependencyWarning(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
              {dependencyWarning.itemId && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleActive(dependencyWarning.itemId!);
                    setDependencyWarning(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-xs"
                >
                  تعطيل البند الآن
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right">
            <h3 className="text-base font-bold text-slate-900">
              {editingItem.id ? 'تعديل بند في القوائم والتعريفات' : 'إضافة بند جديد في القوائم'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نوع القائمة (Type Key) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editingItem.typeKey || ''}
                  onChange={e => setEditingItem({ ...editingItem, typeKey: e.target.value.toUpperCase() })}
                  placeholder="مثال: GRADES, SUBJECTS, DEPARTMENTS"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:border-[#008e8b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رمز الكود الفريد (Code) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editingItem.code || ''}
                  onChange={e => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: G_SEC_1, SUB_MATH"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:border-[#008e8b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الاسم باللغة العربية <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editingItem.nameAr || ''}
                  onChange={e => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                  placeholder="مثال: الصف الأول الثانوي / مادة الرياضيات"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#008e8b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الوصف / ملاحظات إضافية</label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="ملاحظات اختيارية عن البند"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#008e8b]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="itemIsActive"
                  checked={editingItem.isActive ?? true}
                  onChange={e => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="rounded text-[#008e8b] focus:ring-[#008e8b]"
                />
                <label htmlFor="itemIsActive" className="text-xs font-bold text-slate-700">
                  البند مفعل ونشط بالقوائم المنسدلة
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#008e8b] hover:bg-teal-700 cursor-pointer shadow-xs"
                >
                  حفظ البند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
