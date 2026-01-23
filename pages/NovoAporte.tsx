import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { planContribution, formatCurrency, calculateAdherenceScore, calculatePortfolioDeficit } from '../utils/calculations';
import { Calculator, TrendingUp, Info, PieChart as PieIcon, Activity, Target } from 'lucide-react';
import { Badge } from '../components/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Modern, vibrant colors for the chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const NovoAporte: React.FC = () => {
  const { assets, investmentGoals } = useApp();
  const [amount, setAmount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleCalculate = () => {
    const results = planContribution(assets, investmentGoals, amount);
    setSuggestions(results);
  };

  const adherenceScore = useMemo(() => calculateAdherenceScore(assets, investmentGoals), [assets, investmentGoals]);
  const equilibriumDeficit = useMemo(() => calculatePortfolioDeficit(assets, investmentGoals), [assets, investmentGoals]);

  // Aggregate suggestions for the chart
  const chartData = useMemo(() => {
    const agg: Record<string, number> = {};
    suggestions.filter(s => s.suggestedValue > 0).forEach(s => {
      agg[s.class] = (agg[s.class] || 0) + s.suggestedValue;
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [suggestions]);

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Planejador de Aporte</h2>
        <p className="text-slate-500 dark:text-slate-400">Rebalanceie sua carteira de forma inteligente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Valor do Aporte</h4>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input
                type="number"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 transition-all"
                placeholder="0,00"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>
            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Calculator size={20} /> Calcular Estratégia
            </button>
          </div>

          {/* New Metrics Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

            {/* Adherence Meter */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                    <Activity size={14} /> Aderência à Meta
                  </h5>
                  <span className={`text-sm font-black ${adherenceScore >= 80 ? 'text-emerald-500' : adherenceScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {adherenceScore}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${adherenceScore >= 80 ? 'bg-emerald-500' : adherenceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${adherenceScore}%` }}
                  />
                </div>
              </div>

              {/* Equilibrium Deficit */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Para o Equilíbrio</p>
                  <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                    {equilibriumDeficit > 0 ? `+ ${formatCurrency(equilibriumDeficit)}` : 'Em Equilíbrio'}
                  </p>
                </div>
              </div>
            </div>

            {/* Allocation Chart (Only shows if suggestions exist) */}
            {chartData.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                  <PieIcon size={14} /> Distribuição do Aporte
                </h5>
                <div className="h-56 w-full -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 transition-colors">
            <h5 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2 uppercase text-[10px] tracking-widest">
              <Info size={14} /> Inteligência de Dados
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
              O algoritmo prioriza ativos que estão com maior distância da sua meta ideal. Ao comprar o que está "atrás", você rebalanceia sem precisar vender ativos.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {suggestions.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Sugestão de Alocação</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Budget: {formatCurrency(amount)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Ativo</th>
                      <th className="px-6 py-4 text-right">Valor Aporte</th>
                      <th className="px-6 py-4 text-right">Qtd. Est.</th>
                      <th className="px-6 py-4">Motivação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {suggestions.filter(s => s.suggestedValue > 0).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{s.ticker}</span>
                            <Badge label={s.class} variant="investment" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(s.suggestedValue)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          ~{s.suggestedQty.toFixed(2)} un
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <TrendingUp size={12} className="text-blue-500" />
                            Rebalanceamento
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  * Cálculos baseados em preços de mercado atualizados. O aporte foca em redução de gaps negativos.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
              <Calculator size={64} className="mb-4 opacity-10" />
              <p className="font-medium text-slate-500 dark:text-slate-600">Simule um aporte para ver o caminho da liberdade financeira.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoAporte;
