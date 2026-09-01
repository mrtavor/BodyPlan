import {
  BodyMetrics,
  DailyRoutine,
  DayCaloriesMap,
  DietPlan,
  Gender,
  GoalType,
  MacrosPlan,
} from '../types';

/**
 * Розрахунок відсотка жиру за офіційною формулою ВМС США (US Navy Body Fat Formula).
 * Параметри замірів передаються в сантиметрах.
 */
export function calculateNavyBodyFat(
  gender: Gender,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm: number = 0
): number {
  if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0) return 18;

  let bodyFat = 18;

  if (gender === 'male') {
    const diff = waistCm - neckCm;
    if (diff > 0) {
      // Men: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
      const logDiff = Math.log10(diff);
      const logHeight = Math.log10(heightCm);
      const denominator = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight;
      if (denominator > 0) {
        bodyFat = 495 / denominator - 450;
      }
    }
  } else {
    // Women: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const effectiveHip = hipCm > 0 ? hipCm : waistCm * 1.15;
    const sum = waistCm + effectiveHip - neckCm;
    if (sum > 0) {
      const logSum = Math.log10(sum);
      const logHeight = Math.log10(heightCm);
      const denominator = 1.29579 - 0.35004 * logSum + 0.221 * logHeight;
      if (denominator > 0) {
        bodyFat = 495 / denominator - 450;
      }
    }
  }

  // Обмеження реалістичного діапазону (3% - 60%)
  return Math.min(Math.max(Math.round(bodyFat * 10) / 10, 3.5), 60);
}

/**
 * Розрахунок BMR (Базального рівня метаболізму)
 * Використовує формулу Кетча-МакАрдла (якщо відомий % жиру) або Міффліна-Сан Жеора
 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  bodyFatPercent?: number
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1600;

  if (bodyFatPercent && bodyFatPercent > 0) {
    // Katch-McArdle (найточніша при відомому % жиру)
    const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
    return Math.round(370 + 21.6 * leanMassKg);
  }

  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * Розрахунок множника активності на основі розпорядку дня та тренувань
 */
export function calculateActivityMultiplier(routine: DailyRoutine): number {
  let multiplier = 1.2; // Сидячий базовий

  // Вплив кроків
  if (routine.dailyStepsTarget >= 14000) multiplier += 0.25;
  else if (routine.dailyStepsTarget >= 10000) multiplier += 0.18;
  else if (routine.dailyStepsTarget >= 7000) multiplier += 0.10;
  else if (routine.dailyStepsTarget >= 5000) multiplier += 0.05;

  // Якщо робота не сидяча (на ногах / рухлива)
  if (!routine.deskJob) {
    multiplier += 0.12;
  }

  // Вплив тренувань на тиждень
  const workouts = routine.workoutsPerWeek;
  if (workouts >= 6) multiplier += 0.28;
  else if (workouts >= 4) multiplier += 0.20;
  else if (workouts >= 2) multiplier += 0.12;
  else if (workouts >= 1) multiplier += 0.06;

  // Коригування на інтенсивність
  if (routine.intensity === 'high') multiplier += 0.05;
  if (routine.intensity === 'low') multiplier -= 0.03;

  return Math.min(Math.max(Math.round(multiplier * 100) / 100, 1.15), 2.1);
}

/**
 * Розрахунок повної біометрії
 */
export function computeFullBodyMetrics(
  gender: Gender,
  age: number,
  heightCm: number,
  weightKg: number,
  neckCm: number,
  waistCm: number,
  hipCm: number,
  customBodyFat: number | null | undefined,
  dailyRoutine: DailyRoutine
): BodyMetrics {
  const calculatedFat = calculateNavyBodyFat(gender, heightCm, neckCm, waistCm, hipCm);
  const finalFatPercent = (customBodyFat && customBodyFat > 0) ? customBodyFat : calculatedFat;

  const fatMassKg = Math.round((weightKg * (finalFatPercent / 100)) * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;
  const bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;

  const bmr = calculateBMR(gender, weightKg, heightCm, age, finalFatPercent);
  const actMultiplier = calculateActivityMultiplier(dailyRoutine);
  const tdee = Math.round(bmr * actMultiplier);

  return {
    gender,
    age,
    height: heightCm,
    weight: weightKg,
    neck: neckCm,
    waist: waistCm,
    hip: hipCm,
    customBodyFat: customBodyFat || null,
    bodyFatPercent: finalFatPercent,
    fatMassKg,
    leanMassKg,
    bmi,
    bmr,
    tdee,
    dailyRoutine,
  };
}

/**
 * Аналіз реалістичності та генерація плану дієти з калорійним циклуванням
 */
export function generateDietPlan(
  metrics: BodyMetrics,
  goal: GoalType,
  targetWeight: number,
  timeframeWeeks: number,
  cyclingMode: 'even' | 'weekend_refeed' | 'custom' = 'weekend_refeed',
  weekendIncreasePercent: number = 20,
  customDayCalories?: DayCaloriesMap
): DietPlan {
  const startWeight = metrics.weight;
  const totalWeightDiffKg = targetWeight - startWeight;
  const totalDays = Math.max(timeframeWeeks * 7, 7);
  const weeklyPaceKg = Math.round((totalWeightDiffKg / timeframeWeeks) * 100) / 100;

  // Рекомендований безпечний темп (0.5% - 1% ваги на тиждень при схудненні, 0.25-0.5% при наборі)
  const isLoss = goal.startsWith('fat_loss');
  const isGain = goal.startsWith('muscle_gain');

  let recommendedPaceMinKg = 0;
  let recommendedPaceMaxKg = 0;
  let isAggressive = false;
  let isTooSlow = false;
  let feasibilityFeedback = '';

  if (isLoss) {
    recommendedPaceMinKg = -Math.round((startWeight * 0.005) * 100) / 100; // -0.5%/тиждень
    recommendedPaceMaxKg = -Math.round((startWeight * 0.010) * 100) / 100; // -1.0%/тиждень

    if (weeklyPaceKg < recommendedPaceMaxKg * 1.3) {
      isAggressive = true;
      feasibilityFeedback = `⚠️ Увага: бажаний темп (${Math.abs(weeklyPaceKg)} кг/тижд) занадто агресивний. Це може призвести до втрати м'язів та втоми. Рекомендований здоровий темп: від ${Math.abs(recommendedPaceMinKg)} до ${Math.abs(recommendedPaceMaxKg)} кг/тиждень.`;
    } else if (weeklyPaceKg > recommendedPaceMinKg * 0.4 && totalWeightDiffKg < 0) {
      isTooSlow = true;
      feasibilityFeedback = `ℹ️ Обраний темп дуже плавний (${Math.abs(weeklyPaceKg)} кг/тижд). Це комфортно, проте досягнення цілі триватиме довше.`;
    } else {
      feasibilityFeedback = `✅ Відмінний вибір! Темп ${Math.abs(weeklyPaceKg)} кг/тиждень є безпечним, зберігає метаболізм і м'язову тканину.`;
    }
  } else if (isGain) {
    recommendedPaceMinKg = Math.round((startWeight * 0.002) * 100) / 100;
    recommendedPaceMaxKg = Math.round((startWeight * 0.005) * 100) / 100;

    if (weeklyPaceKg > recommendedPaceMaxKg * 1.5) {
      isAggressive = true;
      feasibilityFeedback = `⚠️ Темп набору (${weeklyPaceKg} кг/тижд) зависокий. Значна частина набраної маси може бути жиром, а не м'язами. Рекомендовано: +${recommendedPaceMinKg}..+${recommendedPaceMaxKg} кг/тиждень.`;
    } else {
      feasibilityFeedback = `✅ Оптимальний темп якісного набору сухої м'язової маси (+${weeklyPaceKg} кг/тиждень).`;
    }
  } else {
    feasibilityFeedback = `✅ План підтримки поточної ваги та рекомпозиції тіла (зменшення жиру / підтяжка м'язів).`;
  }

  // 1 кг жирової тканини ~ 7700 ккал
  let dailyDeficitSurplusKcal = 0;
  if (goal === 'maintenance') {
    dailyDeficitSurplusKcal = 0;
  } else {
    // Розрахунок дефіциту/профіциту відносно бажаного терміну
    dailyDeficitSurplusKcal = Math.round((totalWeightDiffKg * 7700) / totalDays);
    
    // Обмеження: не більше 1000 ккал дефіциту та не нижче BMR - 150 ккал
    if (isLoss) {
      const maxSafeDeficit = Math.min(850, Math.max(300, metrics.tdee - metrics.bmr));
      dailyDeficitSurplusKcal = Math.max(dailyDeficitSurplusKcal, -maxSafeDeficit);
    } else if (isGain) {
      dailyDeficitSurplusKcal = Math.min(Math.max(dailyDeficitSurplusKcal, 150), 550);
    }
  }

  const averageDailyTargetKcal = Math.max(metrics.tdee + dailyDeficitSurplusKcal, 1200);

  // Розрахунок розподілу калорій по днях тижня (Calorie Cycling)
  let dayCalories: DayCaloriesMap;

  if (cyclingMode === 'custom' && customDayCalories) {
    dayCalories = customDayCalories;
  } else if (cyclingMode === 'weekend_refeed' && (isLoss || goal === 'fat_loss_keep_muscle')) {
    // 4 дні (Пн-Чт) нижчі калорії, 3 дні (Пт-Нд) вищі калорії (+weekendIncreasePercent%)
    const alpha = weekendIncreasePercent / 100;
    // 4 * low + 3 * (low * (1 + alpha)) = 7 * avg
    const weekdayCal = Math.round((7 * averageDailyTargetKcal) / (4 + 3 * (1 + alpha)));
    const weekendCal = Math.round(weekdayCal * (1 + alpha));

    dayCalories = {
      monday: weekdayCal,
      tuesday: weekdayCal,
      wednesday: weekdayCal,
      thursday: weekdayCal,
      friday: weekendCal,
      saturday: weekendCal,
      sunday: weekendCal,
    };
  } else {
    // Рівномірний розподіл
    dayCalories = {
      monday: averageDailyTargetKcal,
      tuesday: averageDailyTargetKcal,
      wednesday: averageDailyTargetKcal,
      thursday: averageDailyTargetKcal,
      friday: averageDailyTargetKcal,
      saturday: averageDailyTargetKcal,
      sunday: averageDailyTargetKcal,
    };
  }

  // Розрахунок макронутрієнтів (БЖУ)
  const macros = calculateMacros(metrics, goal, averageDailyTargetKcal);

  const startDate = new Date().toISOString().split('T')[0];
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + timeframeWeeks * 7);
  const targetDate = targetDateObj.toISOString().split('T')[0];

  return {
    goal,
    startWeight,
    targetWeight,
    timeframeWeeks,
    startDate,
    targetDate,
    totalWeightDiffKg,
    weeklyPaceKg,
    recommendedPaceMinKg,
    recommendedPaceMaxKg,
    isAggressive,
    isTooSlow,
    feasibilityFeedback,
    dailyDeficitSurplusKcal,
    averageDailyTargetKcal,
    cyclingMode,
    dayCalories,
    weekendIncreasePercent,
    macros,
  };
}

/**
 * Розрахунок макросів (БЖУ, клітковина, вода)
 */
export function calculateMacros(
  metrics: BodyMetrics,
  goal: GoalType,
  targetKcal: number
): MacrosPlan {
  const weight = metrics.weight;
  const leanMass = metrics.leanMassKg > 0 ? metrics.leanMassKg : weight * 0.75;

  let proteinGPerKg = 1.8;
  let fatGPerKg = 0.9;

  switch (goal) {
    case 'fat_loss_keep_muscle':
      // Максимальний захист м'язів при дефіциті: 2.2 - 2.4 г на кг ваги або 2.5 г/кг сухої маси
      proteinGPerKg = Math.min(2.3, Math.round((leanMass * 2.5) / weight * 10) / 10);
      fatGPerKg = 0.85;
      break;
    case 'fat_loss_standard':
      proteinGPerKg = 1.8;
      fatGPerKg = 0.8;
      break;
    case 'maintenance':
      proteinGPerKg = 1.7;
      fatGPerKg = 0.9;
      break;
    case 'muscle_gain_lean':
      proteinGPerKg = 2.0;
      fatGPerKg = 1.0;
      break;
    case 'muscle_gain_bulk':
      proteinGPerKg = 1.8;
      fatGPerKg = 1.1;
      break;
  }

  const proteinGrams = Math.round(weight * proteinGPerKg);
  const fatGrams = Math.round(weight * fatGPerKg);

  const proteinKcal = proteinGrams * 4;
  const fatKcal = fatGrams * 9;
  const remainingKcal = Math.max(targetKcal - proteinKcal - fatKcal, 200);
  const carbsGrams = Math.round(remainingKcal / 4);

  // Клітковина: ~14г на кожні 1000 ккал
  const fiberGrams = Math.max(Math.round((targetKcal / 1000) * 14), 25);

  // Вода: 35 мл на 1 кг ваги + 500 мл якщо є тренування
  const waterLiters = Math.round(((weight * 35 + 500) / 1000) * 10) / 10;

  return {
    proteinGrams,
    proteinGPerKg,
    fatGrams,
    fatGPerKg,
    carbsGrams,
    fiberGrams,
    waterLiters,
  };
}

/**
 * Розрахунок дефіциту та спаленого жиру за день
 */
export function calculateDailyFatBurn(
  tdee: number,
  caloriesConsumed: number,
  activeCaloriesBurned: number = 0
): { netDeficit: number; fatGramsBurned: number } {
  const totalBurned = tdee + (activeCaloriesBurned || 0);
  const netDeficit = totalBurned - caloriesConsumed;
  
  // 1 г чистого жиру = ~7.7 ккал
  const fatGramsBurned = Math.round((netDeficit / 7.7) * 10) / 10;

  return {
    netDeficit,
    fatGramsBurned,
  };
}

/**
 * Отримання назви дня тижня англійською для мапінгу
 */
export function getDayKeyFromDate(dateStr: string): keyof DayCaloriesMap {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  switch (day) {
    case 1: return 'monday';
    case 2: return 'tuesday';
    case 3: return 'wednesday';
    case 4: return 'thursday';
    case 5: return 'friday';
    case 6: return 'saturday';
    case 0: return 'sunday';
    default: return 'monday';
  }
}

/**
 * Назва дня тижня українською
 */
export function getDayNameUk(dayKey: keyof DayCaloriesMap): string {
  const names: Record<keyof DayCaloriesMap, string> = {
    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: "П'ятниця",
    saturday: 'Субота',
    sunday: 'Неділя',
  };
  return names[dayKey];
}
