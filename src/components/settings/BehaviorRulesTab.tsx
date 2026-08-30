import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bell,
  CheckCircle2,
  Edit2,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  AlertRuleItem,
  BehaviorLevelItem,
  BehaviorScoreRule,
  BehaviorType,
  SystemSettings,
} from '../../types';
import {
  DEFAULT_ALERT_RULES,
  DEFAULT_BEHAVIOR_LEVELS,
  DEFAULT_BEHAVIOR_RULES,
  DEFAULT_BEHAVIOR_TYPES,
} from '../../data/initialData';
import { storageService } from '../../services/storageService';

interface BehaviorRulesTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const BehaviorRulesTab: React.FC<BehaviorRulesTabProps> = ({ formData, setFormData }) => {
  const [subSection, setSubSection] = useState<'scoring_levels' | 'violations_catalog' | 'alert_rules'>('scoring_levels');

  // Violation Modal
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<BehaviorType | null>(null);
  const [violationForm, setViolationForm] = useState<Partial<BehaviorType>>({
    name: '',
    category: 'انضباط مدرسي',
    severity: 'بسيطة',
    points: 3,
    weight: 3,
    defaultAction: '',
    notifyParent: true,
    requiresAdminReview: false,
    isActive: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const behaviorRules: BehaviorScoreRule = formData.behaviorScoreRules || DEFAULT_BEHAVIOR_RULES;
  const behaviorLevels: BehaviorLevelItem[] = formData.behaviorLevels || DEFAULT_BEHAVIOR_LEVELS;
  const violationsList: BehaviorType[] = storageService.getBehaviorTypes();
  const alertRules: AlertRuleItem[] = formData.alertRules || DEFAULT_ALERT_RULES;

  // ---------------- Violation Handlers ----------------
  const handleOpenAddViolation = () => {
    setEditingViolation(null);
    setViolationForm({
      name: '',
      category: 'انضباط مدرسي',
      severity: 'بسيطة',
      points: 3,
      weight: 3,
      defaultAction: '',
      notifyParent: true,
      requiresAdminReview: false,
      isActive: true,
    });
    setIsViolationModalOpen(true);
  };

  const handleOpenEditViolation = (v: BehaviorType) => {
    setEditingViolation(v);
    setViolationForm({ ...v });
    setIsViolationModalOpen(true);
  };

  const handleSaveViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationForm.name?.trim()) return;

    if (editingViolation) {
      storageService.saveBehaviorType({
        ...editingViolation,
        ...violationForm,
      } as BehaviorType);
      showNotif(`تم تحديث بند المخالفة: ${violationForm.name}`);
    } else {
      const newV: BehaviorType = {
        id: `BEH_${Date.now()}`,
        name: violationForm.name!.trim(),
        category: violationForm.category || 'انضباط مدرسي',
        severity: violationForm.severity || 'بسيطة',
        points: Number(violationForm.points) || 3,
        weight: Number(violationForm.weight) || 3,
        defaultAction: violationForm.defaultAction?.trim() || '',
        notifyParent: !!violationForm.notifyParent,
        requiresAdminReview: !!violationForm.requiresAdminReview,
        isActive: violationForm.isActive !== undefined ? violationForm.isActive : true,
      };
      storageService.saveBehaviorType(newV);
      showNotif(`تمت إضافة بند المخالفة الجديد: ${newV.name}`);
    }

    setIsViolationModalOpen(false);
  };

  const handleDeleteViolation = (v: BehaviorType) => {
    const depCheck = storageService.checkDependencies('behaviorType', v.id);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف بند المخالفة "${v.name}"؟`)) {
      storageService.deleteBehaviorType(v.id);
      showNotif(`تم حذف البند "${v.name}"`);
    }
  };

  const handleToggleAlertRule = (id: string) => {
    const updated = alertRules.map(r => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    setFormData(prev => ({ ...prev, alertRules: updated }));
  };

  return (
    <div className="space-y-6" id="behavior_rules_container">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubSection('scoring_levels')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'scoring_levels'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            نظام ومستويات نقاط السلوك
          </button>

          <button
            type="button"
            onClick={() => setSubSection('violations_catalog')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'violations_catalog'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            دليل وبنود المخالفات السلوكية ({violationsList.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('alert_rules')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'alert_rules'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            قواعد التنبيهات والإنذارات التلقائية
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('هل تريد استعادة قواعد الانضباط والسلوك الافتراضية؟')) {
              storageService.resetSettingsSection('behaviorScoreRules');
              storageService.resetSettingsSection('behaviorLevels');
              storageService.resetSettingsSection('alertRules');
              setFormData(storageService.getSettings());
              showNotif('تمت استعادة إعدادات السلوك الافتراضية بنجاح');
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

      {/* ---------------- Sub-Section: Scoring & Levels ---------------- */}
      {subSection === 'scoring_levels' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600" />
                محرك احتساب درجات السلوك والانضباط
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد الرصيد الابتدائي للطالب وحدود التميز والتنبيه</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الرصيد الابتدائي للنقاط (بداية العام)
                </label>
                <input
                  type="number"
                  value={behaviorRules.initialScore || 100}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      behaviorScoreRules: {
                        ...behaviorRules,
                        initialScore: parseInt(e.target.value, 10) || 100,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عتبة السلوك الممتاز (أكبر من أو يساوي)
                </label>
                <input
                  type="number"
                  value={behaviorRules.excellentThreshold || 90}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      behaviorScoreRules: {
                        ...behaviorRules,
                        excellentThreshold: parseInt(e.target.value, 10) || 90,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عتبة الإنذار السلوكي (أقل من)
                </label>
                <input
                  type="number"
                  value={behaviorRules.warningThreshold || 60}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      behaviorScoreRules: {
                        ...behaviorRules,
                        warningThreshold: parseInt(e.target.value, 10) || 60,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Behavior Levels Grid */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              مستويات التقييم السلوكي المعتمدة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {behaviorLevels.map((lvl, idx) => (
                <div
                  key={lvl.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ backgroundColor: lvl.color || '#10b981' }}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{lvl.name}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {lvl.minPercentage}% - {lvl.maxPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{lvl.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Violations Catalog ---------------- */}
      {subSection === 'violations_catalog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                لائحة الانضباط المدرسي ودليل المخالفات
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد درجات المخالفات، النقاط المحسومة، الإجراء التربوي الموصى به، وإخطار ولي الأمر
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddViolation}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة بند مخالفة جديد
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="p-3">بند المخالفة</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">النقاط المخصومة</th>
                  <th className="p-3">الإجراء الافتراضي</th>
                  <th className="p-3">إشعار ولي الأمر</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {violationsList.map((v, idx) => (
                  <tr key={v.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-slate-800 dark:text-white">{v.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">{v.category}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          v.severity === 'خطيرة جداً'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : v.severity === 'شديدة'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                            : v.severity === 'متوسطة'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {v.severity}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-rose-600">-{v.points} نقطة</td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{v.defaultAction || '-'}</td>
                    <td className="p-3">
                      {v.notifyParent ? (
                        <span className="text-xs text-emerald-600 font-semibold">✓ فوري</span>
                      ) : (
                        <span className="text-xs text-slate-400">○ اختياري</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditViolation(v)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteViolation(v)}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Alert Rules ---------------- */}
      {subSection === 'alert_rules' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" />
              قواعد التنبيهات والإنذارات التلقائية
            </h3>
            <p className="text-xs text-slate-500 mt-1">توليد إشعارات تنبيه آلية للمشرفين، المعلمين، وأولياء الأمور</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertRules.map(rule => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{rule.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      العتبة: <strong className="text-teal-600 font-bold">{rule.thresholdValue}</strong> {rule.unitText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAlertRule(rule.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      rule.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {rule.isActive ? 'التنبيه مفعل' : 'معطل'}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300">
                  {rule.messageTemplate}
                </div>

                <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                  <span>الأدوار المستهدفة:</span>
                  {(rule.targetRoles || []).map(r => (
                    <span key={r} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Modal: Violation Form ---------------- */}
      {isViolationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                {editingViolation ? 'تعديل بند المخالفة' : 'إضافة بند مخالفة جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsViolationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveViolation} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم أو وصف بند المخالفة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التأخر عن الطابور، استخدام الهاتف..."
                  value={violationForm.name || ''}
                  onChange={e => setViolationForm({ ...violationForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف المخالفة
                  </label>
                  <select
                    value={violationForm.category || 'انضباط مدرسي'}
                    onChange={e => setViolationForm({ ...violationForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="انضباط مدرسي">انضباط مدرسي</option>
                    <option value="مظهر وانضباط">مظهر وانضباط</option>
                    <option value="سلوكية داخل الفصل">سلوكية داخل الفصل</option>
                    <option value="أخلاقية وتربوية">أخلاقية وتربوية</option>
                    <option value="ممتلكات عامة">ممتلكات عامة</option>
                    <option value="خطيرة">خطيرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درجة الشدة
                  </label>
                  <select
                    value={violationForm.severity || 'بسيطة'}
                    onChange={e => setViolationForm({ ...violationForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="بسيطة">بسيطة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="شديدة">شديدة</option>
                    <option value="خطيرة جداً">خطيرة جداً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    النقاط المحسومة
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={violationForm.points || 3}
                    onChange={e => setViolationForm({ ...violationForm, points: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الإجراء التربوي أو الإداري الموصى به
                </label>
                <input
                  type="text"
                  placeholder="مثال: تنبيه شفوي، تعهد كتابي، استدعاء ولي أمر..."
                  value={violationForm.defaultAction || ''}
                  onChange={e => setViolationForm({ ...violationForm, defaultAction: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={violationForm.notifyParent !== false}
                    onChange={e => setViolationForm({ ...violationForm, notifyParent: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>إرسال إشعار فوري لولي الأمر عبر البوابة عند تسجيل هذه المخالفة</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!violationForm.requiresAdminReview}
                    onChange={e => setViolationForm({ ...violationForm, requiresAdminReview: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>تتطلب مراجعة واعتماد رسمي من إدارة المدرسة قبل الخصم النهائي</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsViolationModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ بند المخالفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
