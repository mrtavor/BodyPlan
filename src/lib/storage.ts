import { AppState, BodyMetrics, DailyLog, DietPlan, FirebaseCustomConfig } from '../types';

const STORAGE_KEY = 'bodyplan_app_state_v2'; // v2 ensures fresh clean start

export const DEFAULT_INITIAL_STATE: AppState = {
  metrics: null,
  plan: null,
  logs: {},
  streak: 0,
  customFirebaseConfig: null,
};

export function loadLocalAppState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_INITIAL_STATE,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Failed to load local state:', err);
  }
  return DEFAULT_INITIAL_STATE;
}

export function saveLocalAppState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save local state:', err);
  }
}

/**
 * Підрахунок фактичного поточного стрику пройдених днів
 */
export function calculateActiveStreak(logs: Record<string, DailyLog>): number {
  if (!logs || Object.keys(logs).length === 0) return 0;

  const dates = Object.keys(logs)
    .filter((d) => logs[d]?.completed)
    .sort()
    .reverse();

  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Стрик дійсний, якщо завершено сьогодні або вчора
  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(dates[0]);

  for (const dStr of dates) {
    const expectedStr = checkDate.toISOString().split('T')[0];
    if (dStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
