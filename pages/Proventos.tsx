
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import {
    Plus, Filter, Calendar, BarChart3, TrendingUp,
    ChevronRight, Trash2, Search, Info, Pencil
} from 'lucide-react';
import { PageHeader, Card, Badge } from '../components/ui';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import DividendModal from '../components/DividendModal';
import { Dividend } from '../types';

const Proventos: React.FC<{ onPageChange: (p: string) => void }> = ({ onPageChange }) => {
    const { dividends, deleteDividend, assets } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDividend, setEditingDividend] = useState<Dividend | null>(null);

    // Page Filters
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'MÊS' | 'ANO'>('MÊS');
    const [rankingMetric, setRankingMetric] = useState<'%' | 'VALOR'>('%');
    const [rankingViewMode, setRankingViewMode] = useState<'MÊS' | 'ANO'>('MÊS');

    // Advanced Filters
    const [selectedClass, setSelectedClass] = useState('Todas');
    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedTicker, setSelectedTicker] = useState('Todos');

    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    // Available values for filters
    const classes = ['Todas', ...Array.from(new Set(dividends.map(d => d.class)))];
    const types = ['Todos', 'Dividendos', 'JSCP', 'Rendimento'];
    const tickers = ['Todos', ...Array.from(new Set(dividends.map(d => d.ticker)))];

    // Filter Dividends
    const filteredDividends = useMemo(() => {
        return dividends.filter(d => {
            const [y, m] = d.date.split('-').map(Number);

            // Time filter
            if (viewMode === 'MÊS') {
                if (m - 1 !== month || y !== year) return false;
            } else {
                if (y !== year) return false;
            }

            // Category filters
            if (selectedClass !== 'Todas' && d.class !== selectedClass) return false;
            if (selectedType !== 'Todos' && d.type !== selectedType) return false;
            if (selectedTicker !== 'Todos' && d.ticker !== selectedTicker) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dividends, month, year, viewMode, selectedClass, selectedType, selectedTicker]);

    const totalInView = filteredDividends.reduce((acc, d) => acc + d.totalValue, 0);

    // Chart Data
    const chartData = useMemo(() => {
        if (viewMode === 'MÊS') {
            // Show last 12 months including selected
            return Array.from({ length: 12 }).map((_, i) => {
                const d = new Date(year, month - (11 - i), 1);
                const mKey = d.getMonth();
                const yKey = d.getFullYear();

                const val = dividends
                    .filter(div => {
                        const [dvY, dvM] = div.date.split('-').map(Number);
                        if (dvM - 1 !== mKey || dvY !== yKey) return false;
                        if (selectedClass !== 'Todas' && div.class !== selectedClass) return false;
                        if (selectedType !== 'Todos' && div.type !== selectedType) return false;
                        if (selectedTicker !== 'Todos' && div.ticker !== selectedTicker) return false;
                        return true;
                    })
                    .reduce((acc, div) => acc + div.totalValue, 0);

                return {
                    name: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                    year: d.getFullYear().toString().slice(-2),
                    fullDate: d,
                    value: val,
                    isCurrent: mKey === month && yKey === year
                };
            });
        } else {
            // Show last 5 years
            return Array.from({ length: 5 }).map((_, i) => {
                const yKey = year - (4 - i);
                const val = dividends
                    .filter(div => {
                        const [dvY] = div.date.split('-').map(Number);
                        if (dvY !== yKey) return false;
                        if (selectedClass !== 'Todas' && div.class !== selectedClass) return false;
                        if (selectedType !== 'Todos' && div.type !== selectedType) return false;
                        if (selectedTicker !== 'Todos' && div.ticker !== selectedTicker) return false;
                        return true;
                    })
                    .reduce((acc, div) => acc + div.totalValue, 0);

                return {
                    name: yKey.toString(),
                    fullDate: new Date(yKey, month, 15),
                    value: val,
                    isCurrent: yKey === year
                };
            });
        }
    }, [dividends, month, year, viewMode, selectedClass, selectedType, selectedTicker]);

    // Data for Ranking Chart
    const rankingData = useMemo(() => {
        const pool = dividends.filter(d => {
            const [y, m] = d.date.split('-').map(Number);
            const dDate = new Date(y, m - 1, 15);

            if (rankingViewMode === 'MÊS') {
                return m - 1 === month && y === year;
            } else {
                // Consolidado 12 meses (TTM) - 11 months back + current
                const start = new Date(year, month - 11, 1);
                const end = new Date(year, month, 31);
                return dDate >= start && dDate <= end;
            }
        }).filter(d => {
            if (selectedClass !== 'Todas' && d.class !== selectedClass) return false;
            if (selectedType !== 'Todos' && d.type !== selectedType) return false;
            if (selectedTicker !== 'Todos' && d.ticker !== selectedTicker) return false;
            return true;
        });

        const groups: Record<string, { ticker: string, class: string, total: number, unitSum: number }> = {};

        pool.forEach(d => {
            if (!groups[d.ticker]) {
                groups[d.ticker] = {
                    ticker: d.ticker,
                    class: d.class,
                    total: 0,
                    unitSum: 0
                };
            }
            groups[d.ticker].total += d.totalValue;
            groups[d.ticker].unitSum += d.valuePerShare;
        });

        const result = Object.values(groups).map(g => {
            const asset = assets.find(a => a.ticker === g.ticker);
            const avgPrice = asset?.averagePrice || 0;
            const yieldVal = avgPrice > 0 ? (g.unitSum / avgPrice) * 100 : 0;

            return {
                name: g.ticker,
                class: g.class,
                total: g.total,
                yield: yieldVal
            };
        });

        return result.sort((a, b) => rankingMetric === '%' ? b.yield - a.yield : b.total - a.total).slice(0, 10);
    }, [dividends, assets, rankingMetric, rankingViewMode, month, year, selectedClass, selectedType, selectedTicker]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Proventos"
                description="Acompanhe o rendimento da sua carteira."
                action={
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <input
                                type="month"
                                className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                                value={`${year}-${String(month + 1).padStart(2, '0')}`}
                                onChange={(e) => {
                                    const [y, m] = e.target.value.split('-');
                                    setSelectedDate(new Date(parseInt(y), parseInt(m) - 1, 15));
                                }}
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingDividend(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
                        >
                            <Plus size={18} /> Registrar
                        </button>
                    </div>
                }
            />

            {/* Advanced Filters */}
            <Card padding="small">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Classe</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-bold outline-none"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Provento</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-bold outline-none"
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                        >
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Produto</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-bold outline-none"
                            value={selectedTicker}
                            onChange={e => setSelectedTicker(e.target.value)}
                        >
                            {tickers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                            Filtrar
                        </button>
                    </div>
                </div>
            </Card>

            {/* Chart Section */}
            <Card className="overflow-visible" padding="small">
                <div className="flex flex-col items-center gap-1 mb-2">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
                        {(['MÊS', 'ANO'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${viewMode === mode
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-left">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                <p className="text-lg font-black text-blue-600">{formatCurrency(payload[0].value as number)}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Clique para ver detalhes</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                label={{
                                    position: 'top',
                                    fill: '#64748b',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    formatter: (val: number) => val > 0 ? formatCurrency(val).replace('R$', '').trim() : ''
                                }}
                                onClick={(data) => {
                                    if (data && data.fullDate) {
                                        setSelectedDate(data.fullDate);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isCurrent ? '#3b82f6' : '#1e1b4b'} // Blue for current, dark for others
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total recebido</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalInView)}</span>
                </div>
            </Card>

            {/* Ranking Chart Section */}
            <Card className="overflow-visible" padding="small" title={`Ranking de Ativos - ${rankingViewMode === 'MÊS' ? 'Mês' : '12 Meses'}`}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                    {/* Time Toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-100 dark:border-slate-700">
                        {(['MÊS', 'ANO'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setRankingViewMode(mode)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${rankingViewMode === mode
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {mode === 'MÊS' ? 'MÊS SELECIONADO' : '12 MESES'}
                            </button>
                        ))}
                    </div>

                    {/* Metric Toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setRankingMetric('%')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${rankingMetric === '%'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            % RENDIMENTO
                        </button>
                        <button
                            onClick={() => setRankingMetric('VALOR')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${rankingMetric === 'VALOR'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            PROVENTOS TOTAIS
                        </button>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={({ x, y, payload }) => {
                                    const item = rankingData.find(d => d.name === payload.value);
                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={0} dy={16} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#334155">
                                                {payload.value}
                                            </text>
                                            <text x={0} y={0} dy={28} textAnchor="middle" fontSize={8} fontWeight="bold" fill="#94a3b8" className="uppercase">
                                                {item?.class}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-left">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">{data.name}</p>
                                                    <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{data.class}</span>
                                                </div>
                                                <p className="text-lg font-black text-blue-600">
                                                    {rankingMetric === '%'
                                                        ? `${data.yield.toFixed(2)}%`
                                                        : formatCurrency(data.total)
                                                    }
                                                </p>
                                                {rankingMetric === '%' && (
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                        Total: {formatCurrency(data.total)}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey={rankingMetric === '%' ? 'yield' : 'total'}
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                label={{
                                    position: 'top',
                                    fill: '#64748b',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    formatter: (val: number) => rankingMetric === '%'
                                        ? `${val.toFixed(2)}%`
                                        : formatCurrency(val).replace('R$', '').trim()
                                }}
                            >
                                {rankingData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? '#3b82f6' : '#1e1b4b'} // Stronger blue for leader
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* List / Table */}
            <Card padding="none" title="Registros Detalhados">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Ativo</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 text-right">Unitário</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {filteredDividends.length > 0 ? filteredDividends.map((d) => (
                                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                        {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{d.ticker}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{d.class}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge label={d.type} variant="category" />
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                                        {formatCurrency(d.valuePerShare)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-blue-600 font-mono text-base">
                                        {formatCurrency(d.totalValue)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingDividend(d);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Deseja realmente excluir este registro?')) {
                                                        deleteDividend(d.id);
                                                    }
                                                }}
                                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                        Nenhum registro encontrado para {viewMode === 'MÊS' ? 'este mês' : 'este ano'}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <DividendModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDividend(null);
                }}
                editingDividend={editingDividend}
            />
        </div>
    );
};

export default Proventos;
