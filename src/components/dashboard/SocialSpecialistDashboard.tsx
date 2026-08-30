import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HeartHandshake,
  PhoneCall,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { BehaviorType, BehaviorViolation, Student, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import { formatEgyptianDate, getCairoCurrentDate, getEgyptianDayName } from '../../utils/egyptianTime';

interface SocialSpecialistDashboardProps {
  currentUser: UserType | null;
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const SocialSpecialistDashboard: React.FC<SocialSpecialistDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const todayKey = getCairoCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const students = useMemo(() => storageService.getStudents(), []);
  const violations = useMemo(() => storageService.getBehaviorViolations(), []);
  const behaviorTypes = useMemo(() => storageService.getBehaviorTypes(), []);

  // Today Violations
  const todayViolations = useMemo(() => violations.filter(v => v.date === selectedDate), [violations, selectedDate]);
  const pendingReviewViolations = useMemo(() => violations.filter(v => v.status === 'قيد المراجعة'), [violations]);
  const unnotifiedParentsViolations = useMemo(() => violations.filter(v => !v.parentNotified), [violations]);

  // Behavior score mapping for students
  const studentViolationsCountMap = useMemo(() => {
    const map = new Map<string, { count: number; totalDeducted: number }>();
    violations.forEach(v => {
      const current = map.get(v.studentId) || { count: 0, totalDeducted: 0 };
      map.set(v.studentId, {
        count: current.count + 1,
        totalDeducted: current.totalDeducted + (v.pointsDeducted || 0),
      });
    });
    return map;
  }, [violations]);

  // High Risk Students (Score < 85 or Violations >= 2)
  const highRiskStudents = useMemo(() => {
    return students
      .map(st => {
        const stats = studentViolationsCountMap.get(st.id) || { count: 0, totalDeducted: 0 };
        const score = Math.max(0, (st.initialBehaviorScore || 100) - stats.totalDeducted);
        return {
          ...st,
          score,
          violationCount: stats.count,
          totalDeducted: stats.totalDeducted,
        };
      })
      .filter(st => st.score < 90 || st.violationCount >= 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
  }, [students, studentViolationsCountMap]);

  const userName = currentUser?.fullName?.split(' ')[0] || 'الأخصائي الاجتماعي';

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
            {userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">لوحة تحكم الإرشاد الطلابي والتربوي</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                متابعة الانضباط والسلوك
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مرحباً {currentUser?.fullName} — رصد المخالفات السلوكية، معالجة الحالات الحرجة، والتواصل مع أولياء الأمور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{getEgyptianDayName(selectedDate)}، {formatEgyptianDate(selectedDate)}</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold">مخالفات اليوم</div>
          <div className="text-xl font-black text-slate-900 mt-1">{todayViolations.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">حالات مسجلة اليوم</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <div className="text-[11px] text-amber-700 font-bold">بانتظار المراجعة</div>
          <div className="text-xl font-black text-amber-600 mt-1">{pendingReviewViolations.length}</div>
          <div className="text-[10px] text-amber-600 mt-1">تتطلب اعتماد الإجراء</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <div className="text-[11px] text-purple-700 font-bold">إخطار أولياء الأمور</div>
          <div className="text-xl font-black text-purple-600 mt-1">{unnotifiedParentsViolations.length}</div>
          <div className="text-[10px] text-purple-600 mt-1">حالات لم يخطر ولي أمرها</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold">طلاب بحاجة لمتابعة عاجلة</div>
          <div className="text-xl font-black text-rose-600 mt-1">{highRiskStudents.length}</div>
          <div className="text-[10px] text-rose-600 mt-1">درجة السلوك &lt; 90%</div>
        </div>
      </div>

      {/* Action Shortcuts */}
      <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <span>إجراءات الأخصائي الاجتماعي:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('behavior', { action: 'new_violation' })}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل مخالفة سلوكية جديدة</span>
          </button>

          <button
            onClick={() => onNavigate('behavior')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>سجل المخالفات والانضباط</span>
          </button>

          <button
            onClick={() => onNavigate('behavior', { tab: 'behavior_types' })}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
            <span>بنود المخالفات وأوزانها</span>
          </button>

          <button
            onClick={() => onNavigate('behavior')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>تقارير السلوك والانضباط</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: High Risk Students & Today's Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Students */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-sm">قائمة الطلاب الأكثر حاجة للرعاية والمتابعة</h2>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold hover:underline cursor-pointer"
            >
              عرض الجميع
            </button>
          </div>

          {highRiskStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              لا يوجد طلاب بمستوى سلوكي حرج.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {highRiskStudents.map(st => (
                <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{st.name}</div>
                    <div className="text-[11px] text-slate-500">{st.grade} — {st.classroom}</div>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                        st.score < 80 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        درجة السلوك: {st.score}%
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{st.violationCount} مخالفات مسجلة</div>
                    </div>

                    <button
                      onClick={() => onNavigate('students')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-amber-500 text-amber-700 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      ملف الطالب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Violations Feed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="font-bold text-slate-900 text-sm">أحدث المخالفات المسجلة</h2>
            </div>
            <button
              onClick={() => onNavigate('behavior')}
              className="text-xs text-[#008e8b] hover:text-[#007775] font-bold hover:underline cursor-pointer"
            >
              سجل المخالفات
            </button>
          </div>

          {todayViolations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              لم تسجل أي مخالفات سلوكية اليوم. اليوم منضبط تماماً!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayViolations.slice(0, 5).map(v => (
                <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{v.studentName}</div>
                    <div className="text-[11px] text-amber-700 font-semibold">{v.violationName}</div>
                    <div className="text-[10px] text-slate-400">{v.grade} — {v.classroom}</div>
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                      خصم {v.pointsDeducted} نقاط
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{v.actionTaken || 'بانتظار الإجراء'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
