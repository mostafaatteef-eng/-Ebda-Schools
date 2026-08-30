import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../../types';
import { storageService } from '../../services/storageService';
import { ImportWizardModal } from '../import/ImportWizardModal';
import { StudentProfileModal } from './StudentProfileModal';
import { formatEgyptianDate } from '../../utils/egyptianTime';

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedClassroom, setSelectedClassroom] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    studentCode: '',
    nationalId: '',
    gender: 'ذكر',
    stage: 'المرحلة الثانوية',
    grade: 'الصف الأول الثانوي',
    classroom: '1/1',
    academicYear: '2025/2026',
    status: 'نشط',
    parentName: '',
    relationship: 'أب',
    parentPhone: '',
    phone: '',
    address: '',
    notes: '',
  });

  const settings = storageService.getSettings();
  const stages = settings.stages || [];

  const reloadStudents = () => {
    setStudents(storageService.getStudents());
  };

  // Extract unique stages, grades, classrooms
  const availableGrades = useMemo(() => {
    if (selectedStage === 'ALL') {
      return Array.from(new Set(students.map(s => s.grade).filter(Boolean)));
    }
    const stageObj = stages.find(s => s.name === selectedStage);
    return stageObj ? stageObj.grades.map(g => g.name) : [];
  }, [selectedStage, students, stages]);

  const availableClassrooms = useMemo(() => {
    if (selectedGrade === 'ALL') {
      return Array.from(new Set(students.map(s => s.classroom).filter(Boolean)));
    }
    const foundStage = stages.find(s => s.grades.some(g => g.name === selectedGrade));
    const gradeObj = foundStage?.grades.find(g => g.name === selectedGrade);
    return gradeObj ? gradeObj.classrooms : Array.from(new Set(students.filter(s => s.grade === selectedGrade).map(s => s.classroom)));
  }, [selectedGrade, students, stages]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nationalId && s.nationalId.includes(searchTerm)) ||
        (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
        (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStage = selectedStage === 'ALL' || s.stage === selectedStage;
      const matchGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchClassroom = selectedClassroom === 'ALL' || s.classroom === selectedClassroom;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchStage && matchGrade && matchClassroom && matchStatus;
    });
  }, [students, searchTerm, selectedStage, selectedGrade, selectedClassroom, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      studentCode: `STD-${Date.now().toString().slice(-4)}`,
      nationalId: '',
      gender: 'ذكر',
      stage: stages[0]?.name || 'المرحلة الثانوية',
      grade: stages[0]?.grades[0]?.name || 'الصف الأول الثانوي',
      classroom: stages[0]?.grades[0]?.classrooms[0] || '1/1',
      academicYear: settings.currentAcademicYear || '2025/2026',
      status: 'نشط',
      parentName: '',
      relationship: 'أب',
      parentPhone: '',
      phone: '',
      address: '',
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.grade?.trim() || !formData.classroom?.trim()) {
      alert('يرجى ملء الحقول الأساسية: اسم الطالب، الصف الدراسي، والفصل');
      return;
    }

    const studentRecord: Student = {
      id: editingStudent ? editingStudent.id : `STD-${Date.now()}`,
      studentCode: formData.studentCode || `STD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name.trim(),
      nationalId: formData.nationalId?.trim() || undefined,
      gender: (formData.gender as any) || 'ذكر',
      stage: formData.stage || 'المرحلة العامة',
      grade: formData.grade,
      classroom: formData.classroom,
      academicYear: formData.academicYear || '2025/2026',
      status: (formData.status as any) || 'نشط',
      parentName: formData.parentName?.trim() || 'ولي أمر الطالب',
      relationship: formData.relationship?.trim() || 'ولي أمر',
      parentPhone: formData.parentPhone?.trim() || '',
      parentEmail: formData.parentEmail?.trim() || '',
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      notes: formData.notes?.trim() || '',
      initialBehaviorScore: formData.initialBehaviorScore ?? 100,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    };

    storageService.saveStudent(studentRecord);
    setIsFormModalOpen(false);
    reloadStudents();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب (${name}) نهائياً من النظام؟`)) {
      storageService.deleteStudent(id);
      reloadStudents();
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredStudents.map((s, idx) => ({
      'م': idx + 1,
      'كود الطالب': s.studentCode,
      'اسم الطالب رباعي': s.name,
      'الرقم القومي': s.nationalId || '—',
      'النوع': s.gender,
      'المرحلة': s.stage,
      'الصف الدراسي': s.grade,
      'الفصل': s.classroom,
      'حالة القيد': s.status,
      'اسم ولي الأمر': s.parentName,
      'صلة القرابة': s.relationship,
      'هاتف ولي الأمر': s.parentPhone,
      'هاتف الطالب': s.phone || '—',
      'العنوان': s.address || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قائمة_الطلاب');
    XLSX.writeFile(wb, `سجل_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008e8b]/10 text-[#008e8b] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span>إدارة شؤون الطلاب والصفوف</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل الطلاب العام، بيانات أولياء الأمور، توزيع الفصول، واستيراد القوائم
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#008e8b]" />
            <span>استيراد من Excel</span>
          </button>

          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008e8b] hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-[#008e8b]" />
            <span>فلاتر البحث والتصفية المتقدمة</span>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStage('ALL');
              setSelectedGrade('ALL');
              setSelectedClassroom('ALL');
              setSelectedStatus('ALL');
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#008e8b] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعيين الفلاتر</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الكود، الرقم القومي، أو هاتف ولي الأمر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#008e8b]"
            />
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setSelectedGrade('ALL');
                setSelectedClassroom('ALL');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع المراحل</option>
              {stages.map(st => (
                <option key={st.id} value={st.name}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassroom('ALL');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع الصفوف</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Classroom Filter */}
          <div>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-[#008e8b]"
            >
              <option value="ALL">جميع الفصول</option>
              {availableClassrooms.map(c => (
                <option key={c} value={c}>فصل {c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-2 font-semibold">
        <div className="flex items-center gap-3">
          <span>إجمالي الطلاب المطابقين: <strong className="text-[#008e8b] font-mono text-sm">{filteredStudents.length}</strong> طالب</span>
          <span>•</span>
          <span>إجمالي الطلاب المسجلين بالمدرسة: <strong className="text-slate-800 font-mono">{students.length}</strong></span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">كود الطالب</th>
                <th className="p-4">اسم الطالب رباعي</th>
                <th className="p-4">الصف / الفصل</th>
                <th className="p-4">المرحلة</th>
                <th className="p-4">ولي الأمر</th>
                <th className="p-4">هاتف ولي الأمر</th>
                <th className="p-4">حالة القيد</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">لا يوجد طلاب مطابقين للبحث أو الفلتر المختار</p>
                    <p className="text-xs text-slate-400 mt-1">يمكنك إضافة طالب جديد أو استيراد ملف Excel</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#008e8b]">
                      {student.studentCode}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      {student.nationalId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">الرقم القومي: {student.nationalId}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{student.grade}</div>
                      <span className="inline-block bg-teal-100 text-[#008e8b] font-bold px-2 py-0.5 rounded-md text-[11px] mt-0.5">
                        فصل: {student.classroom}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{student.stage}</td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{student.parentName}</div>
                      <div className="text-[10px] text-slate-400">({student.relationship || 'ولي أمر'})</div>
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      {student.parentPhone ? (
                        <a href={`tel:${student.parentPhone}`} className="hover:text-[#008e8b] hover:underline">
                          {student.parentPhone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          student.status === 'نشط'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.status === 'نشط' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{student.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudentForProfile(student);
                            setIsProfileModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#008e8b] hover:bg-teal-50 rounded-lg transition-colors"
                          title="عرض ملف الطالب الشامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل بيانات الطالب"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#008e8b]" />
                <span>{editingStudent ? 'تعديل بيانات طالب' : 'إضافة طالب جديد'}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الطالب رباعي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد محمد محمود إبراهيم"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كود الطالب / رقم الجلوس
                  </label>
                  <input
                    type="text"
                    value={formData.studentCode || ''}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    placeholder="مثال: STD-1001"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرقم القومي (14 رقم)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="الرقم القومي للطالب"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع</label>
                  <select
                    value={formData.gender || 'ذكر'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المرحلة الدراسية
                  </label>
                  <select
                    value={formData.stage || ''}
                    onChange={(e) => {
                      const st = stages.find(s => s.name === e.target.value);
                      setFormData({
                        ...formData,
                        stage: e.target.value,
                        grade: st?.grades[0]?.name || '',
                        classroom: st?.grades[0]?.classrooms[0] || '1/1',
                      });
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  >
                    {stages.map(st => (
                      <option key={st.id} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصف الدراسي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="مثال: الصف الأول الثانوي"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الفصل / الشعبة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classroom || ''}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    placeholder="مثال: 1/1 أو 2/3"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة القيد</label>
                  <select
                    value={formData.status || 'نشط'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  >
                    <option value="نشط">نشط</option>
                    <option value="موقوف">موقوف</option>
                    <option value="منقول">منقول</option>
                    <option value="متخرج">متخرج</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-[#008e8b] mb-3">بيانات ولي الأمر</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="اسم ولي الأمر"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">صلة القرابة</label>
                  <select
                    value={formData.relationship || 'أب'}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  >
                    <option value="أب">أب</option>
                    <option value="أم">أم</option>
                    <option value="وصي قانوني">وصي قانوني</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف ولي الأمر</label>
                  <input
                    type="text"
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="010xxxxxxxx"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">هاتف الطالب إن وجد</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان السكني</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان بالتفصيل"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-[#008e8b]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#008e8b] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ بيانات الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          student={selectedStudentForProfile}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedStudentForProfile(null);
          }}
          onEdit={(student) => handleOpenEdit(student)}
        />
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <ImportWizardModal
          isOpen={isImportModalOpen}
          defaultMode="students"
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={reloadStudents}
        />
      )}
    </div>
  );
};
