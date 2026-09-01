import { AppState, BodyMetrics, DailyLog, DietPlan, FirebaseCustomConfig } from '../types';
import { calculateDailyFatBurn, computeFullBodyMetrics, generateDietPlan, getDayKeyFromDate } from './calculations';

const STORAGE_KEY = 'bodyplan_app_state_v1';

export const DEFAULT_INITIAL_STATE: AppState = {
  metrics: null,
  plan: null,
  logs: {},
  streak: 0,
  customFirebaseConfig: null,
};

// Створення демо-даних за замовчуванням для першого старту, якщо користувач хоче одразу протестувати
export function getSampleInitialState(): AppState {
  const defaultRoutine = {
    deskJob: true,
    dailyStepsTarget: 8000,
    workoutsPerWeek: 3,
    workoutType: 'mixed' as const,
    workoutDurationMins: 45,
    intensity: 'moderate' as const,
  };

  const sampleMetrics = computeFullBodyMetrics(
    'male',
    28,
    178,
    84,
    39,
    92,
    0,
    null,
    defaultRoutine
  );

  const samplePlan = generateDietPlan(
    sampleMetrics,
    'fat_loss_keep_muscle',
    76,
    10,
    'weekend_refeed',
    20
  );

  // Створимо пару тестових записів за попередні 2 дні
  const today = new Date();
  const logs: Record<string, DailyLog> = {};

  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayKey = getDayKeyFromDate(dateStr);
    const targetCal = samplePlan.dayCalories[dayKey];
    
    // Трохи реалістичних випадкових значень
    const consumed = i === 0 ? 0 : targetCal - (i % 2 === 0 ? 100 : -80);
    const fatCalc = calculateDailyFatBurn(sampleMetrics.tdee, consumed, 250);

    logs[dateStr] = {
      date: dateStr,
      completed: i > 0,
      caloriesConsumed: consumed,
      targetCalories: targetCal,
      weight: 84 - (4 - i) * 0.25,
      steps: 8500 + i * 300,
      activeCaloriesBurned: 250,
      waterMl: 2500,
      workoutDone: i % 2 === 1,
      notes: i === 0 ? 'Сьогоднішній день' : 'Чудове самопочуття, тренування виконано',
      netDeficitKcal: i > 0 ? fatCalc.netDeficit : 0,
      estimatedFatBurnedGrams: i > 0 ? fatCalc.fatGramsBurned : 0,
    };
  }

  return {
    metrics: sampleMetrics,
    plan: samplePlan,
    logs,
    streak: 4,
    customFirebaseConfig: null,
  };
}

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
 * Підрахунок поточного стрику пройдених днів
 */
export function calculateActiveStreak(logs: Record<string, DailyLog>): number {
  const dates = Object.keys(logs)
    .filter((d) => logs[d]?.completed)
    .sort()
    .reverse();

  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Стрик дійсний, якщо закритий сьогодні або вчора
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
