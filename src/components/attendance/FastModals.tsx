import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import {
  AbsenceReasonCategory,
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  LeaveType,
  PermissionType,
  SystemSettings
} from '../../types';
import {
  calculateAttendanceMetrics,
  formatDateKey,
  formatMinutesToHuman,
  getArabicDayName,
  getCurrentTimeString,
  timeStringToMinutes
} from '../../utils/attendanceUtils';

// ----------------------------------------------------
// 1. Fast Absence Modal (مودال الغياب السريع)
// ----------------------------------------------------
interface FastAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  date: string;
  onSave: (empId: string, date: string, category: AbsenceReasonCategory, reason: string) => void;
}

const ABSENCE_CATEGORIES: AbsenceReasonCategory[] = [
  'بدون إذن',
  'بعذر مقبول',
  'مرضي',
  'ظرف طارئ',
  'لم يحضر',
  'أخرى'
];

export const FastAbsenceModal: React.FC<FastAbsenceModalProps> = ({
  isOpen,
  onClose,
  employee,
  date,
  onSave
}) => {
  const [category, setCategory] = useState<AbsenceReasonCategory>('بدون إذن');
  const [reason, setReason] = useState('');

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, date, category, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تسجيل غياب</h3>
              <p className="text-xs text-slate-500 font-medium">{employee.name} ({employee.id}) • {date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">تصنيف سبب الغياب</label>
            <div className="grid grid-cols-3 gap-2">
              {ABSENCE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 px-2 text-xs font-bold rounded-xl border text-center transition ${
                    category === cat
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات / تفاصيل إضافية (اختياري)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: إشعار هاتفي، ظرف عائلي..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
            >
              تأكيد تسجيل الغياب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. Fast Permission Modal (مودال المأذونية / الإذن السريع)
// ----------------------------------------------------
interface FastPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  date: string;
  onSave: (empId: string, date: string, permData: { type: string; from: string; to: string; reason?: string }) => void;
}

const PERMISSION_TYPES: PermissionType[] = [
  'إذن خروج',
  'إذن تأخير',
  'إذن انصراف مبكر',
  'إذن خلال اليوم',
  'أخرى'
];

export const FastPermissionModal: React.FC<FastPermissionModalProps> = ({
  isOpen,
  onClose,
  employee,
  date,
  onSave
}) => {
  const [type, setType] = useState<PermissionType>('إذن خروج');
  const [fromTime, setFromTime] = useState('12:00');
  const [toTime, setToTime] = useState('14:00');
  const [reason, setReason] = useState('');

  if (!isOpen || !employee) return null;

  const fromMins = timeStringToMinutes(fromTime);
  const toMins = timeStringToMinutes(toTime);
  const durationMins = Math.max(0, toMins - fromMins);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, date, {
      type,
      from: fromTime,
      to: toTime,
      reason
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تسجيل مأذونية / إذن</h3>
              <p className="text-xs text-slate-500 font-medium">{employee.name} ({employee.id}) • {date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الإذن / المأذونية</label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_TYPES.map(pType => (
                <button
                  key={pType}
                  type="button"
                  onClick={() => setType(pType)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    type === pType
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {pType}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">من الساعة</label>
              <input
                type="time"
                value={fromTime}
                onChange={e => setFromTime(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">إلى الساعة</label>
              <input
                type="time"
                value={toTime}
                onChange={e => setToTime(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-center"
              />
            </div>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200/70 rounded-xl text-xs flex items-center justify-between text-sky-900">
            <span className="font-bold">إجمالي مدة الإذن:</span>
            <span className="font-black font-mono">{formatMinutesToHuman(durationMins)}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب الإذن (اختياري)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: مراجعة دائرة حكومية، موعد طبي..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition"
            >
              حفظ وتسجيل الإذن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. Fast Leave Modal (مودال الإجازة السريعة)
// ----------------------------------------------------
interface FastLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  date: string;
  onSave: (empId: string, startDate: string, endDate: string, leaveType: LeaveType, reason: string) => void;
}

const LEAVE_TYPES: LeaveType[] = [
  'سنوية',
  'مرضية',
  'عارضة',
  'بدون راتب',
  'أمومة/أبوة',
  'أخرى'
];

export const FastLeaveModal: React.FC<FastLeaveModalProps> = ({
  isOpen,
  onClose,
  employee,
  date,
  onSave
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('سنوية');
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [reason, setReason] = useState('');

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, startDate, endDate, leaveType, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تسجيل إجازة رسمية</h3>
              <p className="text-xs text-slate-500 font-medium">{employee.name} ({employee.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الإجازة</label>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPES.map(lType => (
                <button
                  key={lType}
                  type="button"
                  onClick={() => setLeaveType(lType)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    leaveType === lType
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lType}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ البدء</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الانتهاء</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب الإجازة (اختياري)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: إجازة سنوية مجدولة..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition"
            >
              تأكيد الإجازة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. Fast Edit Record Modal (مودال تعديل السجل السريع)
// ----------------------------------------------------
interface FastEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  settings: SystemSettings;
  onSave: (record: AttendanceRecord) => void;
}

export const FastEditModal: React.FC<FastEditModalProps> = ({
  isOpen,
  onClose,
  record,
  settings,
  onSave
}) => {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [checkIn, setCheckIn] = useState(record.checkIn || '');
  const [checkOut, setCheckOut] = useState(record.checkOut || '');
  const [lateMinutes, setLateMinutes] = useState(record.lateMinutes || 0);
  const [earlyLeaveMinutes, setEarlyLeaveMinutes] = useState(record.earlyLeaveMinutes || 0);
  const [workingHours, setWorkingHours] = useState(record.workingHours || 0);
  const [overtimeHours, setOvertimeHours] = useState(record.overtimeHours || 0);
  const [notes, setNotes] = useState(record.notes || '');

  const handleRecalculate = () => {
    if (checkIn) {
      const metrics = calculateAttendanceMetrics(
        checkIn,
        checkOut,
        settings.officialStartTime,
        settings.officialEndTime,
        settings.gracePeriodMinutes,
        8
      );
      setLateMinutes(metrics.lateMinutes);
      setEarlyLeaveMinutes(metrics.earlyLeaveMinutes);
      setWorkingHours(metrics.workingHours);
      setOvertimeHours(metrics.overtimeHours);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AttendanceRecord = {
      ...record,
      status,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      lateMinutes,
      earlyLeaveMinutes,
      workingHours,
      overtimeHours,
      notes: notes || undefined,
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#008e8b]/10 border-b border-[#008e8b]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008e8b] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تعديل سجل حضور</h3>
              <p className="text-xs text-slate-500 font-medium">{record.employeeName} ({record.employeeId}) • {record.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الحالة الأساسية:</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AttendanceStatus)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b]"
            >
              <option value="حاضر">🟢 حاضر</option>
              <option value="متأخر">🟡 متأخر</option>
              <option value="غائب">🔴 غائب</option>
              <option value="مأذونية">🔵 مأذونية / إذن</option>
              <option value="إجازة">🟣 إجازة</option>
              <option value="راحة">⚪ راحة / عطلة</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">وقت الحضور</label>
              <input
                type="time"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                onBlur={handleRecalculate}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">وقت الانصراف</label>
              <input
                type="time"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                onBlur={handleRecalculate}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="block text-slate-500 font-medium text-[11px]">التأخير (دقيقة):</span>
              <input
                type="number"
                value={lateMinutes}
                onChange={e => setLateMinutes(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 text-center"
              />
            </div>
            <div>
              <span className="block text-slate-500 font-medium text-[11px]">ساعات العمل:</span>
              <input
                type="number"
                step="0.1"
                value={workingHours}
                onChange={e => setWorkingHours(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 text-center"
              />
            </div>
            <div>
              <span className="block text-slate-500 font-medium text-[11px]">ساعات إضافية:</span>
              <input
                type="number"
                step="0.1"
                value={overtimeHours}
                onChange={e => setOvertimeHours(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات السجل:</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: تم التعديل بتفويض من الإدارة..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#008e8b] hover:bg-[#007775] rounded-xl shadow-xs transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
