import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  CloudCheck,
  Cloud,
  RefreshCw,
  Settings,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { user, signInWithGoogle, signOutUser, isFirebaseConfigured, error, clearError } = useAuth();
  const { isSyncing, lastSyncedAt, syncWithCloud, streak, logs } = usePlan();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (e) {
      // error handled in context
    } finally {
      setIsSigningIn(false);
    }
  };

  const loggedDaysCount = Object.keys(logs).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Мій Google Профіль' : 'Вхід через Google'}
      subtitle="Збереження даних у хмарі та синхронізація між пристроями"
    >
      <div className="space-y-6 text-xs text-slate-300">
        {/* User Logged In State */}
        {user ? (
          <div className="space-y-5">
            {/* User Profile Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-14 h-14 rounded-full border-2 border-emerald-400 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl font-black border border-emerald-500/40">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-100 text-base truncate">
                    {user.displayName || 'Google Користувач'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-[10px] font-bold">
                    Хмара активна
                  </span>
                </div>
                <p className="text-slate-400 truncate text-xs mt-0.5">{user.email}</p>
                <p className="text-[11px] text-emerald-400/90 mt-1">
                  Остання синхронізація: {lastSyncedAt || 'Щойно'}
                </p>
              </div>
            </div>

            {/* Cloud Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Синхронізовано днів</p>
                <p className="text-xl font-black text-slate-100 mt-0.5">{loggedDaysCount}</p>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Поточний стрик</p>
                <p className="text-xl font-black text-amber-400 mt-0.5">🔥 {streak}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={syncWithCloud}
                disabled={isSyncing}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Синхронізація...' : 'Синхронізувати зараз'}</span>
              </button>

              <button
                type="button"
                onClick={signOutUser}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                title="Вийти з акаунта"
              >
                <LogOut className="w-4 h-4" />
                <span>Вийти</span>
              </button>
            </div>
          </div>
        ) : (
          /* User Not Logged In State */
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-100 text-base">
                Авторизуйтесь через Google
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Ваші параметри тіла, розрахований план дієти та щоденні калорії будуть автоматично збережені у безпечній хмарі Firestore під вашим Google акаунтом.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                  {!isFirebaseConfigured && (
                    <button
                      onClick={() => {
                        clearError();
                        onClose();
                        onOpenSettings();
                      }}
                      className="block text-blue-400 underline font-semibold mt-1"
                    >
                      Відкрити налаштування Firebase API
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-white/10 transition-all transform active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isSigningIn ? 'Вхід через Google...' : 'Увійти з Google'}</span>
            </button>

            {!isFirebaseConfigured && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-slate-400">
                <span className="text-[11px]">Потрібно підключити власний Firebase проєкт?</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Налаштування
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
