import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Target,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  ChevronRight,
  Info,
  Layers,
  Flame,
  Droplet,
  Dumbbell,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { CalorieCyclingMode, DayCaloriesMap, GoalType } from '../../types';
import { generateDietPlan, getDayNameUk } from '../../lib/calculations';

interface DietPlannerProps {
  onGoToTracker?: () => void;
}

export const DietPlanner: React.FC<DietPlannerProps> = ({ onGoToTracker }) => {
  const { metrics, plan, savePlan } = usePlan();

  // If metrics not set yet, fallback
  const startWeight = metrics?.weight || 80;

  const [goal, setGoal] = useState<GoalType>(plan?.goal || 'fat_loss_keep_muscle');
  const [targetWeight, setTargetWeight] = useState<number>(plan?.targetWeight || Math.round((startWeight - 6) * 10) / 10);
  const [timeframeWeeks, setTimeframeWeeks] = useState<number>(plan?.timeframeWeeks || 10);
  const [cyclingMode, setCyclingMode] = useState<CalorieCyclingMode>(plan?.cyclingMode || 'weekend_refeed');
  const [weekendIncreasePercent, setWeekendIncreasePercent] = useState<number>(plan?.weekendIncreasePercent || 20);

  const [customDays, setCustomDays] = useState<DayCaloriesMap>(
    plan?.dayCalories || {
      monday: 1850,
      tuesday: 1850,
      wednesday: 1850,
      thursday: 1850,
      friday: 2250,
      saturday: 2250,
      sunday: 2250,
    }
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Generate live plan
  const livePlan = metrics
    ? generateDietPlan(
        metrics,
        goal,
        targetWeight,
        timeframeWeeks,
        cyclingMode,
        weekendIncreasePercent,
        cyclingMode === 'custom' ? customDays : undefined
      )
    : null;

  const handleGoalChange = (newGoal: GoalType) => {
    setGoal(newGoal);
    if (newGoal.startsWith('fat_loss') && targetWeight >= startWeight) {
      setTargetWeight(Math.round((startWeight - 5) * 10) / 10);
    } else if (newGoal.startsWith('muscle_gain') && targetWeight <= startWeight) {
      setTargetWeight(Math.round((startWeight + 4) * 10) / 10);
    } else if (newGoal === 'maintenance') {
      setTargetWeight(startWeight);
    }
  };

  const handleCustomDayChange = (day: keyof DayCaloriesMap, value: number) => {
    setCustomDays((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  const handleSave = async () => {
    if (livePlan) {
      await savePlan(livePlan);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      if (onGoToTracker) {
        onGoToTracker();
      }
    }
  };

  if (!metrics) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 space-y-4">
        <p className="text-slate-300">Спочатку заповніть параметри вашого тіла у калькуляторі.</p>
      </div>
    );
  }

  const daysOrder: (keyof DayCaloriesMap)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            Гнучкий планувальник калорійного циклування
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            План дієти, цілі та розподіл по днях
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2">
            Налаштуйте цільову вагу, термін досягнення та гнучкість раціону: їжте більше калорій на вихідних (для зустрічей чи чітмілу) або дотримуйтесь рівномірного режиму.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Settings: Goals & Timeframe */}
        <div className="lg:col-span-7 space-y-6">
          {/* Goal Selector */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-100 font-bold text-base">
              <Target className="w-5 h-5 text-emerald-400" />
              <span>1. Оберіть вашу головну мету</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Fat loss keep muscle */}
              <button
                type="button"
                onClick={() => handleGoalChange('fat_loss_keep_muscle')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  goal === 'fat_loss_keep_muscle'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">
                      Схуднення зі збереженням м'язів (Рекомендовано)
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                      High Protein
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Помірний дефіцит + підвищена норма білка (2.2+ г/кг) для спалювання чистого жиру без руйнування м'язового каркасу.
                  </p>
                </div>
              </button>

              {/* Standard fat loss */}
              <button
                type="button"
                onClick={() => handleGoalChange('fat_loss_standard')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  goal === 'fat_loss_standard'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 mt-0.5">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-100 text-sm">Звичайне / динамічне схуднення</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Класичний баланс дефіциту та стандартний рівень білка (1.8 г/кг) для плавного зниження ваги.
                  </p>
                </div>
              </button>

              {/* Maintenance */}
              <button
                type="button"
                onClick={() => handleGoalChange('maintenance')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  goal === 'maintenance'
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-100 text-sm">Підтримка ваги та рекомпозиція</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Споживання на рівні 100% TDEE (нульовий дефіцит), поліпшення якості тіла та збереження форми.
                  </p>
                </div>
              </button>

              {/* Lean muscle gain */}
              <button
                type="button"
                onClick={() => handleGoalChange('muscle_gain_lean')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  goal === 'muscle_gain_lean'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-100 text-sm">Чистий набір сухої м'язової маси</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Невеликий профіцит (+200..300 ккал/день) для максимального росту м'язів при мінімальному наборі жиру.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Target Weight & Timeframe Inputs */}
          {goal !== 'maintenance' && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-100 font-bold text-base">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>2. Цільова вага та бажані терміни</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Target Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Бажана цільова вага (кг)</label>
                    <span className="text-[11px] text-slate-400">Зараз: {startWeight} кг</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="35"
                      max="200"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500">кг</span>
                  </div>
                </div>

                {/* Timeframe in Weeks */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Термін на досягнення (тижнів)</label>
                    <span className="text-[11px] text-indigo-400 font-bold">
                      {timeframeWeeks} {timeframeWeeks === 1 ? 'тиждень' : timeframeWeeks <= 4 ? 'тижні' : 'тижнів'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="2"
                      max="52"
                      value={timeframeWeeks}
                      onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500">тижн.</span>
                  </div>
                </div>
              </div>

              {/* Feasibility Feedback Box */}
              {livePlan && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    livePlan.isAggressive
                      ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                      : livePlan.isTooSlow
                      ? 'bg-amber-950/30 border-amber-600/40 text-amber-200'
                      : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                  }`}
                >
                  <p className="font-semibold">{livePlan.feasibilityFeedback}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[11px] text-slate-300">
                    <span>
                      Темп: <strong className="text-white">{Math.abs(livePlan.weeklyPaceKg)} кг/тиждень</strong>
                    </span>
                    <span>
                      Різниця у вазі: <strong className="text-white">{livePlan.totalWeightDiffKg > 0 ? `+${livePlan.totalWeightDiffKg}` : livePlan.totalWeightDiffKg} кг</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Calorie Cycling Configuration */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-base">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>3. Розподіл калорій (Циклування будні / вихідні)</span>
              </div>
            </div>

            {/* Cycling Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCyclingMode('weekend_refeed')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  cyclingMode === 'weekend_refeed'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'
                }`}
              >
                🍕 Більше на вихідних (+{weekendIncreasePercent}%)
              </button>

              <button
                type="button"
                onClick={() => setCyclingMode('even')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  cyclingMode === 'even'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'
                }`}
              >
                🥗 Рівномірно всі дні
              </button>

              <button
                type="button"
                onClick={() => setCyclingMode('custom')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  cyclingMode === 'custom'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'
                }`}
              >
                ⚙️ Ручне налаштування
              </button>
            </div>

            {/* If Weekend Refeed: Slider for Weekend Increase */}
            {cyclingMode === 'weekend_refeed' && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Збільшення калоражу на вихідних (Пт, Сб, Нд):</span>
                  <span className="text-amber-400 font-bold">+{weekendIncreasePercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={weekendIncreasePercent}
                  onChange={(e) => setWeekendIncreasePercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[11px] text-slate-400">
                  У будні (Пн-Чт) калорії відповідно автоматично зменшуються, щоб загальний тижневий дефіцит залишився 100% точним!
                </p>
              </div>
            )}

            {/* Days Calorie Table Preview */}
            {livePlan && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">Норма калорій по днях тижня:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {daysOrder.map((day) => {
                    const isWeekend = day === 'friday' || day === 'saturday' || day === 'sunday';
                    const dayCal = livePlan.dayCalories[day];
                    return (
                      <div
                        key={day}
                        className={`p-2.5 rounded-xl border text-center ${
                          isWeekend
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200'
                        }`}
                      >
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{getDayNameUk(day).slice(0, 3)}</p>
                        {cyclingMode === 'custom' ? (
                          <input
                            type="number"
                            step="50"
                            value={customDays[day]}
                            onChange={(e) => handleCustomDayChange(day, Number(e.target.value))}
                            className="w-full text-center bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs font-bold mt-1 text-white"
                          />
                        ) : (
                          <p className="text-sm font-extrabold mt-0.5">{dayCal}</p>
                        )}
                        <span className="text-[9px] text-slate-500">ккал</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary: Plan Summary & Macros */}
        <div className="lg:col-span-5 space-y-6">
          {livePlan && (
            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 sticky top-20 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Ваш розрахований план</span>
                </div>
              </div>

              {/* Target Average Calories */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-medium">Середньодобова ціль калорій</p>
                <div className="flex items-baseline justify-center gap-1 my-1">
                  <span className="text-4xl font-black text-emerald-400">
                    {livePlan.averageDailyTargetKcal}
                  </span>
                  <span className="text-xs text-slate-400">ккал/день</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {livePlan.dailyDeficitSurplusKcal < 0
                    ? `Дефіцит: ${livePlan.dailyDeficitSurplusKcal} ккал/день (TDEE: ${metrics.tdee})`
                    : livePlan.dailyDeficitSurplusKcal > 0
                    ? `Профіцит: +${livePlan.dailyDeficitSurplusKcal} ккал/день (TDEE: ${metrics.tdee})`
                    : `Рівень підтримки: 0 ккал дефіциту`}
                </p>
              </div>

              {/* Macros Breakdown (БЖУ) */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Рекомендовані макронутрієнти (БЖУ)
                </p>

                {/* Protein */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      Б
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-200">Білок (Protein)</p>
                      <p className="text-[10px] text-slate-400">{livePlan.macros.proteinGPerKg} г/кг маси тіла</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-300">{livePlan.macros.proteinGrams}г</span>
                    <p className="text-[10px] text-slate-400">~{livePlan.macros.proteinGrams * 4} ккал</p>
                  </div>
                </div>

                {/* Fat */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      Ж
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-200">Жири (Fats)</p>
                      <p className="text-[10px] text-slate-400">{livePlan.macros.fatGPerKg} г/кг (гормональне здоров'я)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-amber-300">{livePlan.macros.fatGrams}г</span>
                    <p className="text-[10px] text-slate-400">~{livePlan.macros.fatGrams * 9} ккал</p>
                  </div>
                </div>

                {/* Carbs */}
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      В
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-200">Вуглеводи (Carbs)</p>
                      <p className="text-[10px] text-slate-400">Енергія для тренувань та мозку</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-indigo-300">{livePlan.macros.carbsGrams}г</span>
                    <p className="text-[10px] text-slate-400">~{livePlan.macros.carbsGrams * 4} ккал</p>
                  </div>
                </div>
              </div>

              {/* Water & Fiber */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Вода</p>
                    <p className="text-xs font-extrabold text-slate-200">{livePlan.macros.waterLiters} л/день</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Клітковина</p>
                    <p className="text-xs font-extrabold text-slate-200">{livePlan.macros.fiberGrams} г/день</p>
                  </div>
                </div>
              </div>

              {/* Save Plan Button */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.99]"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-slate-950" />
                    <span>План збережено!</span>
                  </>
                ) : (
                  <>
                    <span>Зберегти план і відкрити Щоденник</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
