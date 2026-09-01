import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  LineChart as ChartIcon,
  Flame,
  Scale,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { getDayKeyFromDate, getDayNameUk } from '../../lib/calculations';

export const ProgressDashboard: React.FC = () => {
  const { metrics, plan, logs, streak } = usePlan();

  // Process logged dates in chronological order
  const chartData = useMemo(() => {
    const sortedDates = Object.keys(logs).sort();
    if (sortedDates.length === 0) return [];

    let runningFatGrams = 0;
    let weightHistory: number[] = [];

    return sortedDates.map((dateStr) => {
      const log = logs[dateStr];
      const dayKey = getDayKeyFromDate(dateStr);
      const targetCal = log.targetCalories || (plan ? plan.dayCalories[dayKey] : 2000);
      const consumed = log.caloriesConsumed;
      const tdee = metrics ? metrics.tdee : 2300;
      const active = log.activeCaloriesBurned || 0;
      
      const netDeficit = (tdee + active) - consumed;
      const fatGrams = log.completed || consumed > 0 ? Math.round((netDeficit / 7.7) * 10) / 10 : 0;
      runningFatGrams += fatGrams;

      if (log.weight) {
        weightHistory.push(log.weight);
      }

      // 7-day moving average for weight
      const last7 = weightHistory.slice(-7);
      const movingAvgWeight = last7.length > 0
        ? Math.round((last7.reduce((a, b) => a + b, 0) / last7.length) * 10) / 10
        : null;

      const dateObj = new Date(dateStr + 'T12:00:00');
      const shortDate = `${dateObj.getDate()} ${dateObj.toLocaleDateString('uk-UA', { month: 'short' })}`;

      return {
        date: dateStr,
        shortDate,
        dayName: getDayNameUk(dayKey),
        caloriesConsumed: consumed > 0 ? consumed : null,
        targetCalories: targetCal,
        weight: log.weight || null,
        movingAvgWeight,
        fatGramsDaily: fatGrams,
        cumulativeFatKg: Math.round((runningFatGrams / 1000) * 100) / 100,
        cumulativeFatGrams: Math.round(runningFatGrams),
        completed: log.completed,
      };
    });
  }, [logs, plan, metrics]);

  // Overall Statistics
  const stats = useMemo(() => {
    const allLogs = Object.values(logs);
    const completedDays = allLogs.filter((l) => l.completed).length;
    const totalLoggedWithCalories = allLogs.filter((l) => l.caloriesConsumed > 0).length;

    let totalDeficit = 0;
    let totalFatGrams = 0;
    let loggedWeights = allLogs
      .filter((l) => l.weight !== null && l.weight !== undefined)
      .map((l) => l.weight as number);

    allLogs.forEach((l) => {
      if (l.caloriesConsumed > 0 || l.completed) {
        const tdee = metrics?.tdee || 2300;
        const active = l.activeCaloriesBurned || 0;
        const def = (tdee + active) - l.caloriesConsumed;
        totalDeficit += def;
        totalFatGrams += def / 7.7;
      }
    });

    const hasWeights = loggedWeights.length > 0;
    const startW = hasWeights ? loggedWeights[0] : (metrics?.weight || 0);
    const latestW = hasWeights ? loggedWeights[loggedWeights.length - 1] : startW;
    const weightDiff = hasWeights && loggedWeights.length > 1 ? Math.round((latestW - startW) * 10) / 10 : 0;

    return {
      hasWeights,
      completedDays,
      totalLoggedWithCalories,
      totalDeficit: Math.round(totalDeficit),
      totalFatKg: Math.round((totalFatGrams / 1000) * 100) / 100,
      totalFatGrams: Math.round(totalFatGrams),
      startWeight: startW,
      latestWeight: latestW,
      weightDiff,
    };
  }, [logs, metrics]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <ChartIcon className="w-3.5 h-3.5" />
            Аналітика та динаміка трансформації
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Графіки прогресу та спаленого жиру
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2">
            Наочне відстеження щоденного споживання калорій, динаміки ваги та сумарної кількості спаленого жиру в грамах.
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fat Burned */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-1 glow-emerald">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Спалено чистого жиру</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-black text-emerald-400">
              {stats.totalFatKg > 0 ? `-${stats.totalFatKg}` : stats.totalFatKg}
            </span>
            <span className="text-xs text-slate-300 font-bold">кг жиру</span>
          </div>
          <p className="text-[11px] text-slate-400">
            (~{Math.abs(stats.totalFatGrams)} грам спалено з дефіциту)
          </p>
        </div>

        {/* Total Deficit */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Сумарний дефіцит енергії</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-black text-indigo-300">
              {stats.totalDeficit.toLocaleString()}
            </span>
            <span className="text-xs text-slate-300 font-bold">ккал</span>
          </div>
          <p className="text-[11px] text-slate-400">
            За всі внесені дні
          </p>
        </div>

        {/* Weight Change */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Зміна ваги за зважуваннями</span>
            <Scale className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span
              className={`text-3xl font-black ${
                stats.weightDiff < 0 ? 'text-emerald-400' : stats.weightDiff > 0 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {stats.hasWeights ? (stats.weightDiff > 0 ? `+${stats.weightDiff}` : stats.weightDiff) : '0'}
            </span>
            <span className="text-xs text-slate-300 font-bold">кг</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.hasWeights ? `${stats.startWeight} кг ➔ ${stats.latestWeight} кг` : 'Внесіть ранкові зважування'}
          </p>
        </div>

        {/* Streak & Adherence */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Дотримання режиму</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-black text-amber-300">{stats.completedDays}</span>
            <span className="text-xs text-slate-300 font-bold">днів закрито</span>
          </div>
          <p className="text-[11px] text-amber-400/90 font-medium">
            🔥 Поточний стрик: {streak} {streak === 1 ? 'день' : 'днів'} поспіль
          </p>
        </div>
      </div>

      {/* Chart 1: Daily Calories Consumed vs Planned Target */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              1. Калораж по днях: Факт (YAZIO) vs План (з урахуванням вихідних)
            </h3>
            <p className="text-xs text-slate-400">
              Стовпчики — скільки ви реально з'їли. Лінія — ваша розрахована норма на цей день тижня.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Немає даних для побудови графіка. Внесіть записи у щоденнику!
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar
                  dataKey="caloriesConsumed"
                  name="З'їдено ккал (Факт)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="stepAfter"
                  dataKey="targetCalories"
                  name="Ціль на цей день (План)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Cumulative Fat Mass Burned in Grams/Kg */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              2. Накопичувальне спалювання чистого жиру (кг)
            </h3>
            <p className="text-xs text-slate-400">
              Кумулятивна сума спаленого підшкірного жиру на основі щоденного балансу енергії.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Немає даних для графіка.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} кг`, 'Спалено жиру']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeFatKg"
                  name="Сумарно спалено жиру (кг)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fatGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 3: Weight Trend & 7-day Moving Average */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              3. Динаміка ваги та ковзне середнє за 7 днів
            </h3>
            <p className="text-xs text-slate-400">
              Ковзне середнє згладжує коливання вологи та показує реальний тренд.
            </p>
          </div>
        </div>

        {chartData.filter((d) => d.weight).length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Внесіть ранкові зважування у щоденнику для перегляду динаміки ваги.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Вага (Факт)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#38bdf8' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="movingAvgWeight"
                  name="7-денне середнє"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                {plan?.targetWeight && (
                  <ReferenceLine
                    y={plan.targetWeight}
                    label={{ value: `Ціль: ${plan.targetWeight} кг`, fill: '#34d399', fontSize: 11 }}
                    stroke="#34d399"
                    strokeDasharray="3 3"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
