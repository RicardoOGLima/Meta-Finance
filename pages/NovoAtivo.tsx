
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset } from '../types';
import { Save, X, Info } from 'lucide-react';
import { INVESTMENT_CLASSES } from '../constants';

const NovoAtivo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { addAsset } = useApp();
  
  const [formData, setFormData] = useState({
    class: INVESTMENT_CLASSES[0],
    ticker: '',
    note: '',
    score: 0,
    quantity: 0,
    currentPrice: 0,
    idealPercentage: 0 // Keep in state for structure, but not as input
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAsset(formData);
    onBack();
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300 py-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Novo Ativo</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Expanda seu portfólio de investimentos.</p>
          </div>
          <button onClick={onBack} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Row 1 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classe</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                value={formData.class}
                onChange={e => setFormData({ ...formData, class: e.target.value })}
              >
                {INVESTMENT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Código / Ticker</label>
              <input 
                type="text" required placeholder="EX: PETR4"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none uppercase font-bold"
                value={formData.ticker}
                onChange={e => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantidade</label>
              <input 
                type="number" required placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={formData.quantity || ''}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Atual (R$)</label>
              <input 
                type="number" step="0.01" required placeholder="0,00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={formData.currentPrice || ''}
                onChange={e => setFormData({ ...formData, currentPrice: Number(e.target.value) })}
              />
            </div>

            {/* Row 3 - Score is now the key driver for weight */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nota do Ativo (0-15)</label>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <input 
                  type="number" min="0" max="15" step="1" required placeholder="0"
                  className="w-full md:w-32 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono font-bold text-lg"
                  value={formData.score || ''}
                  onChange={e => setFormData({ ...formData, score: Math.min(15, Math.max(0, Number(e.target.value))) })}
                />
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <p>O % Ideal deste ativo será calculado automaticamente baseando-se na Meta de Investimento da sua Classe ({formData.class}) e na Nota que você atribuir. Notas maiores resultam em uma maior fatia da carteira.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observação</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none min-h-[100px] resize-none"
              placeholder="Alguma nota sobre a tese deste ativo..."
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Save size={20} /> Salvar Ativo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoAtivo;
