export type Gender = 'male' | 'female';

export type GoalType = 
  | 'fat_loss_keep_muscle'    // Схуднення зі збереженням м'язів (Високий білок + помірний дефіцит)
  | 'fat_loss_standard'       // Звичайне/динамічне схуднення
  | 'maintenance'             // Підтримка поточної ваги та рекомпозиція
  | 'muscle_gain_lean'        // Чистий набір сухої м'язової маси (+200..300 ккал)
  | 'muscle_gain_bulk';       // Силовий набір маси (+400..600 ккал)

export type CalorieCyclingMode = 'even' | 'weekend_refeed' | 'custom';

export type WorkoutType = 'strength' | 'cardio' | 'mixed' | 'none';
export type IntensityLevel = 'low' | 'moderate' | 'high';

export interface DailyRoutine {
  deskJob: boolean;
  dailyStepsTarget: number;
  workoutsPerWeek: number;
  workoutType: WorkoutType;
  workoutDurationMins: number;
  intensity: IntensityLevel;
  notes?: string;
}

export interface BodyMetrics {
  gender: Gender;
  age: number;
  height: number;      // cm
  weight: number;      // kg
  neck: number;        // cm
  waist: number;       // cm
  hip: number;         // cm (used for females)
  customBodyFat?: number | null; // Optional override if user has DEXA/caliper
  
  // Computed values
  bodyFatPercent: number;   // %
  fatMassKg: number;        // kg
  leanMassKg: number;       // kg
  bmi: number;
  bmr: number;              // Basal Metabolic Rate (kcal)
  tdee: number;             // Total Daily Energy Expenditure (kcal)
  dailyRoutine: DailyRoutine;
}

export interface DayCaloriesMap {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface MacrosPlan {
  proteinGrams: number;
  proteinGPerKg: number;
  fatGrams: number;
  fatGPerKg: number;
  carbsGrams: number;
  fiberGrams: number;
  waterLiters: number;
}

export interface DietPlan {
  goal: GoalType;
  startWeight: number;
  targetWeight: number;
  timeframeWeeks: number;
  startDate: string;        // YYYY-MM-DD
  targetDate: string;       // YYYY-MM-DD
  
  // Pace & Feasibility analysis
  totalWeightDiffKg: number;
  weeklyPaceKg: number;
  recommendedPaceMinKg: number;
  recommendedPaceMaxKg: number;
  isAggressive: boolean;
  isTooSlow: boolean;
  feasibilityFeedback: string;
  
  // Calorie & Macro distribution
  dailyDeficitSurplusKcal: number; // e.g. -500 or +300
  averageDailyTargetKcal: number;
  cyclingMode: CalorieCyclingMode;
  dayCalories: DayCaloriesMap;
  weekendIncreasePercent: number; // e.g. 20% more on Fri/Sat/Sun
  macros: MacrosPlan;
}

export interface DailyLog {
  date: string;            // "YYYY-MM-DD"
  completed: boolean;      // чи відмічено день як завершений
  caloriesConsumed: number; // фактично з'їдені калорії (з YAZIO)
  targetCalories: number;  // запланована норма на цей день
  weight?: number | null;  // вага вранці
  steps?: number | null;   // кількість кроків
  activeCaloriesBurned?: number | null; // активні спалені калорії
  waterMl?: number | null;
  workoutDone?: boolean;
  notes?: string;
  
  // Auto-calculated fields
  netDeficitKcal: number;       // TDEE - caloriesConsumed (+ activeCalories if logged)
  estimatedFatBurnedGrams: number; // netDeficitKcal / 7.7
  completedAt?: string;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppState {
  metrics: BodyMetrics | null;
  plan: DietPlan | null;
  logs: Record<string, DailyLog>; // key: "YYYY-MM-DD"
  streak: number;
  customFirebaseConfig: FirebaseCustomConfig | null;
}
