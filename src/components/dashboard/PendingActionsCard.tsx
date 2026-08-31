import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Shield,
  Users,
  GraduationCap,
} from 'lucide-react';
import { PendingAction, UserRole } from '../../types';

interface PendingActionsCardProps {
  userRole: UserRole;
  actions: PendingAction[];
  onExecuteAction: (actionUrl: string) => void;
}

export const PendingActionsCard: React.FC<PendingActionsCardProps> = ({ userRole, actions, onExecuteAction }) => {
  const getSectionTitle = () => {
    switch (userRole) {
      case 'Admin':
        return 'مطلوب من الإدارة اليوم (Pending Admin Actions)';
      case 'StudentAffairs':
        return 'إجراءات شؤون الطلاب اليومية';
      case 'TeacherAffairs':
        return 'إجراءات شؤون المعلمين والدوام';
      case 'Teacher':
        return 'مهام وحصص تنتظر استكمالك';
      case 'SocialSpecialist':
        return 'جلسات ومتابعات الإرشاد السلوكي';
      case 'Parent':
        return 'يهمك متابعته اليوم';
      default:
        return 'مطلوب منك اليوم';
    }
  };

  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">{getSectionTitle()}</div>
            <div className="text-[11px] text-slate-500">تم إنجاز كافة المهام المعلقة بنجاح! لا توجد إجراءات معلقة.</div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          مكتمل 100%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#008e8b] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">{getSectionTitle()}</h2>
            <p className="text-[10px] text-slate-500">إجراءات تشغيلية تتطلب تدخلك للحفاظ على انتظام العمل</p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#008e8b] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
          {actions.length} إجراءات معلقة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {actions.map(action => (
          <div
            key={action.id}
            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between gap-3 text-right"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{action.title}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    action.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800'
                      : action.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-50 text-[#008e8b]'
                  }`}
                >
                  {action.priority === 'URGENT' ? 'عاجل' : action.priority === 'HIGH' ? 'مهم' : 'عادي'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{action.description}</p>
            </div>

            {action.actionUrl && (
              <button
                onClick={() => onExecuteAction(action.actionUrl!)}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#008e8b] text-[#008e8b] hover:text-white border border-slate-200 hover:border-[#008e8b] font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
              >
                <span>{action.actionLabel || 'تنفيذ الإجراء'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
