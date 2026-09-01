import React, { useState, useEffect } from 'react';
import {
  User,
  Scale,
  Ruler,
  Percent,
  Flame,
  Activity,
  Zap,
  Check,
  Info,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { Gender, IntensityLevel, WorkoutType } from '../../types';
import { computeFullBodyMetrics } from '../../lib/calculations';

interface BodyCalculatorProps {
  onPlanNext?: () => void;
}

export const BodyCalculator: React.FC<BodyCalculatorProps> = ({ onPlanNext }) => {
  const { metrics, saveMetrics } = usePlan();

  // Local form state initialized from current metrics or sensible defaults
  const [gender, setGender] = useState<Gender>(metrics?.gender || 'male');
  const [age, setAge] = useState<number>(metrics?.age || 28);
  const [height, setHeight] = useState<number>(metrics?.height || 178);
  const [weight, setWeight] = useState<number>(metrics?.weight || 82);
  const [neck, setNeck] = useState<number>(metrics?.neck || 39);
  const [waist, setWaist] = useState<number>(metrics?.waist || 90);
  const [hip, setHip] = useState<number>(metrics?.hip || 98);

  const [useCustomFat, setUseCustomFat] = useState<boolean>(Boolean(metrics?.customBodyFat));
  const [customFat, setCustomFat] = useState<number>(metrics?.customBodyFat || 20);

  // Daily routine
  const [deskJob, setDeskJob] = useState<boolean>(metrics?.dailyRoutine.deskJob ?? true);
  const [dailySteps, setDailySteps] = useState<number>(metrics?.dailyRoutine.dailyStepsTarget || 8000);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(metrics?.dailyRoutine.workoutsPerWeek ?? 3);
  const [workoutType, setWorkoutType] = useState<WorkoutType>(metrics?.dailyRoutine.workoutType || 'mixed');
  const [intensity, setIntensity] = useState<IntensityLevel>(metrics?.dailyRoutine.intensity || 'moderate');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Live calculated preview
  const liveMetrics = computeFullBodyMetrics(
    gender,
    age,
    height,
    weight,
    neck,
    waist,
    gender === 'female' ? hip : 0,
    useCustomFat ? customFat : null,
    {
      deskJob,
      dailyStepsTarget: dailySteps,
      workoutsPerWeek,
      workoutType,
      workoutDurationMins: 45,
      intensity,
    }
  );

  const handleSave = async () => {
    await saveMetrics(liveMetrics);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    if (onPlanNext) {
      onPlanNext();
    }
  };

  // Fat classification category
  const getFatCategory = (fat: number, gen: Gender) => {
    if (gen === 'male') {
      if (fat < 6) return { text: 'Екстремально низький', color: 'text-amber-400 bg-amber-500/10' };
      if (fat <= 13) return { text: 'Атлетичний (сухий)', color: 'text-emerald-400 bg-emerald-500/10' };
      if (fat <= 17) return { text: 'Фітнес норма', color: 'text-emerald-400 bg-emerald-500/10' };
      if (fat <= 24) return { text: 'Помірний (середній)', color: 'text-blue-400 bg-blue-500/10' };
      return { text: 'Підвищений (потрібен дефіцит)', color: 'text-rose-400 bg-rose-500/10' };
    } else {
      if (fat < 14) return { text: 'Екстремально низький', color: 'text-amber-400 bg-amber-500/10' };
      if (fat <= 20) return { text: 'Атлетичний', color: 'text-emerald-400 bg-emerald-500/10' };
      if (fat <= 24) return { text: 'Фітнес норма', color: 'text-emerald-400 bg-emerald-500/10' };
      if (fat <= 31) return { text: 'Помірний (середній)', color: 'text-blue-400 bg-blue-500/10' };
      return { text: 'Підвищений (потрібен дефіцит)', color: 'text-rose-400 bg-rose-500/10' };
    }
  };

  const fatCategory = getFatCategory(liveMetrics.bodyFatPercent, gender);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Біометричний модуль ВМС США (US Navy Method)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Комплексний розрахунок тіла та метаболізму
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2">
            Введіть ваші точні антропометричні дані та заміри тіла. Система розрахує відсоток підшкірного жиру, суху масу, базальний метаболізм (BMR) та добову витрату енергії (TDEE).
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Activity className="w-72 h-72 text-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Parameters Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Basic Stats */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-100 font-bold text-base">
              <User className="w-5 h-5 text-emerald-400" />
              <span>1. Основні параметри</span>
            </div>

            {/* Gender Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Стать</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                    gender === 'male'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>👨 Чоловік</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                    gender === 'female'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>👩 Жінка</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Вік (років)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="14"
                    max="99"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">р.</span>
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Зріст (см)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="120"
                    max="230"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">см</span>
                </div>
              </div>

              {/* Current Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Поточна вага (кг)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">кг</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: US Navy Measurements (Body Fat %) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-base">
                <Ruler className="w-5 h-5 text-teal-400" />
                <span>2. Заміри для % жиру (Формула ВМС США)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Сантиметровою стрічкою</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Neck */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Обхват шиї (см)</label>
                  <span className="text-[11px] text-slate-400">нижче кадика</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    max="65"
                    value={neck}
                    onChange={(e) => setNeck(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">см</span>
                </div>
              </div>

              {/* Waist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Обхват талії (см)</label>
                  <span className="text-[11px] text-slate-400">на рівні пупка</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="180"
                    value={waist}
                    onChange={(e) => setWaist(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">см</span>
                </div>
              </div>

              {/* Hip (for females) */}
              {gender === 'female' && (
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Обхват стегон (см)</label>
                    <span className="text-[11px] text-slate-400">у найширшому місці</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      max="190"
                      value={hip}
                      onChange={(e) => setHip(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500">см</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Body Fat toggle */}
            <div className="pt-2 border-t border-slate-800/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-slate-100">
                <input
                  type="checkbox"
                  checked={useCustomFat}
                  onChange={(e) => setUseCustomFat(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Я знаю свій точний % жиру (з біоімпедансу / DEXA / каліпера)</span>
              </label>

              {useCustomFat && (
                <div className="mt-3 max-w-xs animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Мій % жиру:</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="4"
                      max="55"
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3.5 py-2 text-slate-100 text-sm font-semibold focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs text-emerald-400 font-bold">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Daily Routine & Activity */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-100 font-bold text-base">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>3. Розпорядок дня та рівень активності</span>
            </div>

            {/* Desk Job Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-200">Сидяча робота (офіс / за комп'ютером)</p>
                <p className="text-[11px] text-slate-400">Більшість робочого дня проводиться сидячи</p>
              </div>
              <button
                type="button"
                onClick={() => setDeskJob(!deskJob)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  deskJob ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {deskJob ? 'Так (Сидяча)' : 'Ні (Рухлива)'}
              </button>
            </div>

            {/* Daily Steps */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Середня кількість кроків на день</span>
                <span className="text-emerald-400 font-bold">{dailySteps.toLocaleString()} кроків</span>
              </div>
              <input
                type="range"
                min="3000"
                max="20000"
                step="500"
                value={dailySteps}
                onChange={(e) => setDailySteps(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>3 000 (Мало)</span>
                <span>8 000 (Норма)</span>
                <span>12 000+ (Активно)</span>
                <span>20 000</span>
              </div>
            </div>

            {/* Workouts per week */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Тренувань на тиждень</label>
                <select
                  value={workoutsPerWeek}
                  onChange={(e) => setWorkoutsPerWeek(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>0 — Без тренувань</option>
                  <option value={1}>1 тренування на тиждень</option>
                  <option value={2}>2 тренування на тиждень</option>
                  <option value={3}>3 тренування на тиждень (стандарт)</option>
                  <option value={4}>4 тренування на тиждень</option>
                  <option value={5}>5 тренувань на тиждень</option>
                  <option value={6}>6+ тренувань на тиждень</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Тип тренувань</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="strength">🏋️ Силові (тренажерний зал/гантелі)</option>
                  <option value="cardio">🏃 Кардіо (біг, велик, плавання)</option>
                  <option value="mixed">⚡ Змішані / Кросфіт / Спорт</option>
                  <option value="none">🚶 Лише прогулянки</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Computed Results Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 sticky top-20 shadow-xl space-y-6 glow-emerald">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Ваш розрахунок тіла</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                LIVE
              </span>
            </div>

            {/* Body Fat Hero Gauge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/80 text-center relative overflow-hidden">
              <p className="text-xs text-slate-400 font-medium">Відсоток підшкірного жиру</p>
              <div className="flex items-baseline justify-center gap-1 my-2">
                <span className="text-5xl font-black text-white tracking-tight">
                  {liveMetrics.bodyFatPercent}
                </span>
                <span className="text-2xl font-bold text-emerald-400">%</span>
              </div>

              <div className="inline-block mt-1">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${fatCategory.color}`}>
                  {fatCategory.text}
                </span>
              </div>

              {/* Progress Bar for visual Body Fat scale */}
              <div className="mt-4 w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div style={{ width: '25%' }} className="bg-emerald-500/80" title="Сухий" />
                <div style={{ width: '35%' }} className="bg-teal-500/80" title="Норма" />
                <div style={{ width: '25%' }} className="bg-blue-500/80" title="Помірний" />
                <div style={{ width: '15%' }} className="bg-rose-500/80" title="Підвищений" />
              </div>
            </div>

            {/* Lean Mass & Fat Mass breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-400">Суха маса (м'язи + кістки)</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-teal-300">{liveMetrics.leanMassKg}</span>
                  <span className="text-xs text-slate-400">кг</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {Math.round((liveMetrics.leanMassKg / liveMetrics.weight) * 100)}% від ваги
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-400">Жирова маса тіла</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-amber-300">{liveMetrics.fatMassKg}</span>
                  <span className="text-xs text-slate-400">кг</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {liveMetrics.bodyFatPercent}% жиру
                </p>
              </div>
            </div>

            {/* Metabolic Rates (BMR and TDEE) */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              {/* BMR */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-slate-200">BMR (Базовий обмін)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Витрата енергії у повному спокої</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-orange-300">{liveMetrics.bmr}</span>
                  <span className="text-xs text-slate-400 ml-1">ккал</span>
                </div>
              </div>

              {/* TDEE */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-600/40">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">TDEE (Повна добова норма)</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80">З урахуванням кроків та тренувань</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">{liveMetrics.tdee}</span>
                  <span className="text-xs text-emerald-300 ml-1">ккал/день</span>
                </div>
              </div>
            </div>

            {/* Action Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.99]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-5 h-5 text-slate-950" />
                  <span>Параметри збережено!</span>
                </>
              ) : (
                <>
                  <span>Зберегти та перейти до Плану</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
