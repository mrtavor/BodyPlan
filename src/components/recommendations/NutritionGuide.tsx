import React from 'react';
import {
  BookOpen,
  Egg,
  Flame,
  CheckCircle2,
  Sparkles,
  Droplet,
  Salad,
  Apple,
  ShieldCheck,
  Zap,
  Info,
  Clock,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';

export const NutritionGuide: React.FC = () => {
  const { metrics, plan } = usePlan();

  const proteinGrams = plan?.macros.proteinGrams || 150;
  const targetKcal = plan?.averageDailyTargetKcal || 2000;
  const goal = plan?.goal || 'fat_loss_keep_muscle';

  const proteinSources = [
    { name: 'Куряче або індиче філе', protein: '23-31 г', fat: '1-3 г', per: 'на 100г', note: 'Еталон чистого білка' },
    { name: 'Кисломолочний сир (творог 2-5%)', protein: '16-18 г', fat: '2-5 г', per: 'на 100г', note: 'Повільний казеїн перед сном' },
    { name: 'Яйця курячі (цілі)', protein: '13 г (6-7г/яйце)', fat: '10 г', per: 'на 100г', note: 'Найвища біодоступність' },
    { name: 'Яєчні білки (рідкі/варені)', protein: '11 г', fat: '0.2 г', per: 'на 100г', note: 'Ідеально для об’єму' },
    { name: 'Тунець у власному соку', protein: '25-28 г', fat: '0.8 г', per: 'на 100г', note: 'Швидкий перекус без жиру' },
    { name: 'Лосось / Форель', protein: '20 г', fat: '12 г', per: 'на 100г', note: 'Омега-3 для гормонів' },
    { name: 'Яловича вирізка (пісна)', protein: '26 г', fat: '6-8 г', per: 'на 100г', note: 'Залізо, цинк, креатин' },
    { name: 'Сироватковий протеїн (Whey)', protein: '24-27 г', fat: '1-2 г', per: 'на 1 скуп (30г)', note: 'Зручно після тренування' },
    { name: 'Грецький йогурт (0-2%)', protein: '10 г', fat: '0-2 г', per: 'на 100г', note: 'Пробіотики + ситість' },
    { name: 'Сочевиця / Нут / Квасоля', protein: '8-9 г', fat: '0.5 г', per: 'на 100г вареної', note: 'Рослинний білок + клітковина' },
    { name: 'Тофу твердий', protein: '12-15 г', fat: '5-7 г', per: 'на 100г', note: 'Рослинний ізолят' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Нутриціологічний довідник та практичні рекомендації
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Що їсти щодня для збереження м'язів та спалювання жиру
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2">
            Як легко добирати щоденну норму білка (<span className="text-emerald-400 font-bold">{proteinGrams}г</span>), контролювати ситість при дефіциті та грамотно проходити вихідні дні.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Protein Strategy & Sources */}
        <div className="lg:col-span-7 space-y-6">
          {/* Protein Guide Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-base">
                <Egg className="w-5 h-5 text-emerald-400" />
                <span>Топ джерел білка для добору вашої норми ({proteinGrams} г/день)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Щоб зберегти м'язову тканину в умовах дефіциту калорій, оптимально розподіляти білок на <strong>3-4 прийоми по 35-50г</strong> на кожен прийом.
            </p>

            {/* Protein Sources Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Продукт</th>
                    <th className="py-2.5 px-3">Білок</th>
                    <th className="py-2.5 px-3">Жири</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Особливість</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {proteinSources.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{item.name}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{item.protein}</td>
                      <td className="py-2.5 px-3 text-amber-300">{item.fat}</td>
                      <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Satiety Index & Veggies */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-base pb-3 border-b border-slate-800">
              <Salad className="w-5 h-5 text-teal-400" />
              <span>Правило ідеальної тарілки для ситості</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-black text-sm">½ Тарілки — Овочі</span>
                <p className="text-[11px] text-slate-400">
                  Огірки, томати, броколі, шпинат, капуста. Величезний об'єм при мізерних калоріях (15-25 ккал/100г).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-teal-400 font-black text-sm">¼ Тарілки — Білок</span>
                <p className="text-[11px] text-slate-400">
                  Птиця, риба, яйця, творог. Високий термічний ефект їжі (TEF ~25% калорій спалюється на перетравлення).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-black text-sm">¼ Складні Вуглеводи</span>
                <p className="text-[11px] text-slate-400">
                  Гречка, вівсянка, бурий рис, відварна картопля. Повільне вивільнення енергії без стрибків інсуліну.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Golden Rules for Fat Loss & Muscle Retention */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rules Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-base pb-3 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>5 Золотих правил успішної дієти</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">1. Білок у кожному прийомі:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Не з'їдайте весь білок ввечері. Рівномірний розподіл (кожні 3-4 години) стимулює ріст та захист м'язів.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">2. Не бійтеся вихідних:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Якщо у вас налаштовано більше калорій на вихідні (+20-30%), насолоджуйтесь ними без почуття провини — це закладено в математику вашого щотижневого дефіциту!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">3. Рідкі калорії — ворог дефіциту:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Солодкі газовані напої, лате з сиропами та соки не дають ситості, але додають 300-500 невидимих ккал. Обирайте воду, чай, каву без цукру.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">4. Кроки та сон:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Недосипання підвищує рівень греліну (гормону голоду) на 25-30%. Спіть 7-8 годин і тримайте норму кроків.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">5. Записуйте чесно:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Олія на сковорідці, соуси та горіхи містять багато прихованих калорій. Точне введення в YAZIO гарантує передбачуваний результат.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
