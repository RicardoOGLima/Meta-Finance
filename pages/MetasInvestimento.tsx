
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InvestmentGoal } from '../types';
import { INVESTMENT_CLASSES } from '../constants';
import { calculatePortfolioMetrics, formatCurrency } from '../utils/calculations';
import { AlertCircle, CheckCircle2, Save, BarChart3 } from 'lucide-react';
import { PageHeader, Card, Badge } from '../components/ui';

const MetasInvestimento: React.FC = () => {
  const { investmentGoals, updateInvestmentGoals, assets } = useApp();
  const [goals, setGoals] = useState<InvestmentGoal[]>(investmentGoals);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const metrics = calculatePortfolioMetrics(assets, investmentGoals);
    setTotalValue(metrics.totalValue);
  }, [assets, investmentGoals]);

  useEffect(() => {
    const missing = INVESTMENT_CLASSES.filter(cls => !goals.find(g => g.class === cls));
    if (missing.length > 0) {
      setGoals(prev => [
        ...prev,
        ...missing.map(cls => ({ class: cls, percentage: 0 }))
      ]);
    }
  }, []);

  const totalPercent = goals.reduce((acc, g) => acc + g.percentage, 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;

  const handleChange = (className: string, value: number) => {
    setGoals(prev => prev.map(g => g.class === className ? { ...g, percentage: value } : g));
  };

  const handleSave = () => {
    if (!isValid) return;
    updateInvestmentGoals(goals);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <PageHeader
        title="Metas de Investimentos"
        description="Defina a alocação ideal para cada classe de ativo."
        action={
          <button
            disabled={!isValid}
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${isValid
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
          >
            <Save size={20} /> Salvar Alocação
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Classe de Ativo</th>
                    <th className="px-6 py-4 text-center">Alocação Alvo (%)</th>
                    <th className="px-6 py-4 text-right">Valor Projetado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {goals.map((g) => (
                    <tr key={g.class} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <Badge label={g.class} variant="investment" />
                      </td>
                      <td className="px-6 py-4 flex justify-center">
                        <div className="relative w-full max-w-[100px] flex items-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-600 transition-all overflow-hidden shadow-sm">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full pl-2 py-2 bg-transparent outline-none text-center font-bold text-lg text-slate-900 dark:text-slate-100"
                            value={g.percentage}
                            onChange={e => handleChange(g.class, parseFloat(e.target.value) || 0)}
                          />
                          <span className="pr-3 text-slate-400 text-xs font-bold">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatCurrency(totalValue * (g.percentage / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <tr className="font-bold">
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 uppercase text-xs tracking-widest">Total Alocado</td>
                    <td className={`px-6 py-4 text-center text-lg ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {totalPercent.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border flex flex-col items-center gap-4 text-center transition-all duration-300 ${isValid ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-800'
            }`}>
            {isValid ? (
              <>
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={48} />
                <div>
                  <h4 className="font-bold text-green-800 dark:text-green-300">Estratégia Definida</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">Sua distribuição fecha exatamente 100%.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-600 dark:text-red-400" size={48} />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300">Ajuste Pendente</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    A soma deve ser 100%. Saldo: {(100 - totalPercent).toFixed(1)}%.
                  </p>
                </div>
              </>
            )}
          </div>

          <Card title="Alocação Estratégica" headerAction={<BarChart3 size={18} className="text-blue-500" />}>
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>Ao definir metas por classe, você cria uma bússola para seus novos aportes, garantindo que sua carteira não fique desequilibrada.</p>
              <p>O sistema sugerirá compras baseadas no quanto cada classe está abaixo desta meta ideal.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MetasInvestimento;
