import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle,
  CheckCircle2,
  Circle,
  Scale,
  Footprints,
  Activity,
  Droplets,
  Dumbbell,
  Sparkles,
  Zap,
  TrendingDown,
  TrendingUp,
  Info,
  Clock,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { calculateDailyFatBurn, getDayKeyFromDate, getDayNameUk } from '../../lib/calculations';
import { fetchGoogleFitSummaryForDate, getSavedGoogleFitToken } from '../../lib/googleFit';

interface DailyTrackerProps {
  onOpenGoogleFitModal?: () => void;
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({ onOpenGoogleFitModal }) => {
  const { metrics, plan, logs, streak, updateDailyLog, toggleDayCompletion } = usePlan();

  // Selected date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Form local state for selected day
  const currentLog = logs[selectedDate];
  const dayKey = getDayKeyFromDate(selectedDate);
  const targetCalories = plan ? plan.dayCalories[dayKey] : 2000;
  const tdee = metrics ? metrics.tdee : 2300;

  const [calories, setCalories] = useState<number>(currentLog?.caloriesConsumed ?? 0);
  const [weight, setWeight] = useState<string>(currentLog?.weight !== null && currentLog?.weight !== undefined ? String(currentLog.weight) : '');
  const [steps, setSteps] = useState<string>(currentLog?.steps !== null && currentLog?.steps !== undefined ? String(currentLog.steps) : '');
  const [activeCal, setActiveCal] = useState<string>(currentLog?.activeCaloriesBurned !== null && currentLog?.activeCaloriesBurned !== undefined ? String(currentLog.activeCaloriesBurned) : '0');
  const [waterMl, setWaterMl] = useState<number>(currentLog?.waterMl ?? 2000);
  const [workoutDone, setWorkoutDone] = useState<boolean>(currentLog?.workoutDone ?? false);
  const [notes, setNotes] = useState<string>(currentLog?.notes ?? '');

  const [isSyncingFit, setIsSyncingFit] = useState<boolean>(false);
  const [fitMessage, setFitMessage] = useState<string | null>(null);

  // Sync state when date changes
  useEffect(() => {
    const log = logs[selectedDate];
    setCalories(log?.caloriesConsumed ?? 0);
    setWeight(log?.weight !== null && log?.weight !== undefined ? String(log.weight) : '');
    setSteps(log?.steps !== null && log?.steps !== undefined ? String(log.steps) : '');
    setActiveCal(log?.activeCaloriesBurned !== null && log?.activeCaloriesBurned !== undefined ? String(log.activeCaloriesBurned) : '0');
    setWaterMl(log?.waterMl ?? 2000);
    setWorkoutDone(log?.workoutDone ?? false);
    setNotes(log?.notes ?? '');
    setFitMessage(null);
  }, [selectedDate, logs]);

  // Live calculation of deficit and grams of fat
  const activeCaloriesNum = Number(activeCal) || 0;
  const liveFatCalc = calculateDailyFatBurn(tdee, calories, activeCaloriesNum);

  const handleSaveField = async (partial: Record<string, any>) => {
    await updateDailyLog({
      date: selectedDate,
      ...partial,
    });
  };

  const handleCaloriesChange = async (newVal: number) => {
    const valid = Math.max(0, newVal);
    setCalories(valid);
    await handleSaveField({ caloriesConsumed: valid });
  };

  const handleQuickAddCalories = async (delta: number) => {
    const newVal = Math.max(0, calories + delta);
    setCalories(newVal);
    await handleSaveField({ caloriesConsumed: newVal });
  };

  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoogleFitSync = async () => {
    const token = getSavedGoogleFitToken();
    if (!token) {
      if (onOpenGoogleFitModal) onOpenGoogleFitModal();
      return;
    }

    setIsSyncingFit(true);
    setFitMessage(null);
    try {
      const summary = await fetchGoogleFitSummaryForDate(token, selectedDate);
      if (summary.steps > 0) {
        setSteps(String(summary.steps));
      }
      if (summary.activeCalories > 0) {
        setActiveCal(String(summary.activeCalories));
      }
      await updateDailyLog({
        date: selectedDate,
        steps: summary.steps,
        activeCaloriesBurned: summary.activeCalories,
      });
      setFitMessage(`✅ Підтягнуто з Google Fit: ${summary.steps.toLocaleString()} кроків, ${summary.activeCalories} ккал активності`);
    } catch (err: any) {
      setFitMessage(`⚠️ ${err.message || 'Не вдалося завантажити дані Google Fit'}`);
    } finally {
      setIsSyncingFit(false);
    }
  };

  const isWeekendDay = dayKey === 'friday' || dayKey === 'saturday' || dayKey === 'sunday';
  const isCompleted = currentLog?.completed ?? false;

  // Format date display
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {(!metrics || !plan) && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-200">
                Ви ще не зберегли індивідуальні параметри тіла
              </p>
              <p className="text-[11px] text-indigo-300/80">
                Перейдіть у вкладку «Калькулятор тіла», щоб розрахувати вашу персональну норму та калорійний цикл.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
            title="Попередній день"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center sm:text-left min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-100 capitalize">
                {getDayNameUk(dayKey)}, {dateObj.getDate()} {dateObj.toLocaleDateString('uk-UA', { month: 'short' })}
              </span>
              {selectedDate === todayStr && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  СЬОГОДНІ
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isWeekendDay ? '🍕 Вихідний режим (підвищені калорії)' : '🥗 Будній режим (дефіцит)'}
            </p>
          </div>

          <button
            onClick={() => handleDateShift(1)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
            title="Наступний день"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Date Shortcuts & Google Fit trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
            >
              Сьогодні
            </button>
          )}

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={handleGoogleFitSync}
            disabled={isSyncingFit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-colors"
            title="Оновити кроки та активність з Google Fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFit ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Синхронізувати з Fit</span>
          </button>
        </div>
      </div>

      {fitMessage && (
        <div className="p-3 bg-slate-900/90 border border-blue-500/40 text-blue-200 text-xs rounded-xl animate-fade-in flex items-center justify-between">
          <span>{fitMessage}</span>
          <button onClick={() => setFitMessage(null)} className="text-slate-400 hover:text-white text-xs ml-2">✕</button>
        </div>
      )}

      {/* Main Tracker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Prominent Calorie Input & Day Completion */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Calorie Input Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Головний показник дня
                </span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">
                  З'їдено калорій (з YAZIO / додатку)
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">План на {getDayNameUk(dayKey)}:</span>
                <p className="text-lg font-black text-slate-200">{targetCalories} <span className="text-xs font-normal text-slate-400">ккал</span></p>
              </div>
            </div>

            {/* Huge Interactive Calorie Display & Direct Input */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800/80 text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickAddCalories(-50)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700"
                  title="-50 ккал"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="relative inline-block max-w-[240px]">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    max="10000"
                    value={calories === 0 ? '' : calories}
                    placeholder="0"
                    onChange={(e) => handleCaloriesChange(Number(e.target.value))}
                    className="w-full text-center text-4xl sm:text-5xl font-black text-white bg-transparent border-b-2 border-emerald-500/60 focus:border-emerald-400 focus:outline-none px-2 py-1 placeholder-slate-700"
                  />
                  <span className="block text-xs font-bold text-slate-400 mt-1">ккал з'їдено за день</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAddCalories(50)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700"
                  title="+50 ккал"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Adders */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <span className="text-[11px] text-slate-500 mr-1">Швидке додавання:</span>
                {[100, 250, 500, 750].map((add) => (
                  <button
                    key={add}
                    onClick={() => handleQuickAddCalories(add)}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700/60 transition-colors"
                  >
                    +{add}
                  </button>
                ))}
                <button
                  onClick={() => handleCaloriesChange(0)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold border border-slate-800 transition-colors"
                >
                  Скинути
                </button>
              </div>

              {/* Progress Bar vs Target */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Прогрес до ліміту: {calories} / {targetCalories} ккал</span>
                  <span className={calories > targetCalories ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {Math.round((calories / targetCalories) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((calories / targetCalories) * 100, 100)}%` }}
                    className={`h-full transition-all duration-300 ${
                      calories > targetCalories + 200
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Celebratory Day Completion Button */}
            <div>
              <button
                type="button"
                onClick={() => toggleDayCompletion(selectedDate)}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] shadow-lg ${
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-slate-950 fill-emerald-300 stroke-slate-950" />
                    <span>ДЕНЬ ВІДМІЧЕНО ЯК ПРОЙДЕНИЙ! (Стрик збережено 🔥)</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-6 h-6 text-slate-400" />
                    <span>Відмітити цей день як пройдений</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Daily Logs (Weight, Steps, Water, Workout) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <h3 className="font-bold text-slate-100 text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Додаткові щоденні показники</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Morning Weight */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Ранкова вага (кг)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">натщесерце</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="напр. 82.4"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      handleSaveField({ weight: e.target.value ? Number(e.target.value) : null });
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">кг</span>
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-teal-400" />
                    <span>Кількість кроків</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Google Fit</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    placeholder="напр. 8500"
                    value={steps}
                    onChange={(e) => {
                      setSteps(e.target.value);
                      handleSaveField({ steps: e.target.value ? Number(e.target.value) : null });
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">кроків</span>
                </div>
              </div>

              {/* Active Calories */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Активні калорії (тренування)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">+ до TDEE</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="25"
                    placeholder="0"
                    value={activeCal}
                    onChange={(e) => {
                      setActiveCal(e.target.value);
                      handleSaveField({ activeCaloriesBurned: Number(e.target.value) || 0 });
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">ккал</span>
                </div>
              </div>

              {/* Water Intake */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span>Випита вода</span>
                  </label>
                  <span className="text-xs font-bold text-blue-400">{(waterMl / 1000).toFixed(1)} л</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newW = Math.max(0, waterMl - 250);
                      setWaterMl(newW);
                      handleSaveField({ waterMl: newW });
                    }}
                    className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                  >
                    -250мл
                  </button>
                  <div className="flex-1 text-center bg-slate-950/80 border border-slate-700 rounded-xl py-2 font-bold text-sm text-slate-200">
                    {waterMl} мл
                  </div>
                  <button
                    onClick={() => {
                      const newW = waterMl + 250;
                      setWaterMl(newW);
                      handleSaveField({ waterMl: newW });
                    }}
                    className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                  >
                    +250мл
                  </button>
                </div>
              </div>
            </div>

            {/* Workout Done Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={workoutDone}
                  onChange={(e) => {
                    setWorkoutDone(e.target.checked);
                    handleSaveField({ workoutDone: e.target.checked });
                  }}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Сьогодні було виконано тренування</span>
                  </span>
                  <p className="text-[11px] text-slate-400">Силове заняття, біг або кардіо-сесія</p>
                </div>
              </label>
            </div>

            {/* Notes textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Нотатки щодо самопочуття / їжі</label>
              <textarea
                rows={2}
                placeholder="Як пройшов день, чи було відчуття голоду, що їли..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => handleSaveField({ notes })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Daily Fat Burning Meter & Live Deficit Engine */}
        <div className="lg:col-span-5 space-y-6">
          {/* Hero Fat Burn Gauge */}
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 sticky top-20 shadow-xl space-y-6 glow-emerald">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
                <Flame className="w-5 h-5 text-orange-400" />
                <span>Спалювання жиру за день</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-800">
                1g = 7.7 kcal
              </span>
            </div>

            {/* Fat Grams Big Counter */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">Розрахунково спалено чистого жиру:</p>
              <div className="flex items-baseline justify-center gap-1.5 my-2">
                <span
                  className={`text-5xl font-black tracking-tight ${
                    liveFatCalc.fatGramsBurned >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {liveFatCalc.fatGramsBurned > 0 ? `+${liveFatCalc.fatGramsBurned}` : liveFatCalc.fatGramsBurned}
                </span>
                <span className="text-2xl font-bold text-slate-300">грам</span>
              </div>

              <div className="inline-block mt-1">
                {liveFatCalc.fatGramsBurned > 0 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Дефіцит енергії: {liveFatCalc.netDeficit} ккал
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Профіцит калорій: +{Math.abs(liveFatCalc.netDeficit)} ккал
                  </span>
                )}
              </div>
            </div>

            {/* Formula Math Breakdown */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Математика розрахунку:
              </p>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>1. Ваша добова витрата (TDEE):</span>
                  <span className="font-bold text-white">+{tdee} ккал</span>
                </div>
                {activeCaloriesNum > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>2. Активність / Тренування:</span>
                    <span className="font-bold">+{activeCaloriesNum} ккал</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-300">
                  <span>3. З'їдено калорій (YAZIO):</span>
                  <span className="font-bold">-{calories} ккал</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-100">
                  <span>Чистий дефіцит:</span>
                  <span className={liveFatCalc.netDeficit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {liveFatCalc.netDeficit} ккал
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                💡 Оскільки 1 кг чистого жиру містить ~7700 ккал, кожен дефіцит у 77 ккал спалює рівно 10 грамів підшкірного жиру!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
