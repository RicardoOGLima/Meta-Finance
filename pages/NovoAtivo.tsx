
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INVESTMENT_CLASSES } from '../constants';
import { Plus, Info, Save, X } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';

const NovoAtivo: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { addAsset } = useApp();
  const [ticker, setTicker] = useState('');
  const [assetClass, setAssetClass] = useState<string>(INVESTMENT_CLASSES[0]);
  const [quantity, setQuantity] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [averagePrice, setAveragePrice] = useState<number>(0);
  const [totalDividends, setTotalDividends] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;

    addAsset({
      ticker: ticker.toUpperCase(),
      class: assetClass,
      quantity,
      currentPrice,
      averagePrice,
      totalDividends,
      score,
      note,
      idealPercentage: 0
    });

    onCancel();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <PageHeader
        title="Novo Ativo"
        description="Adicione um novo ativo à sua carteira de investimentos."
        action={
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold px-4 py-2 rounded-xl transition-all"
          >
            <X size={20} /> Cancelar
          </button>
        }
      />

      <div className="max-w-4xl">
        <Card padding="large">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Ticker / Símbolo</label>
                  <input
                    type="text" required
                    placeholder="Ex: PETR4, IVVB11, BTC"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold uppercase"
                    value={ticker}
                    onChange={e => setTicker(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Classe de Ativo</label>
                  <select
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold appearance-none cursor-pointer"
                    value={assetClass}
                    onChange={e => setAssetClass(e.target.value)}
                  >
                    {INVESTMENT_CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Quantidade</label>
                    <input
                      type="number" step="any" required
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-mono font-bold"
                      value={quantity || ''}
                      onChange={e => setQuantity(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cotação Atual (R$)</label>
                    <input
                      type="number" step="any" required
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-mono font-bold"
                      value={currentPrice || ''}
                      onChange={e => setCurrentPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Preço Médio (R$)</label>
                    <input
                      type="number" step="any" required
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-mono font-bold"
                      value={averagePrice || ''}
                      onChange={e => setAveragePrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Proventos (R$)</label>
                    <input
                      type="number" step="any"
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-green-600 transition-all font-mono font-bold text-green-600"
                      placeholder="Total recebido"
                      value={totalDividends || ''}
                      onChange={e => setTotalDividends(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Strategy Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Sua Nota (0 - 15)</label>
                  <input
                    type="number" min="0" max="15"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all font-mono font-bold text-blue-600"
                    value={score}
                    onChange={e => setScore(Number(e.target.value))}
                  />
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 flex gap-2">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-400 leading-tight">
                      A nota define o peso deste ativo no rebalanceamento. Quanto maior a nota, maior a fatia ideal dele na carteira.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Observações / Tese</label>
                  <textarea
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all min-h-[140px] resize-none"
                    placeholder="Por que você está investindo neste ativo?"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-slate-400 italic">
                * Todos os campos marcados são obrigatórios.
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> Salvar Ativo
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NovoAtivo;
