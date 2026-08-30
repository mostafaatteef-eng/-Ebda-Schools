import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit2,
  Percent,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import {
  FeeCategoryItem,
  PaymentInstallmentPlan,
  PaymentMethodConfig,
  PayrollRulesConfig,
  SystemSettings,
} from '../../types';
import {
  DEFAULT_FEE_CATEGORIES,
  DEFAULT_INSTALLMENT_PLANS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PAYROLL_RULES,
} from '../../data/initialData';
import { storageService } from '../../services/storageService';

interface FinancialRulesTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
  userRole?: string;
}

export const FinancialRulesTab: React.FC<FinancialRulesTabProps> = ({ formData, setFormData, userRole }) => {
  const [subSection, setSubSection] = useState<'fee_categories' | 'installment_plans' | 'payment_methods' | 'payroll_rules'>('fee_categories');

  // Fee Category Modal
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeCategoryItem | null>(null);
  const [feeForm, setFeeForm] = useState<Partial<FeeCategoryItem>>({
    name: '',
    defaultAmount: 5000,
    isMandatory: true,
    isRecurring: true,
    allowInstallments: true,
    isRefundable: false,
    isActive: true,
  });

  // Payment Method Modal
  const [isPayMethodModalOpen, setIsPayMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [methodForm, setMethodForm] = useState<Partial<PaymentMethodConfig>>({
    name: '',
    type: 'cash',
    requiresTransactionNumber: false,
    isActive: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const feeCategories = formData.feeCategories || DEFAULT_FEE_CATEGORIES;
  const installmentPlans = formData.installmentPlans || DEFAULT_INSTALLMENT_PLANS;
  const paymentMethods = formData.paymentMethods || DEFAULT_PAYMENT_METHODS;
  const payrollRules = formData.payrollRules || DEFAULT_PAYROLL_RULES;

  // ---------------- Fee Handlers ----------------
  const handleOpenAddFee = () => {
    setEditingFee(null);
    setFeeForm({
      name: '',
      defaultAmount: 5000,
      isMandatory: true,
      isRecurring: true,
      allowInstallments: true,
      isRefundable: false,
      isActive: true,
    });
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (fee: FeeCategoryItem) => {
    setEditingFee(fee);
    setFeeForm({ ...fee });
    setIsFeeModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name?.trim()) return;

    let updated: FeeCategoryItem[];
    if (editingFee) {
      updated = feeCategories.map(f => (f.id === editingFee.id ? ({ ...f, ...feeForm } as FeeCategoryItem) : f));
      showNotif(`تم تحديث بند الرسوم: ${feeForm.name}`);
    } else {
      const newF: FeeCategoryItem = {
        id: `FEE_${Date.now()}`,
        name: feeForm.name!.trim(),
        defaultAmount: Number(feeForm.defaultAmount) || 0,
        isMandatory: !!feeForm.isMandatory,
        isRecurring: feeForm.isRecurring !== false,
        allowInstallments: feeForm.allowInstallments !== false,
        isRefundable: !!feeForm.isRefundable,
        isActive: feeForm.isActive !== undefined ? feeForm.isActive : true,
      };
      updated = [...feeCategories, newF];
      showNotif(`تمت إضافة بند الرسوم الجديد: ${newF.name}`);
    }
    setFormData(prev => ({ ...prev, feeCategories: updated }));
    setIsFeeModalOpen(false);
  };

  const handleDeleteFee = (fee: FeeCategoryItem) => {
    if (window.confirm(`هل أنت متأكد من حذف بند الرسوم "${fee.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        feeCategories: feeCategories.filter(f => f.id !== fee.id),
      }));
      showNotif(`تم حذف بند الرسوم "${fee.name}"`);
    }
  };

  // ---------------- Payment Method Handlers ----------------
  const handleOpenAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      type: 'cash',
      requiresTransactionNumber: false,
      isActive: true,
    });
    setIsPayMethodModalOpen(true);
  };

  const handleOpenEditMethod = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setMethodForm({ ...method });
    setIsPayMethodModalOpen(true);
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name?.trim()) return;

    let updated: PaymentMethodConfig[];
    if (editingMethod) {
      updated = paymentMethods.map(m => (m.id === editingMethod.id ? ({ ...m, ...methodForm } as PaymentMethodConfig) : m));
      showNotif(`تم تحديث طريقة الدفع: ${methodForm.name}`);
    } else {
      const newM: PaymentMethodConfig = {
        id: `PM_${Date.now()}`,
        name: methodForm.name!.trim(),
        type: methodForm.type || 'cash',
        requiresTransactionNumber: !!methodForm.requiresTransactionNumber,
        isActive: methodForm.isActive !== undefined ? methodForm.isActive : true,
      };
      updated = [...paymentMethods, newM];
      showNotif(`تمت إضافة طريقة الدفع الجديدة: ${newM.name}`);
    }
    setFormData(prev => ({ ...prev, paymentMethods: updated }));
    setIsPayMethodModalOpen(false);
  };

  const handleDeleteMethod = (method: PaymentMethodConfig) => {
    if (window.confirm(`هل أنت متأكد من حذف طريقة الدفع "${method.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: paymentMethods.filter(m => m.id !== method.id),
      }));
      showNotif(`تم حذف طريقة الدفع "${method.name}"`);
    }
  };

  return (
    <div className="space-y-6" id="financial_rules_container">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubSection('fee_categories')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'fee_categories'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Banknote className="w-4 h-4" />
            بنود الرسوم والمصروفات ({feeCategories.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('installment_plans')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'installment_plans'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            خطط وجداول الأقساط ({installmentPlans.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('payment_methods')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'payment_methods'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            طرق وقنوات السداد ({paymentMethods.length})
          </button>

          <button
            type="button"
            onClick={() => setSubSection('payroll_rules')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'payroll_rules'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            قواعد الرواتب والأجور
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('هل تريد استعادة الإعدادات المالية الافتراضية؟')) {
              storageService.resetSettingsSection('feeCategories');
              storageService.resetSettingsSection('installmentPlans');
              storageService.resetSettingsSection('paymentMethods');
              storageService.resetSettingsSection('payrollRules');
              setFormData(storageService.getSettings());
              showNotif('تمت استعادة الإعدادات المالية الافتراضية بنجاح');
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

      {/* ---------------- Sub-Section: Fee Categories ---------------- */}
      {subSection === 'fee_categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-teal-600" />
                دليل الرسوم والمصروفات الدراسية
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد بنود المصروفات، القيمة الافتراضية، وقابلية التقسيط أو الاسترداد</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddFee}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة بند رسوم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeCategories.map((fee, idx) => (
              <div
                key={fee.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-white">{fee.name}</h4>
                    <span className="text-xs text-slate-400">
                      {fee.isMandatory ? 'إلزامي لجميع الطلاب' : 'اختياري'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-base text-teal-700 dark:text-teal-400">
                    {fee.defaultAmount.toLocaleString()} ج.م
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>• {fee.allowInstallments ? 'يقبل التقسيط' : 'سداد كامل'}</div>
                  <div>• {fee.isRefundable ? 'قابل للاسترداد' : 'غير مسترد'}</div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditFee(fee)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFee(fee)}
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

      {/* ---------------- Sub-Section: Installment Plans ---------------- */}
      {subSection === 'installment_plans' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              جداول وخطط تقسيط المصروفات
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد نسب الدفعات ومواعيد استحقاق كل قسط دراسي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(installmentPlans || []).map(plan => {
              const installmentsList = plan.installments || (
                (plan.distributionPercentages || []).map((pct, i) => ({
                  label: `القسط ${i + 1}`,
                  percentage: pct,
                  dueMonth: plan.dueMonths?.[i] || 'حسب الموعد المقرر',
                }))
              );

              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{plan.name}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                      {plan.installmentsCount || installmentsList.length} أقساط
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {installmentsList.map((inst, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/40 rounded">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{inst.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-600">{inst.percentage}%</span>
                          <span className="text-slate-400 text-[10px]">استحقاق: {inst.dueMonth}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(plan.latePenaltyPercentage > 0 || plan.discountEarlyPaymentPercentage > 0) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                      {plan.discountEarlyPaymentPercentage > 0 && (
                        <span className="text-emerald-600 font-medium">خصم السداد المبكر: {plan.discountEarlyPaymentPercentage}%</span>
                      )}
                      {plan.latePenaltyPercentage > 0 && (
                        <span className="text-rose-600 font-medium">غرامة التأخير: {plan.latePenaltyPercentage}%</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Payment Methods ---------------- */}
      {subSection === 'payment_methods' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                طرق وقنوات تحصيل المصروفات
              </h3>
              <p className="text-xs text-slate-500 mt-1">تحديد وسائل الدفع المعتمدة (نقدي، فيزا، تحويل بنكي، فوري...)</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddMethod}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة طريقة دفع
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((pm, idx) => (
              <div
                key={pm.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-base text-slate-800 dark:text-white">{pm.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {pm.type}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {pm.requiresTransactionNumber ? '✓ يتطلب إدخال رقم المعاملة/الإيصال' : '○ لا يتطلب رقم معاملة'}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditMethod(pm)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMethod(pm)}
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

      {/* ---------------- Sub-Section: Payroll Rules ---------------- */}
      {subSection === 'payroll_rules' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-teal-600" />
              قواعد احتساب الرواتب والبدلات والاستقطاعات
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد يوم صرف الرواتب، معاملات الخصم والإضافي، والضرائب</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                يوم صرف الرواتب شهرياً
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={payrollRules.salaryDisbursementDay || 28}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    payrollRules: {
                      ...payrollRules,
                      salaryDisbursementDay: parseInt(e.target.value, 10) || 28,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                معامل احتساب الساعة الإضافية
              </label>
              <input
                type="number"
                step="0.1"
                value={payrollRules.overtimeHourRateMultiplier || 1.5}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    payrollRules: {
                      ...payrollRules,
                      overtimeHourRateMultiplier: parseFloat(e.target.value) || 1.5,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نسبة التأمينات الاجتماعية (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={payrollRules.socialInsurancePercentage || 11}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    payrollRules: {
                      ...payrollRules,
                      socialInsurancePercentage: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Fee Form ---------------- */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-teal-600" />
                {editingFee ? 'تعديل بند الرسوم' : 'إضافة بند رسوم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFeeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم بند الرسوم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رسوم دراسية، خدمة باص، كتب وأنشطة..."
                  value={feeForm.name || ''}
                  onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  القيمة الافتراضية (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={feeForm.defaultAmount || 0}
                  onChange={e => setFeeForm({ ...feeForm, defaultAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!feeForm.isMandatory}
                    onChange={e => setFeeForm({ ...feeForm, isMandatory: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>رسم إلزامي يُسند لجميع الطلاب تلقائياً</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeForm.allowInstallments !== false}
                    onChange={e => setFeeForm({ ...feeForm, allowInstallments: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>إمكانية السداد على أقساط متعددة</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!feeForm.isRefundable}
                    onChange={e => setFeeForm({ ...feeForm, isRefundable: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>رسم قابل للاسترداد في حال الانسحاب</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ بند الرسوم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Method Form ---------------- */}
      {isPayMethodModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {editingMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPayMethodModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم طريقة الدفع *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نقدي بخزينة المدرسة، تحويل بنكي الأهلي..."
                  value={methodForm.name || ''}
                  onChange={e => setMethodForm({ ...methodForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  النوع التقني
                </label>
                <select
                  value={methodForm.type || 'cash'}
                  onChange={e => setMethodForm({ ...methodForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  <option value="cash">نقدي (Cash)</option>
                  <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="pos_card">بطاقة بنكية / فيزا (POS / Card)</option>
                  <option value="electronic_wallet">محفظة إلكترونية (E-Wallet / Fawry)</option>
                  <option value="cheque">شيك مصرفي (Cheque)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!methodForm.requiresTransactionNumber}
                    onChange={e => setMethodForm({ ...methodForm, requiresTransactionNumber: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>إلزامية إدخال رقم المعاملة أو الإيصال البنكي</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPayMethodModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ طريقة الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
