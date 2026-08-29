import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { NTSSLogo } from '../common/NTSSLogo';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم');
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const result = await storageService.login(username.trim(), password);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-[#008e8b]/20 selection:text-[#008e8b]"
    >
      {/* Top Subtle Brand Anchor */}
      <div className="w-full max-w-md pt-4 sm:pt-8 flex justify-center">
        <NTSSLogo variant="full" size="md" />
      </div>

      {/* Main Login Card (Apple-Inspired Minimalism) */}
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-200/80 transition-all">
          {/* Header Title */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              تسجيل الدخول للنظام
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              أدخل بيانات حسابك المعتمد للمتابعة إلى لوحة التحكم
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="input-username"
                className="block text-xs font-bold text-slate-700 select-none"
              >
                اسم المستخدم
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="input-password"
                className="block text-xs font-bold text-slate-700 select-none"
              >
                كلمة المرور
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008e8b]/20 focus:border-[#008e8b] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#008e8b] hover:bg-[#007775] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ التحقق من الحساب...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean Security Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008e8b]" />
            <span>نظام تسجيل الدخول المشفر والمؤمن بالكامل</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="w-full max-w-md pb-4 text-center text-xs text-slate-400 font-medium">
        نظام إدارة الحضور والانصراف والموارد البشرية &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
