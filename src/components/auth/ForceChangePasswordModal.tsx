import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { hashPasswordSHA256 } from '../../utils/cryptoUtils';

interface Props {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
}

export const ForceChangePasswordModal: React.FC<Props> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }

    if (newPassword === 'admin123' || newPassword === 'admin') {
      setError('لا يمكن استخدام كلمة المرور الافتراضية القديمة. يرجى اختيار كلمة مرور قوية وجديدة');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setIsSubmitting(true);
    try {
      const hashed = await hashPasswordSHA256(newPassword);
      const updatedUser: User = {
        ...user,
        password: hashed,
        mustChangePassword: false,
      };

      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      onPasswordChanged(updatedUser);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ كلمة المرور الجديدة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 text-right animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 text-center">
          تغيير كلمة المرور الافتراضية إلزامياً
        </h3>
        <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
          حفاظاً على أمن وسلامة بيانات المدرسة والطلاب، يجب عليك تغيير كلمة المرور الافتراضية بحساب <span className="font-bold text-slate-800">@{user.username}</span> قبل متابعة العمل.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="أدخل 6 أحرف أو أرقام على الأقل"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ والتأمين...' : 'حفظ كلمة المرور ومتابعة الدخول'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
