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
} from 'lucide-react';
import { MasterDataCategory, MasterDataItem } from '../../types';
import { MasterDataService } from '../../services/masterDataService';

export const MasterDataManagerView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MasterDataCategory>('ACADEMIC');
  const [searchQuery, setSearchQuery] = useState('');
  const [masterData, setMasterData] = useState<MasterDataItem[]>(() => MasterDataService.getMasterData());
  const [editingItem, setEditingItem] = useState<Partial<MasterDataItem> | null>(null);

  const categories: Array<{ key: MasterDataCategory; label: string; icon: React.ElementType }> = [
    { key: 'ACADEMIC', label: 'البيانات الأكاديمية (المواد والقاعات)', icon: GraduationCap },
    { key: 'HR', label: 'الموارد البشرية (الأقسام والمسميات والإجازات)', icon: Users },
    { key: 'STUDENTS', label: 'شؤون الطلاب (الحالات والتحويلات)', icon: Building },
    { key: 'BEHAVIOR', label: 'السلوك والانضباط', icon: Shield },
  ];

  const filteredItems = masterData.filter(item => {
    if (item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.nameAr.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.typeKey.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.nameAr || !editingItem.code) return;

    MasterDataService.saveMasterDataItem({
      ...editingItem,
      category: activeCategory,
    });
    setMasterData(MasterDataService.getMasterData());
    setEditingItem(null);
  };

  const handleToggleActive = (id: string) => {
    MasterDataService.toggleActive(id);
    setMasterData(MasterDataService.getMasterData());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">إدارة القوائم والتعريفات (Master Data)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة مركزية لجميع الخيارات والقوائم المنسدلة بدون الحاجة لتعديل الكود
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setEditingItem({
              category: activeCategory,
              typeKey: activeCategory === 'HR' ? 'DEPARTMENTS' : 'SUBJECTS',
              code: '',
              nameAr: '',
              isActive: true,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#008e8b] hover:bg-[#007775] text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة بند جديد</span>
        </button>
      </div>

      {/* 2. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#008e8b] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في البنود والرموز..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#008e8b]"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filteredItems.length} بنود مسجلة
          </span>
        </div>

        {/* Master Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الرمز (Code)</th>
                <th className="p-3.5">النوع والتصنيف</th>
                <th className="p-3.5">الاسم بالعربية</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#008e8b]">{item.code}</td>
                    <td className="p-3.5 text-slate-500 font-semibold">{item.typeKey}</td>
                    <td className="p-3.5 font-bold text-slate-800">{item.nameAr}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.isActive ? 'مفعل نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                          title={item.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {item.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    لا توجد بنود مطابقة في هذا التصنيف.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-800">
              {editingItem.id ? 'تعديل بند في القوائم والتعريفات' : 'إضافة بند جديد في القوائم'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نوع القائمة (Type Key)</label>
                <input
                  type="text"
                  required
                  value={editingItem.typeKey || ''}
                  onChange={e => setEditingItem({ ...editingItem, typeKey: e.target.value.toUpperCase() })}
                  placeholder="مثال: SUBJECTS, DEPARTMENTS"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رمز الكود الفريد (Code)</label>
                <input
                  type="text"
                  required
                  value={editingItem.code || ''}
                  onChange={e => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: SUB-MATH"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الاسم باللغة العربية</label>
                <input
                  type="text"
                  required
                  value={editingItem.nameAr || ''}
                  onChange={e => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                  placeholder="مثال: مادة الرياضيات المتقدمة"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#008e8b] hover:bg-[#007775] cursor-pointer"
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
