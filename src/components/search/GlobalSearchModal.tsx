import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Command,
  GraduationCap,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { GlobalSearchResultItem, SearchCategory } from '../../types_extended';
import { SearchService } from '../../services/searchService';

interface GlobalSearchModalProps {
  currentUser?: User | null;
  userRole?: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (entity: string, item: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  currentUser,
  userRole = 'Admin',
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | 'ALL'>('ALL');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened & setup keyboard escape
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search via SearchService
  useEffect(() => {
    if (!isOpen) return;
    const cleanQuery = query.trim();
    if (cleanQuery.length === 0) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const activeUser: User = currentUser || {
        id: 'guest',
        username: 'guest',
        name: 'Guest',
        role: userRole,
      };

      const hits = SearchService.executeSearch(cleanQuery, activeUser, {
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        limit: 20,
      });

      setResults(hits);
      setIsSearching(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, isOpen, currentUser, userRole]);

  if (!isOpen) return null;

  const categoriesList: { id: SearchCategory | 'ALL'; label: string; icon: any }[] = [
    { id: 'ALL', label: 'كافة النتائج', icon: Sparkles },
    { id: 'STUDENTS', label: 'الطلاب', icon: GraduationCap },
    { id: 'EMPLOYEES', label: 'الموظفون', icon: Users },
    { id: 'BEHAVIOR', label: 'السلوك والمخالفات', icon: Shield },
    { id: 'SCHEDULE', label: 'الحصص والجداول', icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، كود الطالب، الرقم القومي، رقم الهاتف، أو اسم الفصل والمادة..."
            className="w-full text-sm font-medium bg-transparent border-none focus:outline-hidden text-slate-800 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors"
          >
            إغلاق (Esc)
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs font-bold">
          {categoriesList.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 flex-1 min-h-[220px]">
          {query.trim().length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Command className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">
                اكتب أي كلمة، رقم هاتف، أو كود للبحث الذكي مع دعم التطبيع التلقائي للأحرف العربية
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <span>مثال:</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-600">أحمد</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-600">1/1</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-600">STU-</span>
              </div>
            </div>
          ) : isSearching ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              جاري فحص وتطبيع نتائج البحث...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              لم يتم العثور على أي نتائج تطابق "{query}".
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between pb-1">
                <span>النتائج المطابقة ({results.length})</span>
                <span>انقر للانتقال الفوري</span>
              </div>

              {results.map(item => {
                const isStudent = item.category === 'STUDENTS';
                const isEmployee = item.category === 'EMPLOYEES';
                const isBehavior = item.category === 'BEHAVIOR';
                const isSchedule = item.category === 'SCHEDULE';

                return (
                  <div
                    key={`${item.category}_${item.id}`}
                    onClick={() => {
                      onSelectResult(item.category, item.raw);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          isStudent
                            ? 'bg-teal-600'
                            : isEmployee
                            ? 'bg-indigo-600'
                            : isBehavior
                            ? 'bg-amber-600'
                            : 'bg-slate-700'
                        }`}
                      >
                        {isStudent && <GraduationCap className="w-5 h-5" />}
                        {isEmployee && <Users className="w-5 h-5" />}
                        {isBehavior && <Shield className="w-5 h-5" />}
                        {isSchedule && <Calendar className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {item.categoryLabel}
                      </span>
                      <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:-translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
