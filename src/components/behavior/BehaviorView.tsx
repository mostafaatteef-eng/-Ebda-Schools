import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  Bell,
  CheckCircle,
  CheckCircle2,
  Download,
  Edit2,
  Filter,
  HeartHandshake,
  Layers,
  PhoneCall,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BehaviorType, BehaviorViolation, Student } from '../../types';
import { storageService } from '../../services/storageService';
import {
  formatEgyptianDate,
  getCairoCurrentDate,
  getEgyptianDayName,
} from '../../utils/egyptianTime';

export const BehaviorView: React.FC = () => {
  const [violations, setViolations] = useState<BehaviorViolation[]>(() => storageService.getBehaviorViolations());
  const [behaviorTypes, setBehaviorTypes] = useState<BehaviorType[]>(() => storageService.getBehaviorTypes());
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());

  const [activeSubTab, setActiveSubTab] = useState<'violations' | 'types_manager' | 'at_risk'>('violations');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add violation form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [violationDate, setViolationDate] = useState(() => getCairoCurrentDate());
  const [actionTaken, setActionTaken] = useState('تنبيه شفوي وتوثيق في السجل');
  const [parentNotified, setParentNotified] = useState(false);
  const [notes, setNotes] = useState('');

  // Behavior Type Editor State
  const [isTypeEditorOpen, setIsTypeEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<BehaviorType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState('سلوكية داخل الفصل');
  const [typeSeverity, setTypeSeverity] = useState('متوسطة');
  const [typePoints, setTypePoints] = useState(5);
  const [typeDefaultAction, setTypeDefaultAction] = useState('إنذار كتابي وتكليف إضافي');
  const [typeNotifyParent, setTypeNotifyParent] = useState(true);
  const [typeRequiresReview, setTypeRequiresReview] = useState(false);
  const [typeIsActive, setTypeIsActive] = useState(true);

  const reloadData = () => {
    setViolations(storageService.getBehaviorViolations());
    setBehaviorTypes(storageService.getBehaviorTypes());
    setStudents(storageService.getStudents());
  };

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchSearch =
        !searchTerm.trim() ||
        v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.violationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.grade && v.grade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.classroom && v.classroom.includes(searchTerm));

      const matchSev = selectedSeverity === 'ALL' || v.severity === selectedSeverity;
      return matchSearch && matchSev;
    });
  }, [violations, searchTerm, selectedSeverity]);

  // Overall School Behavior Stats
  const stats = useMemo(() => {
    const total = violations.length;
    const level1 = violations.filter(v => v.severity === 'بسيطة').length;
    const level2 = violations.filter(v => v.severity === 'متوسطة').length;
    const level3 = violations.filter(v => v.severity?.includes('شديدة') || v.severity?.includes('خطيرة')).length;

    // Students with behavior scores
    const studentScoreMap = new Map<string, number>();
    violations.forEach(v => {
      studentScoreMap.set(v.studentId, (studentScoreMap.get(v.studentId) || 0) + (v.pointsDeducted || 0));
    });

    let atRiskCount = 0;
    students.forEach(s => {
      const score = Math.max(0, (s.initialBehaviorScore || 100) - (studentScoreMap.get(s.id) || 0));
      if (score < 85) atRiskCount++;
    });

    return { total, level1, level2, level3, atRiskCount };
  }, [violations, students]);

  // Students list with computed behavior score
  const studentsWithScores = useMemo(() => {
    const studentDeductionsMap = new Map<string, { total: number; count: number }>();
    violations.forEach(v => {
      const cur = studentDeductionsMap.get(v.studentId) || { total: 0, count: 0 };
      studentDeductionsMap.set(v.studentId, {
        total: cur.total + (v.pointsDeducted || 0),
        count: cur.count + 1,
      });
    });

    return students
      .map(s => {
        const d = studentDeductionsMap.get(s.id) || { total: 0, count: 0 };
        const score = Math.max(0, (s.initialBehaviorScore || 100) - d.total);
        return {
          ...s,
          score,
          deducted: d.total,
          violationCount: d.count,
        };
      })
      .sort((a, b) => a.score - b.score);
  }, [students, violations]);

  const handleSaveViolation = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    const bType = behaviorTypes.find(t => t.id === selectedTypeId);

    if (!student || !bType) {
      alert('يرجى اختيار الطالب ونوع المخالفة');
      return;
    }

    const pointsDeducted = bType.points || bType.weight || 5;

    const newViolation: BehaviorViolation = {
      id: `VIO-${Date.now()}`,
      studentId: student.id,
      studentCode: student.studentCode || student.id,
      studentName: student.name,
      grade: student.grade,
      classroom: student.classroom,
      date: violationDate,
      behaviorTypeId: bType.id,
      violationTypeId: bType.id,
      violationName: bType.name,
      severity: bType.severity,
      pointsDeducted,
      actionTaken,
      parentNotified,
      notes,
      status: bType.requiresAdminReview ? 'قيد المراجعة' : 'معتمدة',
      recordedBy: storageService.getCurrentUser()?.fullName || 'الأخصائي الاجتماعي',
      createdAt: new Date().toISOString(),
    };

    storageService.saveBehaviorViolation(newViolation);
    reloadData();
    setIsAddModalOpen(false);
    setSelectedStudentId('');
    setSelectedTypeId('');
    setNotes('');
    alert(`تم تسجيل المخالفة بنجاح وخصم (${pointsDeducted}) نقاط من رصيد الطالب.`);
  };

  const handleDeleteViolation = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟ سيتم إعادة النقاط لرصيد الطالب.')) {
      storageService.deleteBehaviorViolation(id);
      reloadData();
    }
  };

  // Open Type Editor Modal
  const handleOpenTypeEditor = (type?: BehaviorType) => {
    if (type) {
      setEditingType(type);
      setTypeName(type.name);
      setTypeCategory(type.category);
      setTypeSeverity(type.severity);
      setTypePoints(type.points || type.weight || 5);
      setTypeDefaultAction(type.defaultAction || '');
      setTypeNotifyParent(type.notifyParent);
      setTypeRequiresReview(type.requiresAdminReview);
      setTypeIsActive(type.isActive);
    } else {
      setEditingType(null);
      setTypeName('');
      setTypeCategory('سلوكية داخل الفصل');
      setTypeSeverity('متوسطة');
      setTypePoints(5);
      setTypeDefaultAction('إنذار كتابي وتكليف إضافي');
      setTypeNotifyParent(true);
      setTypeRequiresReview(false);
      setTypeIsActive(true);
    }
    setIsTypeEditorOpen(true);
  };

  const handleSaveBehaviorType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      alert('يرجى كتابة اسم بند المخالفة');
      return;
    }

    const typeObj: BehaviorType = {
      id: editingType ? editingType.id : `BEH-${Date.now()}`,
      name: typeName.trim(),
      category: typeCategory,
      severity: typeSeverity as any,
      points: Number(typePoints),
      weight: Number(typePoints),
      defaultAction: typeDefaultAction.trim(),
      notifyParent: typeNotifyParent,
      requiresAdminReview: typeRequiresReview,
      isActive: typeIsActive,
      sortOrder: editingType?.sortOrder || behaviorTypes.length + 1,
    };

    storageService.saveBehaviorType(typeObj);
    reloadData();
    setIsTypeEditorOpen(false);
    alert(editingType ? 'تم تعديل بند المخالفة بنجاح' : 'تمت إضافة بند المخالفة الجديد بنجاح');
  };

  const handleToggleTypeStatus = (type: BehaviorType) => {
    const updated = { ...type, isActive: !type.isActive };
    storageService.saveBehaviorType(updated);
    reloadData();
  };

  const handleExportExcel = () => {
    const exportData = filteredViolations.map((v, idx) => ({
      'م': idx + 1,
      'تاريخ المخالفة': v.date,
      'كود الطالب': v.studentCode || v.studentId,
      'اسم الطالب': v.studentName,
      'الصف الدراسي': v.grade,
      'الفصل': v.classroom,
      'بند المخالفة': v.violationName,
      'درجة الخطورة': v.severity,
      'النقاط المخصومة': v.pointsDeducted,
      'الإجراء المتخذ': v.actionTaken || '',
      'إخطار ولي الأمر': v.parentNotified ? 'نعم' : 'لا',
      'حالة الاعتماد': v.status || 'معتمدة',
      'المسؤول': v.recordedBy || '',
      'ملاحظات': v.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المخالفات السلوكية');
    XLSX.writeFile(wb, `سجل_المخالفات_السلوكية_${getCairoCurrentDate()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">لائحة الانضباط المدرسي وإدارة السلوك</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                القرار الوزاري للائحة الانضباط
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              رصد المخالفات السلوكية، حسم نقاط السلوك آلياً، إدارة بنود وأوزان المخالفات، ومتابعة الحالات الحرجة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportExcel()}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مخالفة جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold">إجمالي المخالفات المسجلة</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">حالة مسجلة بالعام الحالي</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <div className="text-[11px] text-blue-700 font-bold">مخالفات بسيطة</div>
          <div className="text-xl font-black text-blue-600 mt-1">{stats.level1}</div>
          <div className="text-[10px] text-blue-600 mt-1">خصم 2-3 نقاط</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <div className="text-[11px] text-amber-700 font-bold">مخالفات متوسطة</div>
          <div className="text-xl font-black text-amber-600 mt-1">{stats.level2}</div>
          <div className="text-[10px] text-amber-600 mt-1">خصم 5 نقاط</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold">مخالفات جسيمة / خطيرة</div>
          <div className="text-xl font-black text-rose-600 mt-1">{stats.level3}</div>
          <div className="text-[10px] text-rose-600 mt-1">خصم 10-30 نقطة</div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('violations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'violations'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>سجل المخالفات السلوكية ({violations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('types_manager')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'types_manager'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إدارة بنود المخالفات وأوزانها ({behaviorTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('at_risk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'at_risk'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>مؤشر السلوك والحالات الحرجة ({stats.atRiskCount})</span>
        </button>
      </div>

      {/* 1. SubTab: VIOLATIONS LOG */}
      {activeSubTab === 'violations' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث باسم الطالب أو نوع المخالفة أو الصف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">الدرجة:</span>
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">جميع الدرجات</option>
                <option value="بسيطة">بسيطة</option>
                <option value="متوسطة">متوسطة</option>
                <option value="شديدة">شديدة</option>
                <option value="خطيرة جداً">خطيرة جداً</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف / الفصل</th>
                  <th className="p-3">نوع المخالفة</th>
                  <th className="p-3 text-center">الدرجة</th>
                  <th className="p-3 text-center">النقاط</th>
                  <th className="p-3">الإجراء المتخذ</th>
                  <th className="p-3 text-center">إخطار ولي الأمر</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      لا توجد مخالفات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredViolations.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600 font-mono whitespace-nowrap">{v.date}</td>
                      <td className="p-3 font-bold text-slate-900">{v.studentName}</td>
                      <td className="p-3 text-slate-600">{v.grade} — {v.classroom}</td>
                      <td className="p-3 font-semibold text-slate-800">{v.violationName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.severity === 'بسيطة'
                            ? 'bg-blue-50 text-blue-700'
                            : v.severity === 'متوسطة'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-rose-600 font-mono">
                        -{v.pointsDeducted}
                      </td>
                      <td className="p-3 text-slate-700">{v.actionTaken}</td>
                      <td className="p-3 text-center">
                        {v.parentNotified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            تم الإخطار ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            لم يخطر
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteViolation(v.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف المخالفة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SubTab: BEHAVIOR TYPES & WEIGHTS MANAGER */}
      {activeSubTab === 'types_manager' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">بنود المخالفات وأوزان نقاط الحسم (لائحة الانضباط المدرسي)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد أنواع المخالفات، تصنيفاتها، خصم النقاط، إشعار ولي الأمر، وتفعيل/تعطيل البنود
              </p>
            </div>

            <button
              onClick={() => handleOpenTypeEditor()}
              className="px-4 py-2 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بند مخالفة جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">اسم المخالفة</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3 text-center">الدرجة</th>
                  <th className="p-3 text-center">النقاط المخصومة</th>
                  <th className="p-3">الإجراء المقترح</th>
                  <th className="p-3 text-center">إخطار ولي الأمر</th>
                  <th className="p-3 text-center">اعتماد الإدارة</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {behaviorTypes.map((type, idx) => (
                  <tr key={type.id} className={`hover:bg-slate-50 ${!type.isActive ? 'opacity-50' : ''}`}>
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{type.name}</td>
                    <td className="p-3 text-slate-600">{type.category}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        type.severity === 'بسيطة'
                          ? 'bg-blue-50 text-blue-700'
                          : type.severity === 'متوسطة'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {type.severity}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-rose-600 font-mono">
                      -{type.points || type.weight} نقاط
                    </td>
                    <td className="p-3 text-slate-600">{type.defaultAction || '—'}</td>
                    <td className="p-3 text-center">
                      {type.notifyParent ? (
                        <span className="text-emerald-600 font-bold">نعم ✓</span>
                      ) : (
                        <span className="text-slate-400">اختياري</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {type.requiresAdminReview ? (
                        <span className="text-amber-600 font-bold">مطلوب</span>
                      ) : (
                        <span className="text-slate-400">مباشر</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleTypeStatus(type)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          type.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {type.isActive ? 'مفعل' : 'معطل'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenTypeEditor(type)}
                        className="p-1 text-slate-400 hover:text-[#008e8b] transition-colors cursor-pointer"
                        title="تعديل البند"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SubTab: AT RISK & BEHAVIOR SCORES */}
      {activeSubTab === 'at_risk' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">مؤشر درجات السلوك للطلاب</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ترتيب الطلاب حسب درجة السلوك المتبقية (من أصل 100 درجة) لمتابعة الحالات التي تحتاج إرشاداً نفسياً وتربوياً
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف والفصل</th>
                  <th className="p-3 text-center">عدد المخالفات</th>
                  <th className="p-3 text-center">مجموع النقاط المخصومة</th>
                  <th className="p-3 text-center">رصيد السلوك الحالي</th>
                  <th className="p-3 text-center">التقييم العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentsWithScores.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{st.studentCode || st.id}</td>
                    <td className="p-3 font-bold text-slate-900">{st.name}</td>
                    <td className="p-3 text-slate-600">{st.grade} — {st.classroom}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{st.violationCount}</td>
                    <td className="p-3 text-center font-bold text-rose-600 font-mono">
                      {st.deducted > 0 ? `-${st.deducted}` : '0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                        st.score >= 90
                          ? 'bg-emerald-50 text-emerald-700'
                          : st.score >= 80
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {st.score}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      {st.score >= 95 ? (
                        <span className="text-emerald-600">ممتاز ★</span>
                      ) : st.score >= 85 ? (
                        <span className="text-teal-600">جيد جداً</span>
                      ) : st.score >= 75 ? (
                        <span className="text-amber-600">مقبول (إنذار أول)</span>
                      ) : (
                        <span className="text-rose-600 font-black">حرج (استدعاء ولي أمر)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Violation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">تسجيل مخالفة سلوكية لطالب</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveViolation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الطالب <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#008e8b]"
                >
                  <option value="">— اختر من قائمة الطلاب —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade} - {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بند المخالفة وفق اللائحة <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedTypeId}
                  onChange={e => {
                    setSelectedTypeId(e.target.value);
                    const selected = behaviorTypes.find(t => t.id === e.target.value);
                    if (selected?.defaultAction) setActionTaken(selected.defaultAction);
                    if (selected?.notifyParent) setParentNotified(true);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#008e8b]"
                >
                  <option value="">— اختر بند المخالفة —</option>
                  {behaviorTypes.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (خصم: {t.points || t.weight} نقاط — {t.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الواقعة</label>
                  <input
                    type="date"
                    value={violationDate}
                    onChange={e => setViolationDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الإجراء المتخذ</label>
                  <input
                    type="text"
                    value={actionTaken}
                    onChange={e => setActionTaken(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="parentNotifyCheck"
                  checked={parentNotified}
                  onChange={e => setParentNotified(e.target.checked)}
                  className="w-4 h-4 text-[#008e8b] rounded-sm"
                />
                <label htmlFor="parentNotifyCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  تم إخطار ولي الأمر بالمخالفة هاتفياً أو عبر رسالة
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الواقعة وملاحظات</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="وصف مختصر للواقعة..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  تسجيل وخصم النقاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Behavior Type Modal */}
      {isTypeEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="p-6 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#008e8b]" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingType ? 'تعديل بند مخالفة' : 'إضافة بند مخالفة جديد للائحة'}
                </h3>
              </div>
              <button onClick={() => setIsTypeEditorOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBehaviorType} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم بند المخالفة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={e => setTypeName(e.target.value)}
                  placeholder="مثال: التأخر عن الطابور الصباحي"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#008e8b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={typeCategory}
                    onChange={e => setTypeCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="انضباط مدرسي">انضباط مدرسي</option>
                    <option value="سلوكية داخل الفصل">سلوكية داخل الفصل</option>
                    <option value="مظهر وانضباط">مظهر وانضباط</option>
                    <option value="أخلاقية وتربوية">أخلاقية وتربوية</option>
                    <option value="ممتلكات عامة">ممتلكات عامة</option>
                    <option value="خطيرة">خطيرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الخطورة</label>
                  <select
                    value={typeSeverity}
                    onChange={e => setTypeSeverity(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="بسيطة">بسيطة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="شديدة">شديدة</option>
                    <option value="خطيرة جداً">خطيرة جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  النقاط المخصومة من السلوك <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={typePoints}
                  onChange={e => setTypePoints(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الإجراء الافتراضي المقترح</label>
                <input
                  type="text"
                  value={typeDefaultAction}
                  onChange={e => setTypeDefaultAction(e.target.value)}
                  placeholder="مثال: تنبيه شفوي وتسجيل تأخير"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeNotifyParent}
                    onChange={e => setTypeNotifyParent(e.target.checked)}
                    className="w-4 h-4 text-[#008e8b] rounded-sm"
                  />
                  <span>إخطار ولي الأمر تلقائياً عند تسجيل هذا البند</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeRequiresReview}
                    onChange={e => setTypeRequiresReview(e.target.checked)}
                    className="w-4 h-4 text-[#008e8b] rounded-sm"
                  />
                  <span>يتطلب اعتماد ومراجعة الإدارة المدرسية</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeIsActive}
                    onChange={e => setTypeIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#008e8b] rounded-sm"
                  />
                  <span>تفعيل هذا البند في نماذج الرصد</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTypeEditorOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#008e8b] hover:bg-[#007775] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingType ? 'حفظ التعديلات' : 'إضافة البند'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
