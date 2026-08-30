import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Edit2,
  FolderPlus,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  School,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AcademicStage, ClassroomItem, GradeItem, SubjectItem, SystemSettings } from '../../types';
import { storageService } from '../../services/storageService';

interface AcademicStructureTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const AcademicStructureTab: React.FC<AcademicStructureTabProps> = ({ formData, setFormData }) => {
  const [subSection, setSubSection] = useState<'stages_grades' | 'classrooms' | 'subjects'>('stages_grades');

  // Stage / Grade Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);
  const [gradeForm, setGradeForm] = useState<Partial<GradeItem>>({
    name: '',
    shortName: '',
    academicStage: 'المرحلة الثانوية',
    order: 1,
    isActive: true,
  });

  // Classroom Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassroomItem | null>(null);
  const [classForm, setClassForm] = useState<Partial<ClassroomItem>>({
    gradeName: '',
    classroomNumber: '1',
    displayName: '',
    capacity: 35,
    academicYear: formData.currentAcademicYear || '2025/2026',
    isActive: true,
  });

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectForm, setSubjectForm] = useState<Partial<SubjectItem>>({
    name: '',
    shortName: '',
    color: '#008e8b',
    assignedGrades: [],
    weeklyPeriods: 4,
    isActive: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const grades = formData.grades || [];
  const classrooms = formData.classrooms || [];
  const subjects = formData.subjects || [];
  const stages = formData.stages || [];

  // ---------------- Grade Handlers ----------------
  const handleOpenAddGrade = () => {
    setEditingGrade(null);
    setGradeForm({
      name: '',
      shortName: '',
      academicStage: stages[0]?.name || 'المرحلة الثانوية',
      order: grades.length + 1,
      isActive: true,
    });
    setIsGradeModalOpen(true);
  };

  const handleOpenEditGrade = (grade: GradeItem) => {
    setEditingGrade(grade);
    setGradeForm({ ...grade });
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.name?.trim()) return;

    let updatedGrades: GradeItem[];
    if (editingGrade) {
      updatedGrades = grades.map(g => (g.id === editingGrade.id ? ({ ...g, ...gradeForm } as GradeItem) : g));
      showNotif(`تم تحديث بيانات الصف: ${gradeForm.name}`);
    } else {
      const newGrade: GradeItem = {
        id: `G_${Date.now()}`,
        name: gradeForm.name!.trim(),
        shortName: gradeForm.shortName?.trim() || gradeForm.name!.trim().slice(0, 5),
        academicStage: gradeForm.academicStage || 'المرحلة الثانوية',
        order: gradeForm.order || grades.length + 1,
        isActive: gradeForm.isActive !== undefined ? gradeForm.isActive : true,
      };
      updatedGrades = [...grades, newGrade];
      showNotif(`تم إضافة الصف الجديد: ${newGrade.name}`);
    }

    setFormData(prev => ({ ...prev, grades: updatedGrades }));
    setIsGradeModalOpen(false);
  };

  const handleDeleteGrade = (grade: GradeItem) => {
    const depCheck = storageService.checkDependencies('grade', grade.name);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف "${grade.name}" نهائياً من النظام؟`)) {
      setFormData(prev => ({
        ...prev,
        grades: grades.filter(g => g.id !== grade.id),
      }));
      showNotif(`تم حذف الصف "${grade.name}"`);
    }
  };

  const handleToggleGradeActive = (grade: GradeItem) => {
    const updated = grades.map(g => (g.id === grade.id ? { ...g, isActive: !g.isActive } : g));
    setFormData(prev => ({ ...prev, grades: updated }));
  };

  // ---------------- Classroom Handlers ----------------
  const handleOpenAddClass = () => {
    setEditingClass(null);
    const defaultGrade = grades[0]?.name || '';
    setClassForm({
      gradeName: defaultGrade,
      classroomNumber: `${classrooms.filter(c => c.gradeName === defaultGrade).length + 1}`,
      displayName: `${defaultGrade} - فصل ${classrooms.filter(c => c.gradeName === defaultGrade).length + 1}`,
      capacity: 35,
      academicYear: formData.currentAcademicYear || '2025/2026',
      isActive: true,
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassroomItem) => {
    setEditingClass(cls);
    setClassForm({ ...cls });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.gradeName || !classForm.classroomNumber) return;

    const displayName = classForm.displayName?.trim() || `${classForm.gradeName} - فصل ${classForm.classroomNumber}`;

    let updatedClasses: ClassroomItem[];
    if (editingClass) {
      updatedClasses = classrooms.map(c =>
        c.id === editingClass.id ? ({ ...c, ...classForm, displayName } as ClassroomItem) : c
      );
      showNotif(`تم تحديث الفصل: ${displayName}`);
    } else {
      const targetGrade = grades.find(g => g.name === classForm.gradeName || g.id === classForm.gradeId);
      const newClass: ClassroomItem = {
        id: `CLS_${Date.now()}`,
        gradeId: targetGrade?.id || classForm.gradeId || `G_${Date.now()}`,
        gradeName: classForm.gradeName!,
        classroomNumber: classForm.classroomNumber!,
        displayName,
        capacity: Number(classForm.capacity) || 35,
        academicYear: classForm.academicYear || formData.currentAcademicYear || '2025/2026',
        isActive: classForm.isActive !== undefined ? classForm.isActive : true,
      };
      updatedClasses = [...classrooms, newClass];
      showNotif(`تم إضافة الفصل الجديد: ${displayName}`);
    }

    setFormData(prev => ({ ...prev, classrooms: updatedClasses }));
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (cls: ClassroomItem) => {
    const depCheck = storageService.checkDependencies('classroom', cls.displayName || cls.classroomNumber);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الفصل "${cls.displayName}"؟`)) {
      setFormData(prev => ({
        ...prev,
        classrooms: classrooms.filter(c => c.id !== cls.id),
      }));
      showNotif(`تم حذف الفصل "${cls.displayName}"`);
    }
  };

  // ---------------- Subject Handlers ----------------
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      shortName: '',
      color: '#008e8b',
      assignedGrades: grades.map(g => g.id),
      weeklyPeriods: 4,
      isActive: true,
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: SubjectItem) => {
    setEditingSubject(subj);
    setSubjectForm({ ...subj });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name?.trim()) return;

    let updatedSubjects: SubjectItem[];
    if (editingSubject) {
      updatedSubjects = subjects.map(s => (s.id === editingSubject.id ? ({ ...s, ...subjectForm } as SubjectItem) : s));
      showNotif(`تم تحديث المادة الدراسية: ${subjectForm.name}`);
    } else {
      const newSubj: SubjectItem = {
        id: `SUB_${Date.now()}`,
        name: subjectForm.name!.trim(),
        shortName: subjectForm.shortName?.trim() || subjectForm.name!.trim().slice(0, 8),
        color: subjectForm.color || '#008e8b',
        assignedGrades: subjectForm.assignedGrades || [],
        weeklyPeriods: Number(subjectForm.weeklyPeriods) || 4,
        isActive: subjectForm.isActive !== undefined ? subjectForm.isActive : true,
      };
      updatedSubjects = [...subjects, newSubj];
      showNotif(`تم إضافة المادة الجديدة: ${newSubj.name}`);
    }

    setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (subj: SubjectItem) => {
    const depCheck = storageService.checkDependencies('subject', subj.name);
    if (!depCheck.canDelete) {
      alert(depCheck.message);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف مادة "${subj.name}"؟`)) {
      setFormData(prev => ({
        ...prev,
        subjects: subjects.filter(s => s.id !== subj.id),
      }));
      showNotif(`تم حذف المادة "${subj.name}"`);
    }
  };

  const toggleGradeForSubject = (gradeId: string) => {
    const current = subjectForm.assignedGrades || [];
    if (current.includes(gradeId)) {
      setSubjectForm(prev => ({ ...prev, assignedGrades: current.filter(id => id !== gradeId) }));
    } else {
      setSubjectForm(prev => ({ ...prev, assignedGrades: [...current, gradeId] }));
    }
  };

  return (
    <div className="space-y-6" id="academic_structure_container">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            id="tab_stages_grades_btn"
            onClick={() => setSubSection('stages_grades')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'stages_grades'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            المراحل والصفوف الدراسية ({grades.length})
          </button>

          <button
            type="button"
            id="tab_classrooms_btn"
            onClick={() => setSubSection('classrooms')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'classrooms'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <School className="w-4 h-4" />
            الفصول والشُعب الدراسية ({classrooms.length})
          </button>

          <button
            type="button"
            id="tab_subjects_btn"
            onClick={() => setSubSection('subjects')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              subSection === 'subjects'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            المواد الدراسية ({subjects.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('هل تريد استعادة الهيكل الأكاديمي الافتراضي؟')) {
              storageService.resetSettingsSection('grades');
              storageService.resetSettingsSection('classrooms');
              storageService.resetSettingsSection('subjects');
              setFormData(storageService.getSettings());
              showNotif('تمت استعادة الهيكل الأكاديمي الافتراضي بنجاح');
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

      {/* ---------------- Sub-Section: Grades & Stages ---------------- */}
      {subSection === 'stages_grades' && (
        <div className="space-y-4" id="section_grades">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                إدارة الصفوف الدراسية بالمدرسة
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد الصفوف النشطة، الربط بالمرحلة التعليمية، والترتيب الأكاديمي
              </p>
            </div>
            <button
              type="button"
              id="add_grade_btn"
              onClick={handleOpenAddGrade}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة صف دراسي جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grades.map((grade, idx) => {
              const classCount = classrooms.filter(c => c.gradeName === grade.name).length;
              return (
                <div
                  key={grade.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    grade.isActive
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {grade.academicStage || 'المرحلة الثانوية'}
                      </span>
                      <h4 className="font-bold text-base text-slate-800 dark:text-white mt-1.5">{grade.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">الرمز المختصر: {grade.shortName || '-'}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        grade.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {grade.isActive ? 'مفعل' : 'معطل'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                    <span>عدد الفصول: <strong className="text-teal-600 font-bold">{classCount}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleGradeActive(grade)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200"
                        title={grade.isActive ? 'تعطيل الصف' : 'تفعيل الصف'}
                      >
                        {grade.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditGrade(grade)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                        title="تعديل الصف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGrade(grade)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                        title="حذف الصف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- Sub-Section: Classrooms ---------------- */}
      {subSection === 'classrooms' && (
        <div className="space-y-4" id="section_classrooms">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <School className="w-5 h-5 text-teal-600" />
                إدارة الفصول والشُعب الدراسية
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توزيع الطلاب، السعة الاستيعابية لكل فصل، وأسماء الشُعب
              </p>
            </div>
            <button
              type="button"
              id="add_classroom_btn"
              onClick={handleOpenAddClass}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة فصل دراسي جديد
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="p-3">الصف الدراسي</th>
                  <th className="p-3">رقم / شفرة الفصل</th>
                  <th className="p-3">الاسم الظاهر الكامل</th>
                  <th className="p-3">السعة القصوى للطلاب</th>
                  <th className="p-3">العام الدراسي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {classrooms.map((cls, idx) => (
                  <tr key={cls.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-slate-800 dark:text-white">{cls.gradeName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">فصل {cls.classroomNumber}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{cls.displayName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{cls.capacity || 35} طالب</td>
                    <td className="p-3 text-slate-500 text-xs">{cls.academicYear || formData.currentAcademicYear}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          cls.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {cls.isActive ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                          title="تعديل الفصل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls)}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                          title="حذف الفصل"
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

      {/* ---------------- Sub-Section: Subjects ---------------- */}
      {subSection === 'subjects' && (
        <div className="space-y-4" id="section_subjects">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                دليل المواد الدراسية والمناهج
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تخصيص المواد لكل صف، عدد الحصص الأسبوعية، والترميز اللوني للجدول المدرسي
              </p>
            </div>
            <button
              type="button"
              id="add_subject_btn"
              onClick={handleOpenAddSubject}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              إضافة مادة دراسية جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj, idx) => (
              <div
                key={subj.id || idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: subj.color || '#008e8b' }}
                />
                <div className="flex justify-between items-start mt-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subj.color || '#008e8b' }}
                    />
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{subj.name}</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-semibold">
                    {subj.weeklyPeriods || 4} حصص/أسبوع
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">الرمز المختصر: <strong className="text-slate-700 dark:text-slate-300">{subj.shortName || subj.name}</strong></p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {subj.assignedGrades && subj.assignedGrades.length > 0 ? (
                    subj.assignedGrades.map(gId => {
                      const gr = grades.find(g => g.id === gId);
                      return (
                        <span key={gId} className="text-[11px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                          {gr?.shortName || gr?.name || gId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400">متاحة لجميع الصفوف</span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      subj.isActive !== false ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {subj.isActive !== false ? '● مفعلة بالجدول' : '○ معطلة مؤقتاً'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSubject(subj)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subj)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Modal: Grade Form ---------------- */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                {editingGrade ? 'تعديل بيانات الصف الدراسي' : 'إضافة صف دراسي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الصف الدراسي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الصف الأول الثانوي"
                  value={gradeForm.name || ''}
                  onChange={e => setGradeForm({ ...gradeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرمز المختصر
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 1 ث"
                    value={gradeForm.shortName || ''}
                    onChange={e => setGradeForm({ ...gradeForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المرحلة التعليمية
                  </label>
                  <select
                    value={gradeForm.academicStage || 'المرحلة الثانوية'}
                    onChange={e => setGradeForm({ ...gradeForm, academicStage: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    {stages.map((st, i) => (
                      <option key={st.id || i} value={st.name}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="grade_is_active"
                  checked={gradeForm.isActive !== false}
                  onChange={e => setGradeForm({ ...gradeForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <label htmlFor="grade_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصف الدراسي نشط ومتاح في الجداول والتسجيل
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ الصف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Classroom Form ---------------- */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <School className="w-5 h-5 text-teal-600" />
                {editingClass ? 'تعديل الفصل الدراسي' : 'إضافة فصل دراسي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الصف الدراسي التابع له *
                </label>
                <select
                  required
                  value={classForm.gradeName || ''}
                  onChange={e => {
                    const gradeName = e.target.value;
                    setClassForm({
                      ...classForm,
                      gradeName,
                      displayName: `${gradeName} - فصل ${classForm.classroomNumber || '1'}`,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {grades.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم أو كود الفصل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 1 أو A أو متقدم"
                    value={classForm.classroomNumber || ''}
                    onChange={e => {
                      const classroomNumber = e.target.value;
                      setClassForm({
                        ...classForm,
                        classroomNumber,
                        displayName: `${classForm.gradeName || ''} - فصل ${classroomNumber}`,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السعة القصوى للطلاب
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={classForm.capacity || 35}
                    onChange={e => setClassForm({ ...classForm, capacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل المعروض للفصل
                </label>
                <input
                  type="text"
                  placeholder="مثال: الصف الأول الثانوي - فصل 1"
                  value={classForm.displayName || ''}
                  onChange={e => setClassForm({ ...classForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="class_is_active"
                  checked={classForm.isActive !== false}
                  onChange={e => setClassForm({ ...classForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <label htmlFor="class_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الفصل نشط ومتاح للتسكين
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ الفصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Modal: Subject Form ---------------- */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                {editingSubject ? 'تعديل المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المادة الدراسية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اللغة العربية، الفيزياء، الرياضيات..."
                  value={subjectForm.name || ''}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرمز المختصر
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: عربي"
                    value={subjectForm.shortName || ''}
                    onChange={e => setSubjectForm({ ...subjectForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحصص الأسبوعية
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={subjectForm.weeklyPeriods || 4}
                    onChange={e => setSubjectForm({ ...subjectForm, weeklyPeriods: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    لون المادة في الجدول
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={subjectForm.color || '#008e8b'}
                      onChange={e => setSubjectForm({ ...subjectForm, color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-slate-500">{subjectForm.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الصفوف الدراسية المقررة عليها هذه المادة
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 max-h-36 overflow-y-auto">
                  {grades.map(gr => (
                    <label key={gr.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(subjectForm.assignedGrades || []).includes(gr.id)}
                        onChange={() => toggleGradeForSubject(gr.id)}
                        className="rounded text-teal-600"
                      />
                      <span>{gr.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow"
                >
                  حفظ المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
