import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AcademicYear, Term, PromotionRule } from '../../types';
import { StudentPromotionWizard } from '../students/StudentPromotionWizard';

export const AcademicYearsManagement: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => storageService.getAcademicYears());
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>(() => storageService.getPromotionRules());
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedYearForModal, setSelectedYearForModal] = useState<AcademicYear | null>(null);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'years' | 'rules'>('years');
  const [notification, setNotification] = useState<string | null>(null);

  // Year Form
  const [yearForm, setYearForm] = useState<Partial<AcademicYear>>({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    status: 'Draft',
    terms: [
      { id: `TERM_${Date.now()}_1`, name: 'الفصل الدراسي الأول', startDate: '', endDate: '', status: 'Active', isCurrent: true },
      { id: `TERM_${Date.now()}_2`, name: 'الفصل الدراسي الثاني', startDate: '', endDate: '', status: 'Draft', isCurrent: false }
    ],
    notes: ''
  });

  const reloadData = () => {
    setAcademicYears(storageService.getAcademicYears());
    setPromotionRules(storageService.getPromotionRules());
  };

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddYear = () => {
    setSelectedYearForModal(null);
    const nextYearStart = new Date().getFullYear();
    setYearForm({
      name: `العام الدراسي ${nextYearStart}/${nextYearStart + 1}`,
      code: `${nextYearStart}-${nextYearStart + 1}`,
      startDate: `${nextYearStart}-09-20`,
      endDate: `${nextYearStart + 1}-06-15`,
      status: 'Active',
      terms: [
        { id: `TERM_${Date.now()}_1`, name: 'الفصل الدراسي الأول', startDate: `${nextYearStart}-09-20`, endDate: `${nextYearStart + 1}-01-22`, status: 'Active', isCurrent: true },
        { id: `TERM_${Date.now()}_2`, name: 'الفصل الدراسي الثاني', startDate: `${nextYearStart + 1}-02-07`, endDate: `${nextYearStart + 1}-06-15`, status: 'Draft', isCurrent: false }
      ],
      notes: ''
    });
    setIsYearModalOpen(true);
  };

  const handleOpenEditYear = (year: AcademicYear) => {
    setSelectedYearForModal(year);
    setYearForm({ ...year });
    setIsYearModalOpen(true);
  };

  const handleSaveYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name?.trim() || !yearForm.startDate || !yearForm.endDate) {
      alert('يرجى ملء اسم العام وتاريخ البداية والنهاية');
      return;
    }

    const yearData: AcademicYear = {
      id: selectedYearForModal ? selectedYearForModal.id : `AY_${Date.now()}`,
      name: yearForm.name.trim(),
      code: yearForm.code || yearForm.name.trim(),
      startDate: yearForm.startDate,
      endDate: yearForm.endDate,
      status: yearForm.status || 'Active',
      isDefault: yearForm.isDefault,
      isLocked: yearForm.isLocked || false,
      terms: yearForm.terms || [],
      notes: yearForm.notes || ''
    };

    const res = storageService.saveAcademicYear(yearData);
    if (res.success) {
      showNotif(res.message || 'تم حفظ العام الدراسي بنجاح');
      setIsYearModalOpen(false);
      reloadData();
    } else {
      alert(res.message || 'فشل الحفظ');
    }
  };

  const handleSetActive = (yearId: string) => {
    const res = storageService.setActiveAcademicYear(yearId);
    if (res.success) {
      showNotif(res.message || 'تم تفعيل العام الدراسي');
      reloadData();
    } else {
      alert(res.message);
    }
  };

  const handleCloseYear = (yearId: string) => {
    const reason = prompt('يرجى كتابة سبب إغلاق وأرشفة العام الدراسي:', 'إغلاق نهاية العام الدراسي وترحيل البيانات');
    if (reason !== null) {
      const res = storageService.closeAcademicYear(yearId, reason);
      if (res.success) {
        showNotif(res.message || 'تم إغلاق العام الدراسي');
        reloadData();
      } else {
        alert(res.message);
      }
    }
  };

  const handleReopenYear = (yearId: string) => {
    if (window.confirm('هل تريد إعادة فتح هذا العام الدراسي للتعديل؟')) {
      const res = storageService.reopenAcademicYear(yearId);
      if (res.success) {
        showNotif(res.message || 'تمت إعادة فتح العام الدراسي');
        reloadData();
      } else {
        alert(res.message);
      }
    }
  };

  const handleDeleteYear = (year: AcademicYear) => {
    if (window.confirm(`هل أنت متأكد من حذف "${year.name}" نهائياً؟`)) {
      const res = storageService.deleteAcademicYear(year.id);
      if (res.success) {
        showNotif(res.message || 'تم الحذف');
        reloadData();
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('years')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'years'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            الأعوام والفصول الدراسية ({academicYears.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            قواعد ومعايير الترقية ({promotionRules.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            معالج ترحيل الطلاب
          </button>

          <button
            type="button"
            onClick={handleOpenAddYear}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة عام دراسي جديد
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* SUB TAB 1: ACADEMIC YEARS */}
      {activeSubTab === 'years' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academicYears.map(year => {
            const isActive = year.status === 'Active' || year.status === 'ACTIVE' || year.isDefault;
            const isLocked = year.isLocked || year.status === 'Closed' || year.status === 'CLOSED';

            return (
              <div
                key={year.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isActive
                    ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{year.name}</h3>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          العام النشط الحالي
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          مغلق ومؤرشف
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      الفترة: {year.startDate} إلى {year.endDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditYear(year)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!isActive && !isLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteYear(year)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Terms List */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    الفصول الدراسية (الترم):
                  </div>
                  <div className="space-y-1.5">
                    {year.terms?.map((term, tIdx) => (
                      <div key={term.id || tIdx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800">{term.name}</span>
                        <span className="text-slate-500">{term.startDate} ~ {term.endDate}</span>
                        {term.isCurrent && (
                          <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-bold text-[9px]">الفصل الحالي</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetActive(year.id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition-colors"
                      >
                        تعيين كعام نشط
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => handleReopenYear(year.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                        إعادة فتح العام
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCloseYear(year.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        إغلاق وأرشفة العام
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB TAB 2: PROMOTION RULES */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الصف الدراسي الحالي</th>
                  <th className="p-3">الصف المستهدف للترقية</th>
                  <th className="p-3">نوع القاعدة</th>
                  <th className="p-3">الحد الأدنى للحضور</th>
                  <th className="p-3">الحد الأدنى للسلوك</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotionRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{rule.sourceGrade || rule.fromGrade}</td>
                    <td className="p-3 text-indigo-700 font-bold">{rule.targetGrade || rule.toGrade}</td>
                    <td className="p-3 text-slate-600">{rule.ruleType || 'تلقائي للكل'}</td>
                    <td className="p-3 font-mono">{rule.minAttendancePercentage || 75}%</td>
                    <td className="p-3 font-mono">{rule.minBehaviorScore || 60} نقطة</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {rule.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year Modal */}
      {isYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 bg-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {selectedYearForModal ? 'تعديل العام الدراسي' : 'إضافة عام دراسي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsYearModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveYear} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العام الدراسي</label>
                <input
                  type="text"
                  required
                  value={yearForm.name || ''}
                  onChange={e => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="مثال: العام الدراسي 2026/2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البداية</label>
                  <input
                    type="date"
                    required
                    value={yearForm.startDate || ''}
                    onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ النهاية</label>
                  <input
                    type="date"
                    required
                    value={yearForm.endDate || ''}
                    onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات العام</label>
                <input
                  type="text"
                  value={yearForm.notes || ''}
                  onChange={e => setYearForm({ ...yearForm, notes: e.target.value })}
                  placeholder="ملاحظات اختيارية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsYearModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  حفظ العام الدراسي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Wizard */}
      {isWizardOpen && (
        <StudentPromotionWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            setIsWizardOpen(false);
            reloadData();
          }}
        />
      )}
    </div>
  );
};
