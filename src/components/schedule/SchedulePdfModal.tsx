import React, { useRef } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { ScheduleItem, SystemSettings } from '../../types';
import { storageService } from '../../services/storageService';

interface SchedulePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: ScheduleItem[];
  days: string[];
  periods: number[];
  scheduleConfig: any;
  settings: SystemSettings;
}

export const SchedulePdfModal: React.FC<SchedulePdfModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
  days,
  periods,
  scheduleConfig,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold">معاينة وطباعة الجدول المدرسي الرسمي (PDF / Print)</h3>
            <p className="text-xs text-slate-400 mt-0.5">جاهز للطباعة والتصدير بتنسيق وزارة التربية والتعليم</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الجدول الآن</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0" ref={printRef}>
          <div className="max-w-4xl mx-auto border border-slate-300 p-8 rounded-2xl bg-white print:border-none print:p-0">
            {/* Ministry Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">جمهورية مصر العربية</p>
                <p className="text-xs font-bold text-slate-700">وزارة التربية والتعليم والتعليم الفني</p>
                <p className="text-xs text-slate-600 font-semibold">{settings.schoolName || 'مدرسة التميز التكنولوجية الدولية'}</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center mx-auto mb-1">
                  NTSS
                </div>
                <h2 className="text-base font-black text-slate-900">{title}</h2>
                {subtitle && <p className="text-xs text-slate-600 font-bold mt-0.5">{subtitle}</p>}
              </div>

              <div className="text-left">
                <p className="text-xs font-bold text-slate-700">العام الدراسي: 2026 / 2027</p>
                <p className="text-xs font-bold text-slate-700">الفصل الدراسي الأول</p>
                <p className="text-[11px] text-slate-500 mt-1">تاريخ الاعتماد: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            {/* Timetable Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border-2 border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-xs font-black">
                    <th className="border-2 border-slate-900 p-2.5 w-24">اليوم / الحصة</th>
                    {periods.map(p => {
                      const time = scheduleConfig.periodTimes?.[p - 1];
                      return (
                        <th key={p} className="border-2 border-slate-900 p-2">
                          <div className="font-black text-xs">الحصة {p}</div>
                          {time && (
                            <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                              {time.startTime} - {time.endTime}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {days.map(day => (
                    <tr key={day} className="border-b border-slate-400">
                      <td className="border-2 border-slate-900 p-3 font-black bg-slate-50 text-slate-900">
                        {day}
                      </td>
                      {periods.map(p => {
                        const cellItem = items.find(
                          i => (i.dayOfWeek === day || i.dayName === day) && i.periodNumber === p
                        );
                        return (
                          <td key={p} className="border-2 border-slate-900 p-2 align-middle">
                            {cellItem ? (
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-xs">{cellItem.subject}</div>
                                <div className="text-[11px] text-slate-600 font-medium">
                                  {cellItem.teacherName || 'المعلم'}
                                </div>
                                {cellItem.roomNumber && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {cellItem.roomNumber}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="grid grid-cols-3 gap-8 text-center pt-10 mt-6 border-t border-slate-300 text-xs font-bold text-slate-800">
              <div>
                <p>مسؤول شؤون الجدول</p>
                <div className="h-12 border-b border-dotted border-slate-400 mt-2"></div>
              </div>
              <div>
                <p>وكيل شؤون المعلمين</p>
                <div className="h-12 border-b border-dotted border-slate-400 mt-2"></div>
              </div>
              <div>
                <p>مدير المدرسة / الاعتماد الرسمي</p>
                <div className="h-12 border-b border-dotted border-slate-400 mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
