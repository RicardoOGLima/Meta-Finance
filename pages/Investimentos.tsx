
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePortfolioMetrics, formatCurrency } from '../utils/calculations';
import { Plus, Edit2, Trash2, Star, Info, Filter } from 'lucide-react';
import { Asset } from '../types';
import { InvestmentBadge } from './Transactions';

const Investimentos: React.FC<{ onPageChange: (p: string) => void }> = ({ onPageChange }) => {
  const { assets, investmentGoals, deleteAsset, updateAsset, theme } = useApp();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterClass, setFilterClass] = useState('Todas');

  const { totalValue, metrics, classAllocation } = calculatePortfolioMetrics(assets, investmentGoals);

  const availableClasses = ['Todas', ...Array.from(new Set(assets.map(a => a.class)))];
  
  const filteredMetrics = filterClass === 'Todas' 
    ? metrics 
    : metrics.filter(m => m.class === filterClass);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      updateAsset(editingAsset);
      setEditingAsset(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Investimentos</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de ativos e rebalanceamento.</p>
        </div>
        <button 
          onClick={() => onPageChange('novo-ativo')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus size={20} /> Novo Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary Sidebar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-1 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Patrimônio Investido</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</h3>
          
          <div className="mt-8 space-y-5">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Distribuição por Classe</h4>
            <div className="space-y-5">
              {classAllocation.map(c => (
                <div key={c.name} className="space-y-2 group">
                  <div className="flex justify-between items-center">
                    <InvestmentBadge className={c.name} />
                    <div className="flex gap-3 items-center text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tighter">Meta {c.meta}%</span>
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-black">{c.value.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-1.5 relative group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                    {c.meta > 0 && (
                      <div 
                        className="absolute top-[-2px] bottom-[-2px] w-[3px] bg-slate-800 dark:bg-slate-500 z-10 rounded-full shadow-sm" 
                        style={{ left: `${c.meta}%` }}
                        title={`Alvo: ${c.meta}%`}
                      />
                    )}
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${c.value > c.meta ? 'bg-indigo-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(c.value, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {classAllocation.length === 0 && (
              <p className="text-xs text-slate-400 italic">Configure suas metas na aba "Metas de Investimento".</p>
            )}
          </div>
        </div>

        {/* Assets Table Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Filtrar:</span>
            </div>
            <select 
              className="flex-1 md:flex-none px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm transition-all focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
            >
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Ativo</th>
                    <th className="px-6 py-4 text-center">Nota</th>
                    <th className="px-6 py-4 text-right">Preço</th>
                    <th className="px-6 py-4 text-right">Ideal %</th>
                    <th className="px-6 py-4 text-right">Real %</th>
                    <th className="px-6 py-4 text-center">Gap %</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredMetrics.length > 0 ? filteredMetrics.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{a.ticker}</span>
                          <InvestmentBadge className={a.class} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg font-bold flex items-center justify-center gap-1 w-fit mx-auto text-[10px]">
                          <Star size={10} className="fill-current" /> {a.score || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(a.currentPrice)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{a.idealPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{a.currentPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.gap > 0 ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-green-600 bg-green-50 dark:bg-green-500/10'}`}>
                          {a.gap > 0 ? '-' : '+'}{Math.abs(a.gap).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setEditingAsset(a as Asset)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        {filterClass === 'Todas' ? 'Nenhum ativo em carteira.' : `Nenhum ativo encontrado na classe "${filterClass}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200 border border-white dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Editar {editingAsset.ticker}</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantidade</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.quantity}
                  onChange={e => setEditingAsset({...editingAsset, quantity: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Preço Atual (R$)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.currentPrice}
                  onChange={e => setEditingAsset({...editingAsset, currentPrice: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Nota (0-15)</label>
                <input 
                  type="number" min="0" max="15"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.score || 0}
                  onChange={e => setEditingAsset({...editingAsset, score: Math.min(15, Math.max(0, Number(e.target.value)))})}
                />
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                  <Info size={10} /> O % Ideal é ajustado automaticamente baseando-se nesta nota.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Observação</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none min-h-[80px] focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.note}
                  onChange={e => setEditingAsset({...editingAsset, note: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingAsset(null)} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleUpdate} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investimentos;
