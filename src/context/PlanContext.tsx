import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { AppState, BodyMetrics, DailyLog, DietPlan } from '../types';
import {
  calculateActiveStreak,
  DEFAULT_INITIAL_STATE,
  getSampleInitialState,
  loadLocalAppState,
  saveLocalAppState,
} from '../lib/storage';
import { calculateDailyFatBurn, getDayKeyFromDate } from '../lib/calculations';
import { useAuth } from './AuthContext';
import { loadUserDataFromFirestore, saveUserDataToFirestore } from '../lib/firebase';

interface PlanContextType {
  state: AppState;
  metrics: BodyMetrics | null;
  plan: DietPlan | null;
  logs: Record<string, DailyLog>;
  streak: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  saveMetrics: (metrics: BodyMetrics) => Promise<void>;
  savePlan: (plan: DietPlan) => Promise<void>;
  updateDailyLog: (logData: Partial<DailyLog> & { date: string }) => Promise<DailyLog>;
  quickLogCalories: (date: string, calories: number, weight?: number | null, notes?: string) => Promise<DailyLog>;
  toggleDayCompletion: (date: string) => Promise<boolean>;
  loadSampleDemoData: () => void;
  resetAllData: () => void;
  syncWithCloud: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const local = loadLocalAppState();
    // Якщо повністю порожньо, завантажимо початкові демо-дані для зручності
    if (!local.metrics) {
      return getSampleInitialState();
    }
    return local;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Синхронізація з LocalStorage при зміні стану
  useEffect(() => {
    saveLocalAppState(state);
  }, [state]);

  // Завантаження даних з Firestore при вході користувача через Google
  useEffect(() => {
    let isMounted = true;
    async function loadCloud() {
      if (!user) return;
      setIsSyncing(true);
      try {
        const cloudData = await loadUserDataFromFirestore(user.uid);
        if (cloudData && isMounted) {
          setState((prev) => {
            const mergedLogs = { ...prev.logs, ...(cloudData.logs || {}) };
            const streak = calculateActiveStreak(mergedLogs);
            return {
              ...prev,
              metrics: cloudData.metrics || prev.metrics,
              plan: cloudData.plan || prev.plan,
              logs: mergedLogs,
              streak,
            };
          });
          setLastSyncedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
        } else if (isMounted) {
          // Якщо в хмарі ще немає даних, зберігаємо поточні локальні дані в хмару
          await saveUserDataToFirestore(user.uid, state);
          setLastSyncedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Error syncing with cloud:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    loadCloud();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Хмарне збереження помічника
  const persistState = useCallback(async (newState: AppState) => {
    setState(newState);
    if (user) {
      try {
        setIsSyncing(true);
        await saveUserDataToFirestore(user.uid, newState);
        setLastSyncedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Failed to sync to Firestore', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [user]);

  const saveMetrics = async (newMetrics: BodyMetrics) => {
    const newState: AppState = {
      ...state,
      metrics: newMetrics,
    };
    await persistState(newState);
  };

  const savePlan = async (newPlan: DietPlan) => {
    const newState: AppState = {
      ...state,
      plan: newPlan,
    };
    await persistState(newState);
  };

  const updateDailyLog = async (logData: Partial<DailyLog> & { date: string }): Promise<DailyLog> => {
    const date = logData.date;
    const existingLog = state.logs[date];
    const dayKey = getDayKeyFromDate(date);
    const targetCalories = state.plan ? state.plan.dayCalories[dayKey] : 2000;
    const tdee = state.metrics ? state.metrics.tdee : 2300;

    const caloriesConsumed = logData.caloriesConsumed !== undefined ? logData.caloriesConsumed : (existingLog?.caloriesConsumed ?? 0);
    const activeCalories = (logData.activeCaloriesBurned !== undefined && logData.activeCaloriesBurned !== null) ? logData.activeCaloriesBurned : (existingLog?.activeCaloriesBurned ?? 0);
    const fatCalc = calculateDailyFatBurn(tdee, caloriesConsumed, Number(activeCalories) || 0);

    const mergedLog: DailyLog = {
      date,
      completed: logData.completed !== undefined ? logData.completed : (existingLog?.completed ?? false),
      caloriesConsumed,
      targetCalories: logData.targetCalories ?? existingLog?.targetCalories ?? targetCalories,
      weight: logData.weight !== undefined ? logData.weight : (existingLog?.weight ?? null),
      steps: logData.steps !== undefined ? logData.steps : (existingLog?.steps ?? null),
      activeCaloriesBurned: activeCalories,
      waterMl: logData.waterMl !== undefined ? logData.waterMl : (existingLog?.waterMl ?? null),
      workoutDone: logData.workoutDone !== undefined ? logData.workoutDone : (existingLog?.workoutDone ?? false),
      notes: logData.notes !== undefined ? logData.notes : (existingLog?.notes ?? ''),
      netDeficitKcal: fatCalc.netDeficit,
      estimatedFatBurnedGrams: fatCalc.fatGramsBurned,
      completedAt: logData.completed ? (existingLog?.completedAt || new Date().toISOString()) : undefined,
    };

    const newLogs = {
      ...state.logs,
      [date]: mergedLog,
    };

    const newStreak = calculateActiveStreak(newLogs);

    const newState: AppState = {
      ...state,
      logs: newLogs,
      streak: newStreak,
    };

    await persistState(newState);
    return mergedLog;
  };

  const quickLogCalories = async (date: string, calories: number, weight?: number | null, notes?: string) => {
    return updateDailyLog({
      date,
      caloriesConsumed: calories,
      weight: weight,
      notes: notes,
    });
  };

  const toggleDayCompletion = async (date: string): Promise<boolean> => {
    const existing = state.logs[date];
    const newStatus = !existing?.completed;

    if (newStatus) {
      // Ефект конфеті при успішному закритті дня!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
        });
      } catch (e) {
        // ignore
      }
    }

    await updateDailyLog({
      date,
      completed: newStatus,
    });

    return newStatus;
  };

  const loadSampleDemoData = () => {
    const sample = getSampleInitialState();
    persistState(sample);
  };

  const resetAllData = () => {
    persistState(DEFAULT_INITIAL_STATE);
  };

  const syncWithCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await saveUserDataToFirestore(user.uid, state);
      setLastSyncedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PlanContext.Provider
      value={{
        state,
        metrics: state.metrics,
        plan: state.plan,
        logs: state.logs,
        streak: state.streak,
        isSyncing,
        lastSyncedAt,
        saveMetrics,
        savePlan,
        updateDailyLog,
        quickLogCalories,
        toggleDayCompletion,
        loadSampleDemoData,
        resetAllData,
        syncWithCloud,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
};
