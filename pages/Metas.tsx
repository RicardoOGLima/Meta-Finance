
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BudgetGoal, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { calculateSummary, formatCurrency } from '../utils/calculations';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { CategoryBadge } from './Transactions';

const Metas: React.FC = () => {
  const { budgetGoals, updateBudgetGoals, transactions } = useApp();
  const [goals, setGoals] = useState<BudgetGoal[]>(budgetGoals);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    const d = new Date();
    const s = calculateSummary(transactions, d.getMonth(), d.getFullYear());
    setTotalIncome(s.income);
  }, [transactions]);

  useEffect(() => {
    const missing = EXPENSE_CATEGORIES.filter(cat => !goals.find(g => g.category === cat));
    if (missing.length > 0) {
      setGoals(prev => [
        ...prev,
        ...missing.map(cat => ({ category: cat as ExpenseCategory, percentage: 0 }))
      ]);
    }
  }, []);

  const totalPercent = goals.reduce((acc, g) => acc + g.percentage, 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;

  const handleChange = (category: string, value: number) => {
    setGoals(prev => prev.map(g => g.category === category ? { ...g, percentage: value } : g));
  };

  const handleSave = () => {
    if (!isValid) return;
    updateBudgetGoals(goals);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Metas de Gastos</h2>
          <p className="text-slate-500 dark:text-slate-400">Defina o destino ideal do seu dinheiro.</p>
        </div>
        <button 
          disabled={!isValid}
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
            isValid 
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Save size={20} /> Salvar Metas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-center">Meta (%)</th>
                  <th className="px-6 py-4 text-right">Estimado (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {goals.map((g) => (
                  <tr key={g.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <CategoryBadge category={g.category} />
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <div className="relative w-full max-w-[100px] flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-600 transition-all overflow-hidden shadow-sm">
                        <input 
                          type="number"
                          step="0.1"
                          className="w-full pl-2 py-2 bg-transparent outline-none text-center font-bold text-lg"
                          value={g.percentage}
                          onChange={e => handleChange(g.category, parseFloat(e.target.value) || 0)}
                        />
                        <span className="pr-3 text-slate-400 text-xs font-bold">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                      {formatCurrency(totalIncome * (g.percentage / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                <tr className="font-bold">
                  <td className="px-6 py-4">Total</td>
                  <td className={`px-6 py-4 text-center ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                    {totalPercent.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {formatCurrency(totalIncome)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border flex flex-col items-center gap-4 text-center transition-colors duration-300 ${
            isValid ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
          }`}>
            {isValid ? (
              <>
                <CheckCircle2 className="text-green-600" size={48} />
                <div>
                  <h4 className="font-bold text-green-800 dark:text-green-300">Distribuição Perfeita</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">Sua alocação fecha exatamente 100%.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-600" size={48} />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300">Ajuste Necessário</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    A soma deve ser exatamente 100%. Atualmente é {totalPercent.toFixed(1)}%.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h4 className="font-bold mb-4">Como funciona?</h4>
            <div className="text-sm text-slate-500 space-y-3 leading-relaxed">
              <p>As metas de orçamento ajudam você a decidir quanto da sua receita deve ir para cada categoria.</p>
              <p>A "Meta em R$" é calculada multiplicando a receita total do mês pela porcentagem definida.</p>
              {totalIncome === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>Nenhuma receita cadastrada para este mês. Cadastre receitas na aba 'Receitas' para visualizar valores reais.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metas;
