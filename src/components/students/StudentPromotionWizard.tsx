import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Search,
  Filter,
  Layers,
  ChevronRight,
  School
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AcademicYear, Student, StudentEnrollment, PromotionRule } from '../../types';

interface StudentPromotionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentDecisionItem {
  action: 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT';
  targetGrade: string;
  targetClassroom: string;
  notes: string;
}

export const StudentPromotionWizard: React.FC<StudentPromotionWizardProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [sourceYearId, setSourceYearId] = useState<string>(() => {
    const active = storageService.getActiveAcademicYear();
    return active ? active.id : '';
  });
  const [targetYearId, setTargetYearId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; promotedCount: number; retainedCount: number; errors: string[] } | null>(null);

  const academicYears = storageService.getAcademicYears();
  const settings = storageService.getSettings();
  const stages = settings.stages || [];
  const allGrades = useMemo(() => {
    const grades: string[] = [];
    stages.forEach(st => {
      st.grades?.forEach(g => {
        if (!grades.includes(g.name)) grades.push(g.name);
      });
    });
    return grades;
  }, [stages]);

  // Student decisions mapping
  const [studentDecisions, setStudentDecisions] = useState<Record<string, StudentDecisionItem>>({});

  // Fetch enrolled students in the source academic year
  const sourceStudents = useMemo(() => {
    if (!sourceYearId) return [];
    return storageService.getStudents().filter(s => s.status !== 'غير نشط' && s.status !== 'متخرج');
  }, [sourceYearId]);

  // Initialize decisions when source students or grade rules change
  const initializePromotionDecisions = () => {
    const rules = storageService.getPromotionRules();
    const decisions: Record<string, StudentDecisionItem> = {};

    sourceStudents.forEach(stu => {
      // Find matching promotion rule
      const rule = rules.find(r => r.sourceGrade === stu.grade || r.fromGrade === stu.grade);
      const behaviorScore = storageService.calculateStudentBehaviorScore(stu.id);
      
      let action: 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT' = 'PROMOTED';
      let targetGrade = '';

      if (rule?.isGraduation || rule?.defaultAction === 'تخرج' || stu.grade.includes('الثالث الثانوي')) {
        action = 'GRADUATED';
        targetGrade = 'خريج';
      } else if (rule?.targetGrade) {
        targetGrade = rule.targetGrade;
      } else if (rule?.toGrade) {
        targetGrade = rule.toGrade;
      } else {
        // Find next grade in sequence
        const currentIdx = allGrades.indexOf(stu.grade);
        if (currentIdx >= 0 && currentIdx < allGrades.length - 1) {
          targetGrade = allGrades[currentIdx + 1];
        } else {
          targetGrade = stu.grade;
        }
      }

      decisions[stu.id] = {
        action,
        targetGrade,
        targetClassroom: stu.classroom || '1/1',
        notes: ''
      };
    });

    setStudentDecisions(decisions);
  };

  const handleSourceYearChange = (yearId: string) => {
    setSourceYearId(yearId);
    // Find next year as default target
    const sourceIdx = academicYears.findIndex(y => y.id === yearId);
    if (sourceIdx >= 0 && sourceIdx < academicYears.length - 1) {
      setTargetYearId(academicYears[sourceIdx + 1].id);
    }
  };

  const filteredStudents = useMemo(() => {
    return sourceStudents.filter(stu => {
      const matchGrade = selectedGrade === 'ALL' || stu.grade === selectedGrade;
      const matchSearch =
        !searchTerm.trim() ||
        stu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stu.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [sourceStudents, selectedGrade, searchTerm]);

  const handleDecisionChange = (studentId: string, field: keyof StudentDecisionItem, value: any) => {
    setStudentDecisions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleBatchApplyAction = (action: 'PROMOTED' | 'RETAINED' | 'GRADUATED') => {
    setStudentDecisions(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(stu => {
        if (updated[stu.id]) {
          updated[stu.id].action = action;
          if (action === 'RETAINED') {
            updated[stu.id].targetGrade = stu.grade;
          } else if (action === 'GRADUATED') {
            updated[stu.id].targetGrade = 'خريج';
          }
        }
      });
      return updated;
    });
  };

  const handleExecutePromotion = async () => {
    if (!targetYearId || targetYearId === sourceYearId) {
      alert('يرجى اختيار عام دراسي تالي مختلف عن العام الحالي');
      return;
    }

    setIsExecuting(true);
    try {
      const rules = storageService.getPromotionRules();
      const decisionList = Object.keys(studentDecisions).map(studentId => {
        const dec = studentDecisions[studentId];
        return {
          studentId,
          decision: dec.action,
          targetGrade: dec.targetGrade,
          targetClassroom: dec.targetClassroom,
          notes: dec.notes
        };
      });

      const res = storageService.executeStudentPromotion({
        sourceYearId,
        targetYearId,
        rules,
        studentDecisions: decisionList
      });

      setExecutionResult(res);
      setCurrentStep(4);
      onSuccess();
    } catch (err: any) {
      alert(`فشل تنفيذ الترحيل: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-indigo-700 via-indigo-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">معالج ترحيل وترقية الطلاب (Student Promotion Wizard)</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                ترحيل وتوزيع الطلاب آلياً إلى العام الدراسي الجديد مع الحفاظ على السجلات السابقة 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 text-xs font-bold">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>1</span>
              <span>تحديد الأعوام الدراسية</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>2</span>
              <span>قواعد ومعايير الترقية</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>3</span>
              <span>مراجعة وتعديل التوزيع</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>4</span>
              <span>اكتمال الترحيل</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {/* STEP 1: Select Academic Years */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-900 text-xs leading-relaxed flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-1">تعليمات ترحيل العام الدراسي:</p>
                  <p>
                    سيقوم النظام بنسخ قيود الطلاب إلى العام الدراسي المستهدف وتعيين الصفوف الجديدة مع إنشاء سجل ترحيل رسمي. ستبقى جميع البيانات والدرجات والحضور في العام السابق محفوظة بالكامل.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    1. العام الدراسي الحالي (المصدر):
                  </label>
                  <select
                    value={sourceYearId}
                    onChange={e => handleSourceYearChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.status === 'Active' || y.status === 'ACTIVE' ? '(العام النشط الحالي)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    عدد الطلاب المسجلين بالعام: <span className="font-bold text-slate-900">{sourceStudents.length}</span> طالب
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    2. العام الدراسي الجديد (المستهدف للترحيل إليه):
                  </label>
                  <select
                    value={targetYearId}
                    onChange={e => setTargetYearId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- اختر العام الدراسي المستهدف --</option>
                    {academicYears
                      .filter(y => y.id !== sourceYearId)
                      .map(y => (
                        <option key={y.id} value={y.id}>
                          {y.name} {y.status === 'Active' || y.status === 'ACTIVE' ? '(نشط)' : ''}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    يجب أن يكون العام الجديد مضافاً ومعداً في إعدادات النظام.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rules & Policies */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  قواعد الترقية الأكاديمية والحدود الدنيا
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storageService.getPromotionRules().map((rule, idx) => (
                  <div key={rule.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rule.sourceGrade || rule.fromGrade}</span>
                      <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                        إلى: {rule.targetGrade || rule.toGrade}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      <span>الحد الأدنى للحضور: <strong>{rule.minAttendancePercentage || 75}%</strong></span>
                      <span>الحد الأدنى للسلوك: <strong>{rule.minBehaviorScore || 60} نقطة</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Review & Edit Decisions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث باسم الطالب أو الكود..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedGrade}
                    onChange={e => setSelectedGrade(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">جميع الصفوف ({sourceStudents.length})</option>
                    {allGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleBatchApplyAction('PROMOTED')}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold"
                  >
                    ترقية الكل للصف التالي
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyAction('RETAINED')}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold"
                  >
                    إعادة الكل بنفس الصف
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">الطالب</th>
                      <th className="p-3">الصف الحالي</th>
                      <th className="p-3">نقاط السلوك</th>
                      <th className="p-3">قرار الترحيل</th>
                      <th className="p-3">الصف المستهدف</th>
                      <th className="p-3">الفصل</th>
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(stu => {
                      const dec: StudentDecisionItem = studentDecisions[stu.id] || {
                        action: 'PROMOTED',
                        targetGrade: stu.grade,
                        targetClassroom: stu.classroom || '1/1',
                        notes: ''
                      };
                      const behavior = storageService.calculateStudentBehaviorScore(stu.id);

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{stu.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{stu.studentCode}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                              {stu.grade} ({stu.classroom})
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${behavior.statusColor}`}>
                              {behavior.currentScore} / 100
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={dec.action}
                              onChange={e => handleDecisionChange(stu.id, 'action', e.target.value)}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                            >
                              <option value="PROMOTED">ترقية للصف التالي</option>
                              <option value="RETAINED">إعادة نفس الصف (رسوب/بقاء)</option>
                              <option value="GRADUATED">تخرج من المدرسة</option>
                              <option value="TRANSFERRED_OUT">تحويل لمدرسة أخرى</option>
                            </select>
                          </td>
                          <td className="p-3">
                            {dec.action === 'GRADUATED' ? (
                              <span className="text-slate-400 font-bold">متخرج</span>
                            ) : (
                              <select
                                value={dec.targetGrade}
                                onChange={e => handleDecisionChange(stu.id, 'targetGrade', e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                              >
                                {allGrades.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={dec.targetClassroom}
                              onChange={e => handleDecisionChange(stu.id, 'targetClassroom', e.target.value)}
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                              placeholder="1/1"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={dec.notes}
                              onChange={e => handleDecisionChange(stu.id, 'notes', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="ملاحظات..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Completed */}
          {currentStep === 4 && executionResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">تم ترحيل الطلاب بنجاح إلى العام الدراسي الجديد</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                تم ترقية ({executionResult.promotedCount}) طالب، وإبقاء ({executionResult.retainedCount}) طالب بنجاح مع حفظ سجلات القيود في قاعدة البيانات.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  إغلاق المعالج والعودة للسجلات
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                type="button"
                disabled={!targetYearId}
                onClick={() => {
                  initializePromotionDecisions();
                  setCurrentStep(2);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                التالي: قواعد الترقية
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                التالي: مراجعة وتعديل التوزيع
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleExecutePromotion}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isExecuting ? 'جاري تنفيذ الترحيل...' : 'تنفيذ الترحيل النهائي الآن'}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
