import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
} from 'lucide-react';
import { PeriodSlot, ScheduleBreakTime, ScheduleConfig, SystemSettings } from '../../types';
import { DEFAULT_SCHEDULE_CONFIG } from '../../data/initialData';
import { storageService } from '../../services/storageService';

interface ScheduleConfigTabProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

const ALL_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ScheduleConfigTab: React.FC<ScheduleConfigTabProps> = ({ formData, setFormData }) => {
  const [notification, setNotification] = useState<string | null>(null);

  const scheduleConfig: ScheduleConfig = formData.scheduleConfig || DEFAULT_SCHEDULE_CONFIG;

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStudyDayToggle = (day: string) => {
    const current = scheduleConfig.studyDays || [];
    let updated: string[];
    if (current.includes(day)) {
      if (current.length <= 1) {
        alert('يجب الإبقاء على يوم دراسي واحد على الأقل');
        return;
      }
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day];
    }
    const nonStudy = ALL_DAYS.filter(d => !updated.includes(d));

    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...scheduleConfig,
        studyDays: updated,
        nonStudyDays: nonStudy,
      },
    }));
  };

  const handlePeriodCountChange = (count: number) => {
    if (count < 1 || count > 12) return;
    const currentPeriods = [...(scheduleConfig.periods || [])];

    let newPeriods: PeriodSlot[] = [];
    for (let i = 1; i <= count; i++) {
      const existing = currentPeriods.find(p => p.periodNumber === i);
      if (existing) {
        newPeriods.push(existing);
      } else {
        newPeriods.push({
          periodNumber: i,
          name: `الحصة ${i}`,
          startTime: '08:00',
          endTime: '08:45',
          isBreak: false,
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...scheduleConfig,
        periodCount: count,
        periods: newPeriods,
      },
    }));
  };

  const handleUpdatePeriod = (index: number, field: keyof PeriodSlot, value: any) => {
    const updated = [...(scheduleConfig.periods || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setFormData(prev => ({
        ...prev,
        scheduleConfig: {
          ...scheduleConfig,
          periods: updated,
        },
      }));
    }
  };

  const handleAddBreak = () => {
    const breaks = scheduleConfig.breakTimes || [];
    const newBreak: ScheduleBreakTime = {
      id: `BRK_${Date.now()}`,
      name: `فسحة راحة ${breaks.length + 1}`,
      startTime: '10:15',
      endTime: '10:45',
    };
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...scheduleConfig,
        breakTimes: [...breaks, newBreak],
      },
    }));
    showNotif('تمت إضافة وقت فسحة جديد');
  };

  const handleRemoveBreak = (id: string) => {
    const breaks = (scheduleConfig.breakTimes || []).filter(b => b.id !== id);
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...scheduleConfig,
        breakTimes: breaks,
      },
    }));
  };

  const handleUpdateBreak = (id: string, field: keyof ScheduleBreakTime, value: any) => {
    const breaks = (scheduleConfig.breakTimes || []).map(b => (b.id === id ? { ...b, [field]: value } : b));
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...scheduleConfig,
        breakTimes: breaks,
      },
    }));
  };

  const handleResetSchedule = () => {
    if (window.confirm('هل تريد استعادة مواعيد الجدول المدرسي الافتراضية؟')) {
      storageService.resetSettingsSection('scheduleConfig');
      setFormData(prev => ({ ...prev, scheduleConfig: DEFAULT_SCHEDULE_CONFIG }));
      showNotif('تمت استعادة إعدادات الجدول الافتراضية بنجاح');
    }
  };

  return (
    <div className="space-y-6" id="schedule_config_container">
      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Main Parameters Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              الضوابط العامة للجدول المدرسي
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد أيام الدراسة، عدد الحصص، وأوقات بدء ونهاية اليوم التعليمي</p>
          </div>
          <button
            type="button"
            onClick={handleResetSchedule}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            استعادة الافتراضي
          </button>
        </div>

        {/* Study Days Checkboxes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            أيام الأسبوع الدراسية الرسمية
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {ALL_DAYS.map(day => {
              const isSelected = (scheduleConfig.studyDays || []).includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleStudyDayToggle(day)}
                  className={`p-3 rounded-xl text-center text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-400'
                  }`}
                >
                  <div className="text-sm mb-1">{day}</div>
                  <span className="text-[10px] font-normal">{isSelected ? 'يوم دراسي' : 'عطلة أسبوعية'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time and Periods Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عدد الحصص اليومية
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={scheduleConfig.periodCount || 7}
              onChange={e => handlePeriodCountChange(parseInt(e.target.value, 10) || 7)}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              مدة الحصة القياسية (دقائق)
            </label>
            <input
              type="number"
              min={20}
              max={90}
              value={scheduleConfig.defaultPeriodDurationMinutes || 45}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  scheduleConfig: {
                    ...scheduleConfig,
                    defaultPeriodDurationMinutes: parseInt(e.target.value, 10) || 45,
                  },
                }))
              }
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وقت بداية اليوم الدراسي
            </label>
            <input
              type="time"
              value={scheduleConfig.dayStartTime || '08:00'}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  scheduleConfig: {
                    ...scheduleConfig,
                    dayStartTime: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وقت نهاية اليوم الدراسي
            </label>
            <input
              type="time"
              value={scheduleConfig.dayEndTime || '14:15'}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  scheduleConfig: {
                    ...scheduleConfig,
                    dayEndTime: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Periods Slots Grid */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            توزيع مواقيت الحصص والفسح
          </h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300">
            إجمالي الحصص: {scheduleConfig.periods?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
              <tr>
                <th className="p-3">رقم الحصة</th>
                <th className="p-3">مسمى الحصة / الفسحة</th>
                <th className="p-3">وقت البدء</th>
                <th className="p-3">وقت الانتهاء</th>
                <th className="p-3">نوع الفترة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(scheduleConfig.periods || []).map((period, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                    الحصة {period.periodNumber}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={period.name || `الحصة ${period.periodNumber}`}
                      onChange={e => handleUpdatePeriod(idx, 'name', e.target.value)}
                      className="px-2.5 py-1.5 text-xs border rounded w-48 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      value={period.startTime || '08:00'}
                      onChange={e => handleUpdatePeriod(idx, 'startTime', e.target.value)}
                      className="px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      value={period.endTime || '08:45'}
                      onChange={e => handleUpdatePeriod(idx, 'endTime', e.target.value)}
                      className="px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="p-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!period.isBreak}
                        onChange={e => handleUpdatePeriod(idx, 'isBreak', e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>فسحة / راحة</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break Times Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              أوقات الفسح والأنشطة المدرسية
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحديد فترات التغذية والطابور والفسح الكبرى</p>
          </div>
          <button
            type="button"
            onClick={handleAddBreak}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة فسحة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(scheduleConfig.breakTimes || []).map(brk => (
            <div key={brk.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={brk.name}
                  onChange={e => handleUpdateBreak(brk.id, 'name', e.target.value)}
                  className="font-bold text-sm bg-transparent border-b border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 focus:outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBreak(brk.id)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-slate-500 mb-1">وقت البدء:</span>
                  <input
                    type="time"
                    value={brk.startTime}
                    onChange={e => handleUpdateBreak(brk.id, 'startTime', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <span className="block text-slate-500 mb-1">وقت الانتهاء:</span>
                  <input
                    type="time"
                    value={brk.endTime}
                    onChange={e => handleUpdateBreak(brk.id, 'endTime', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
