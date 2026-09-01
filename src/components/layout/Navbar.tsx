import React from 'react';
import {
  Flame,
  Calculator,
  CalendarDays,
  CheckCircle2,
  LineChart,
  BookOpen,
  User as UserIcon,
  Activity,
  Cloud,
  CloudCheck,
  RefreshCw,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';

export type TabType = 'calculator' | 'planner' | 'tracker' | 'analytics' | 'recommendations';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAuthModal: () => void;
  onOpenGoogleFitModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenGoogleFitModal,
  onOpenSettingsModal,
}) => {
  const { user } = useAuth();
  const { streak, isSyncing, lastSyncedAt, loadSampleDemoData } = usePlan();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'tracker', label: 'Щоденник дня', icon: CheckCircle2 },
    { id: 'planner', label: 'План & Циклування', icon: CalendarDays },
    { id: 'analytics', label: 'Графіки & Прогрес', icon: LineChart },
    { id: 'calculator', label: 'Калькулятор тіла', icon: Calculator },
    { id: 'recommendations', label: 'Поради що їсти', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tracker')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
                  BodyPlan <span className="text-emerald-400">&</span> CalorieSync
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Розрахунок жиру, дефіцит по днях та трекінг YAZIO
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold shadow-sm"
              title={`Поточний стрик закритих днів: ${streak}`}
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{streak} {streak === 1 ? 'день' : streak >= 2 && streak <= 4 ? 'дні' : 'днів'}</span>
            </div>

            {/* Google Fit quick connect */}
            <button
              onClick={onOpenGoogleFitModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Підключити Google Fit"
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Fit</span>
            </button>

            {/* User Auth / Google Sign-in */}
            {user ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
                title={`Google Акаунт: ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full border border-emerald-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 max-w-[90px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Google Вхід</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors"
              title="Налаштування додатку"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between gap-1 py-2 overflow-x-auto no-scrollbar border-t border-slate-800/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[62px] py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
