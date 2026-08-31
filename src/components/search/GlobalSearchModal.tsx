import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  GraduationCap,
  Users,
  Shield,
  BookOpen,
  ArrowLeft,
  X,
  Command,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { BehaviorCase, BehaviorViolation, Employee, Student, UserRole } from '../../types';

interface GlobalSearchModalProps {
  userRole?: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (entity: string, item: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  userRole = 'Admin',
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const students = storageService.getStudents();
  const employees = storageService.getEmployees();
  const violations = storageService.getBehaviorViolations();
  const cases = storageService.getBehaviorCases();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Search by role permissions
  const matchingStudents =
    userRole !== 'TeacherAffairs'
      ? students.filter(
          s =>
            s.name.toLowerCase().includes(cleanQuery) ||
            s.studentCode.toLowerCase().includes(cleanQuery) ||
            (s.nationalId && s.nationalId.includes(cleanQuery)) ||
            (s.parentPhone && s.parentPhone.includes(cleanQuery))
        ).slice(0, 5)
      : [];

  const matchingEmployees =
    userRole === 'Admin' || userRole === 'TeacherAffairs' || userRole === 'HR'
      ? employees.filter(
          e =>
            e.name.toLowerCase().includes(cleanQuery) ||
            (e.phone && e.phone.includes(cleanQuery)) ||
            (e.department && e.department.toLowerCase().includes(cleanQuery)) ||
            (e.jobTitle && e.jobTitle.toLowerCase().includes(cleanQuery))
        ).slice(0, 5)
      : [];

  const matchingViolations =
    userRole === 'Admin' || userRole === 'SocialSpecialist' || userRole === 'StudentAffairs'
      ? violations.filter(
          v =>
            v.studentName.toLowerCase().includes(cleanQuery) ||
            v.violationName.toLowerCase().includes(cleanQuery) ||
            (v.description && v.description.toLowerCase().includes(cleanQuery))
        ).slice(0, 4)
      : [];

  const matchingCases =
    userRole === 'Admin' || userRole === 'SocialSpecialist'
      ? cases.filter(
          c =>
            c.studentName.toLowerCase().includes(cleanQuery) ||
            c.caseCode.toLowerCase().includes(cleanQuery) ||
            c.summary.toLowerCase().includes(cleanQuery)
        ).slice(0, 4)
      : [];

  const totalResults =
    matchingStudents.length + matchingEmployees.length + matchingViolations.length + matchingCases.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#008e8b] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث فوري في الطلاب، المعلمين، الفصول، والمخالفات والحالات السلوكية..."
            className="w-full text-sm font-medium bg-transparent border-none focus:outline-none text-slate-800 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
          >
            إغلاق (Esc)
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto custom-scrollbar p-4 space-y-6 flex-1">
          {cleanQuery.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Command className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">اكتب اسم طالب أو معلم أو كود أو هاتف لبدء البحث السريع</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              لم يتم العثور على أي نتائج مطابقة لكلمة البحث "{query}".
            </div>
          ) : (
            <>
              {/* 1. Students Results */}
              {matchingStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#008e8b]" />
                    <span>الطلاب ({matchingStudents.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingStudents.map(std => (
                      <div
                        key={std.id}
                        onClick={() => {
                          onSelectResult('STUDENT', std);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{std.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {std.grade} • فصل {std.classroom} • كود: {std.studentCode}
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-[#008e8b]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Employees Results */}
              {matchingEmployees.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#008e8b]" />
                    <span>المعلمون والموظفون ({matchingEmployees.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          onSelectResult('EMPLOYEE', emp);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{emp.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {emp.jobTitle} • {emp.department}
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-[#008e8b]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Behavior Violations & Cases */}
              {(matchingViolations.length > 0 || matchingCases.length > 0) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>المخالفات والحالات السلوكية</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingViolations.map(v => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onSelectResult('BEHAVIOR', v);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{v.violationName} - {v.studentName}</div>
                          <div className="text-[11px] text-slate-500">
                            {v.grade} • {v.date} • خصم {v.pointsDeducted} نقطة
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-amber-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
