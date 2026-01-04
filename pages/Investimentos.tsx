
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePortfolioMetrics, formatCurrency } from '../utils/calculations';
import { Plus, Edit2, Trash2, Star, Info, Filter, Zap, ChevronRight } from 'lucide-react';
import { Asset } from '../types';
import { PageHeader, Badge, Card } from '../components/ui';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const Investimentos: React.FC<{ onPageChange: (p: string) => void }> = ({ onPageChange }) => {
  const { assets, dividends, investmentGoals, deleteAsset, updateAsset, theme } = useApp();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterClass, setFilterClass] = useState('Todas');

  // Calculate dynamic dividends for each asset ticker
  const assetsWithDividends = useMemo(() => {
    return assets.map(asset => {
      const assetDividends = dividends
        .filter(d => d.assetId === asset.id)
        .reduce((sum, d) => sum + d.totalValue, 0);

      return {
        ...asset,
        totalDividends: assetDividends
      };
    });
  }, [assets, dividends]);

  const { totalValue, metrics, classAllocation } = calculatePortfolioMetrics(assetsWithDividends, investmentGoals);

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

  // Advanced Sleeping Point Logic
  const scatterData = filteredMetrics.map(m => {
    const classMeta = investmentGoals.find(g => g.class === m.class)?.percentage || 0;
    const weightedQuality = (m.score || 0) * (classMeta / 100);
    const gapRealVsIdeal = m.currentPercentage - m.idealPercentage;

    return {
      x: parseFloat(weightedQuality.toFixed(2)),
      y: parseFloat(gapRealVsIdeal.toFixed(2)),
      z: Math.min(m.currentPercentage * 10, 500), // Bubble size
      ticker: m.ticker,
      class: m.class,
      realWeight: m.currentPercentage,
      idealWeight: m.idealPercentage,
      score: m.score || 0
    };
  });

  const avgX = scatterData.length > 0
    ? scatterData.reduce((acc, d) => acc + d.x, 0) / scatterData.length
    : 0;

  // Symmetrical domains for centering quadrants
  const maxXDiff = scatterData.length > 0 ? Math.max(...scatterData.map(d => Math.abs(d.x - avgX)), 0.1) : 1;
  const xDomain = [Math.max(0, avgX - maxXDiff * 1.2), avgX + maxXDiff * 1.2];

  const maxYDiff = scatterData.length > 0 ? Math.max(...scatterData.map(d => Math.abs(d.y)), 1) : 5;
  const yDomain = [-maxYDiff * 1.3, maxYDiff * 1.3];

  const getQuadrantColor = (d: any) => {
    if (d.x < avgX && d.y > 0) return '#f59e0b'; // Q1: Yellow (Risco)
    if (d.x >= avgX && d.y > 0) return '#2563eb'; // Q2: Blue (Bom)
    if (d.x < avgX && d.y <= 0) return '#ef4444'; // Q3: Red (Atenção)
    return '#10b981'; // Q4: Green (Oportunidade)
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.ticker}</p>
          <div className="mt-1 space-y-1">
            <p className="text-[10px] text-slate-500">Qualidade Ponderada: <span className="text-slate-900 dark:text-slate-100 font-bold">{data.x}</span></p>
            <p className="text-[10px] text-slate-500">Gap (Real - Ideal): <span className={`${data.y >= 0 ? 'text-blue-600' : 'text-red-500'} font-bold`}>{data.y}%</span></p>
            <p className="text-[10px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
              Nota: {data.score} | Real: {data.realWeight.toFixed(1)}% | Ideal: {data.idealWeight.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Investimentos"
        description="Gestão de ativos e rebalanceamento."
        action={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Filter size={16} className="text-slate-400" />
              <select
                className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
              >
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => onPageChange('novo-ativo')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
            >
              <Plus size={18} /> Novo Ativo
            </button>
          </div>
        }
      />

      {/* Top Section: Summary + Sleeping Point */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Patrimônio Investido</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</h3>
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Distribuição por Classe</h4>
            <div className="space-y-5">
              {classAllocation.map(c => (
                <div key={c.name} className="space-y-2 group">
                  <div className="flex justify-between items-center">
                    <Badge label={c.name} variant="investment" />
                    <div className="flex gap-3 items-center text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tighter">Meta {c.meta}%</span>
                      <span className="text-blue-600 dark:text-blue-400 text-sm">{c.value.toFixed(1)}%</span>
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
          </div>
        </Card>

        <Card className="lg:col-span-8 overflow-hidden min-h-[500px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                The Sleeping Point
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Relação Qualidade Ponderada vs. Gap (% Real - % Ideal)</p>
            </div>
            <div className="flex gap-4 pr-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Qualidade</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300">{avgX.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Qualidade"
                  domain={xDomain}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Gap"
                  unit="%"
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="z" range={[80, 500]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                {/* Quadrant Lines */}
                <ReferenceLine x={avgX} stroke="#94a3b8" strokeDasharray="5 5" label={{ position: 'top', value: 'Média', fill: '#94a3b8', fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" label={{ position: 'right', value: 'Alvo', fill: '#94a3b8', fontSize: 10 }} />

                <Scatter name="Ativos" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getQuadrantColor(entry)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2563eb]"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-blue-600">Focado (Boa Qualid.)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-emerald-600">Oportunidade (Comprar)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-amber-600">Risco (Exposição Alta)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-red-600">Atenção (Qualid. Baixa)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-[10px]">Ativo</th>
                <th className="px-6 py-5 text-right text-[10px]">Preço Médio</th>
                <th className="px-6 py-5 text-right text-[10px]">Cotação</th>
                <th className="px-6 py-5 text-right text-[10px]">Rendimento</th>
                <th className="px-6 py-5 text-right text-[10px]">Yield (YoC)</th>
                <th className="px-6 py-5 text-right text-[10px]">Retorno Total</th>
                <th className="px-6 py-5 text-center text-[10px]">Ideal %</th>
                <th className="px-6 py-5 text-center text-[10px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredMetrics.length > 0 ? [...filteredMetrics].sort((a, b) => a.class.localeCompare(b.class) || a.ticker.localeCompare(b.ticker)).map((item) => {
                const a = item as Asset & { idealPercentage: number; gap: number };
                const valorizacao = a.averagePrice > 0 ? ((a.currentPrice - a.averagePrice) / a.averagePrice) * 100 : 0;
                const yieldOnCost = (a.averagePrice > 0 && a.quantity > 0) ? (a.totalDividends / (a.quantity * a.averagePrice)) * 100 : 0;
                const totalReturn = valorizacao + yieldOnCost;

                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{a.ticker}</span>
                        <Badge label={a.class} variant="investment" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">{formatCurrency(a.averagePrice || 0)}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold">{formatCurrency(a.currentPrice)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold ${valorizacao >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {valorizacao >= 0 ? '+' : ''}{valorizacao.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                        {yieldOnCost.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black ${totalReturn >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'} px-2 py-1 rounded-lg`}>
                        {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="font-mono text-xs text-blue-600 font-bold">{a.idealPercentage.toFixed(1)}%</span>
                        {Math.abs(a.gap) >= 0.1 ? (
                          <>
                            <span className={`text-[10px] mt-1 ${a.gap >= 0 ? 'text-green-600' : 'text-amber-500'}`}>
                              {Math.abs(a.gap).toFixed(1)}%
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-tighter ${a.gap >= 0 ? 'text-green-600' : 'text-amber-500'}`}>
                              {a.gap >= 0 ? 'Comprar' : 'Excesso'}
                            </span>
                          </>
                        ) : (
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-400 mt-2">
                            Alvo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingAsset(a)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    {filterClass === 'Todas' ? 'Nenhum ativo em carteira.' : `Nenhum ativo encontrado na classe "${filterClass}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                  onChange={e => setEditingAsset({ ...editingAsset, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 font-mono">Preço Atual (R$)</label>
                  <input
                    type="number" step="any"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-mono"
                    value={editingAsset.currentPrice}
                    onChange={e => setEditingAsset({ ...editingAsset, currentPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 font-mono">P. Médio (R$)</label>
                  <input
                    type="number" step="any"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-mono"
                    value={editingAsset.averagePrice || 0}
                    onChange={e => setEditingAsset({ ...editingAsset, averagePrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 text-blue-600">Nota (0-15)</label>
                <input
                  type="number" min="0" max="15"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.score || 0}
                  onChange={e => setEditingAsset({ ...editingAsset, score: Math.min(15, Math.max(0, Number(e.target.value))) })}
                />
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                  <span className="shrink-0"><Info size={10} /></span> O % Ideal é ajustado automaticamente baseando-se nesta nota.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Observação</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none min-h-[80px] focus:ring-2 focus:ring-blue-600 transition-colors"
                  value={editingAsset.note}
                  onChange={e => setEditingAsset({ ...editingAsset, note: e.target.value })}
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
