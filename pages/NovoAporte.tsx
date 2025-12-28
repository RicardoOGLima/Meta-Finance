
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { planContribution, formatCurrency } from '../utils/calculations';
import { Calculator, ArrowRight, TrendingUp, Info } from 'lucide-react';

const NovoAporte: React.FC = () => {
  const { assets, investmentGoals } = useApp();
  const [amount, setAmount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleCalculate = () => {
    // Fix: Added investmentGoals as the second argument to match planContribution signature
    const results = planContribution(assets, investmentGoals, amount);
    setSuggestions(results);
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Planejador de Aporte</h2>
        <p className="text-slate-500 dark:text-slate-400">Rebalanceie sua carteira de forma inteligente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <h4 className="font-bold">Quanto quer investir?</h4>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input 
                type="number" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-2xl font-mono font-bold"
                placeholder="0,00"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>
            <button 
              onClick={handleCalculate}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Calculator size={20} /> Calcular Sugestões
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
            <h5 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
              <Info size={16} /> Como funciona
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
              Nosso algoritmo prioriza ativos com maior "Gap Negativo" (aqueles que estão abaixo do peso ideal). 
              A ideia é comprar o que está barato em relação à sua meta para trazer a carteira de volta ao equilíbrio.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {suggestions.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold">Sugestão de Alocação</h3>
                <span className="text-xs font-bold text-slate-400">TOTAL: {formatCurrency(amount)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Ativo</th>
                      <th className="px-6 py-4 text-right">Valor Aporte</th>
                      <th className="px-6 py-4 text-right">Qtd. Est.</th>
                      <th className="px-6 py-4">Motivação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                    {suggestions.filter(s => s.suggestedValue > 0).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{s.ticker}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{s.class}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-green-600">
                          {formatCurrency(s.suggestedValue)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          ~{s.suggestedQty.toFixed(2)} un
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <TrendingUp size={14} className="text-blue-500" />
                            Reduz gap de {(s.idealPercentage - (s.quantity * s.currentPrice / (assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0)) * 100)).toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 text-center">
                <p className="text-xs text-slate-500 italic">
                  * Os cálculos são baseados apenas em aportes de compra. Ativos acima do peso não são vendidos.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Calculator size={64} className="mb-4 opacity-20" />
              <p className="font-medium">Digite um valor e clique em calcular para ver as sugestões.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoAporte;
