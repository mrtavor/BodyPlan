import React, { useState } from 'react';
import { Navbar, TabType } from './components/layout/Navbar';
import { BodyCalculator } from './components/calculator/BodyCalculator';
import { DietPlanner } from './components/planner/DietPlanner';
import { DailyTracker } from './components/tracker/DailyTracker';
import { ProgressDashboard } from './components/analytics/ProgressDashboard';
import { NutritionGuide } from './components/recommendations/NutritionGuide';
import { AuthModal } from './components/auth/AuthModal';
import { GoogleFitModal } from './components/google-fit/GoogleFitModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { usePlan } from './context/PlanContext';
import { Activity, ShieldCheck, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const { metrics, plan } = usePlan();
  // If no metrics or plan configured yet, default to calculator, else default to daily tracker
  const [activeTab, setActiveTab] = useState<TabType>(metrics && plan ? 'tracker' : 'calculator');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGoogleFitModalOpen, setIsGoogleFitModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenGoogleFitModal={() => setIsGoogleFitModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'tracker' && (
          <DailyTracker onOpenGoogleFitModal={() => setIsGoogleFitModalOpen(true)} />
        )}

        {activeTab === 'planner' && (
          <DietPlanner onGoToTracker={() => setActiveTab('tracker')} />
        )}

        {activeTab === 'analytics' && <ProgressDashboard />}

        {activeTab === 'calculator' && (
          <BodyCalculator onPlanNext={() => setActiveTab('planner')} />
        )}

        {activeTab === 'recommendations' && <NutritionGuide />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-400">BodyPlan & CalorieSync</span>
            <span>• Біометрія, калорійний цикл та YAZIO трекер</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Налаштування Firebase
            </button>
            <button
              onClick={() => setIsGoogleFitModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Google Fit API
            </button>
            <span className="text-[11px] text-slate-600">v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenSettings={() => {
          setIsAuthModalOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      <GoogleFitModal
        isOpen={isGoogleFitModalOpen}
        onClose={() => setIsGoogleFitModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
