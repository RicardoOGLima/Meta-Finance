import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card } from '../components/ui';
import { formatCurrency } from '../utils/calculations';
import { ChevronRight, ChevronDown, Filter, Info } from 'lucide-react';

const Forecast: React.FC = () => {
    const { transactions } = useApp();
    const [numMonths] = useState(6); // Fixed at 6 as requested
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const now = useMemo(() => new Date(), []);

    // Future display months
    const months = useMemo(() => {
        const result = [];
        const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

        for (let i = 0; i < numMonths; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            result.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
                month: d.getMonth(),
                year: d.getFullYear(),
                isCurrent: isThisMonth(d)
            });
        }
        return result;
    }, [now, numMonths]);

    // Historical Average Calculation (Past 3 months)
    const averages = useMemo(() => {
        const pastMonths = [];
        for (let i = 1; i <= 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            pastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const stats: Record<string, { type: 'RECCEITA' | 'DESPESA', subcategories: Record<string, number> }> = {};

        transactions.forEach(t => {
            const d = new Date(t.date);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            // Inteligência: Não incluir parcelas na média histórica, pois elas têm fim definido
            // e já estão registradas como "Real" nos meses futuros até acabarem.
            const isInstallment = (t.installments && t.installments > 1) || /\d+\/\d+/.test(t.description || '');

            if (pastMonths.includes(monthKey) && !isInstallment) {
                const cat = t.category || 'Outros';
                const sub = t.subcategory || 'Diversos';
                if (!stats[cat]) stats[cat] = { type: t.type as any, subcategories: {} };
                stats[cat].subcategories[sub] = (stats[cat].subcategories[sub] || 0) + t.value;
            }
        });

        // Divide by 3 to get average
        Object.keys(stats).forEach(cat => {
            Object.keys(stats[cat].subcategories).forEach(sub => {
                stats[cat].subcategories[sub] = stats[cat].subcategories[sub] / 3;
            });
        });

        return stats;
    }, [transactions, now]);

    // Pivot logic: Group by Type -> Category -> Subcategory -> Month
    // Returns { real: number, projected: number }
    const pivotData = useMemo(() => {
        const data: Record<string, any> = {
            RECCEITA: { total: {}, categories: {} },
            DESPESA: { total: {}, categories: {} }
        };

        // 1. Fill with REAL data from registered transactions
        transactions.forEach(t => {
            const d = new Date(t.date);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!months.some(m => m.key === monthKey)) return;

            const type = t.type as 'RECCEITA' | 'DESPESA';
            const cat = t.category || 'Outros';
            const sub = t.subcategory || (type === 'RECCEITA' ? '' : 'Diversos');

            if (!data[type].categories[cat]) {
                data[type].categories[cat] = { total: {}, subcategories: {} };
            }
            if (!data[type].categories[cat].subcategories[sub]) {
                data[type].categories[cat].subcategories[sub] = {};
            }

            const cell = data[type].categories[cat].subcategories[sub][monthKey] || { real: 0, total: 0 };
            cell.real += t.value;
            cell.total += t.value;
            data[type].categories[cat].subcategories[sub][monthKey] = cell;
        });

        // 2. Fill with PROJECTED data (Averages)
        Object.keys(averages).forEach(cat => {
            const type = averages[cat].type;
            Object.keys(averages[cat].subcategories).forEach(sub => {
                months.forEach(m => {
                    if (!data[type].categories[cat]) {
                        data[type].categories[cat] = { total: {}, subcategories: {} };
                    }
                    if (!data[type].categories[cat].subcategories[sub]) {
                        data[type].categories[cat].subcategories[sub] = {};
                    }

                    const cell = data[type].categories[cat].subcategories[sub][m.key] || { real: 0, total: 0 };
                    const avg = averages[cat].subcategories[sub];
                    if (cell.real < avg) {
                        cell.total = avg;
                    }
                    data[type].categories[cat].subcategories[sub][m.key] = cell;
                });
            });
        });

        // 3. Roll up totals (Sub -> Cat -> Type)
        const types = ['RECCEITA', 'DESPESA'];
        types.forEach(type => {
            Object.keys(data[type].categories).forEach(cat => {
                const catObj = data[type].categories[cat];
                Object.keys(catObj.subcategories).forEach(sub => {
                    const subObj = catObj.subcategories[sub];
                    months.forEach(m => {
                        const cell = subObj[m.key] || { real: 0, total: 0 };
                        catObj.total[m.key] = catObj.total[m.key] || { real: 0, total: 0 };
                        catObj.total[m.key].real += cell.real;
                        catObj.total[m.key].total += cell.total;

                        data[type].total[m.key] = data[type].total[m.key] || { real: 0, total: 0 };
                        data[type].total[m.key].real += cell.real;
                        data[type].total[m.key].total += cell.total;
                    });
                });
            });
        });

        return data;
    }, [transactions, months, averages]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const renderCell = (cell: { real: number, total: number } | undefined, isRevenue: boolean = false) => {
        if (!cell || (cell.real === 0 && cell.total === 0)) return <div className="flex flex-col items-center"><span className="text-slate-200">-</span></div>;

        // Determine colors based on type and value
        const realColor = isRevenue ? 'text-green-700' : 'text-slate-900';

        return (
            <div className="flex flex-col items-center leading-tight">
                <span className={`font-mono text-xs font-bold ${realColor}`}>{formatCurrency(cell.real)}</span>
                {cell.total > cell.real && (
                    <span className="text-[10px] text-slate-400 font-mono italic">
                        ({formatCurrency(cell.total)})
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Forecast Financeiro"
                description="Acompanhe o planejado vs realizado nos próximos 6 meses."
            />

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-5 sticky left-0 bg-slate-50 z-10 w-80">Descrição</th>
                                {months.map(m => (
                                    <th key={m.key} className={`px-2 py-5 text-center border-l border-slate-100 uppercase ${m.isCurrent ? 'bg-blue-50/50 text-blue-600' : ''}`}>
                                        {m.label}
                                        {m.isCurrent && <div className="text-[8px] font-black tracking-tighter text-blue-400 mt-1">ATUAL</div>}
                                    </th>
                                ))}
                                <th className="px-6 py-5 text-right border-l border-slate-100 bg-slate-100/50">Total</th>
                            </tr>
                        </thead>

                        <tbody className="text-sm">
                            {/* --- RECEITAS --- */}
                            <tr className="bg-green-50/50">
                                <td className="px-6 py-3 font-black text-green-700 uppercase tracking-tighter sticky left-0 bg-green-50/50">Receitas Totais</td>
                                {months.map(m => (
                                    <td key={m.key} className={`px-2 py-3 text-center border-l border-green-100/30 ${m.isCurrent ? 'bg-green-100/20' : ''}`}>
                                        {renderCell(pivotData.RECCEITA.total[m.key], true)}
                                    </td>
                                ))}
                                <td className="px-6 py-3 text-right font-black border-l border-green-100/30 text-green-700">
                                    {formatCurrency(months.reduce((acc, m) => acc + (pivotData.RECCEITA.total[m.key]?.total || 0), 0))}
                                </td>
                            </tr>
                            {Object.keys(pivotData.RECCEITA.categories).sort().map(cat => (
                                <tr key={cat} className="border-t border-slate-50 hover:bg-slate-50/50">
                                    <td className="px-10 py-3 text-slate-600 font-medium sticky left-0 bg-white group-hover:bg-slate-50">
                                        {cat}
                                    </td>
                                    {months.map(m => (
                                        <td key={m.key} className={`px-2 py-3 text-center border-l border-slate-50 ${m.isCurrent ? 'bg-blue-50/10' : ''}`}>
                                            {renderCell(pivotData.RECCEITA.categories[cat].total[m.key], true)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-3 text-right text-slate-400 font-mono text-xs italic">
                                        {formatCurrency(months.reduce((acc, m) => acc + (pivotData.RECCEITA.categories[cat].total[m.key]?.total || 0), 0))}
                                    </td>
                                </tr>
                            ))}

                            {/* Spacing */}
                            <tr className="h-4"></tr>

                            {/* --- DESPESAS --- */}
                            <tr className="bg-red-50/50">
                                <td className="px-6 py-3 font-black text-red-700 uppercase tracking-tighter sticky left-0 bg-red-50/50">Despesas Totais</td>
                                {months.map(m => (
                                    <td key={m.key} className={`px-2 py-3 text-center border-l border-red-100/30 ${m.isCurrent ? 'bg-red-100/20' : ''}`}>
                                        {renderCell(pivotData.DESPESA.total[m.key], false)}
                                    </td>
                                ))}
                                <td className="px-6 py-3 text-right font-black border-l border-red-100/30 text-red-700">
                                    {formatCurrency(months.reduce((acc, m) => acc + (pivotData.DESPESA.total[m.key]?.total || 0), 0))}
                                </td>
                            </tr>
                            {Object.keys(pivotData.DESPESA.categories).sort().map(cat => {
                                const isExpanded = expandedCategories[cat];
                                return (
                                    <React.Fragment key={cat}>
                                        <tr className={`border-t border-slate-50 transition-colors ${isExpanded ? 'bg-slate-50/80' : 'hover:bg-slate-50'}`}>
                                            <td className="px-8 py-4 font-bold sticky left-0 bg-white group-hover:bg-slate-50">
                                                <button
                                                    onClick={() => toggleCategory(cat)}
                                                    className="flex items-center gap-2 text-slate-700 hover:text-blue-600 text-left"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                                                    {cat}
                                                </button>
                                            </td>
                                            {months.map(m => (
                                                <td key={m.key} className={`px-2 py-4 text-center border-l border-slate-50 ${m.isCurrent ? 'bg-blue-50/10' : ''}`}>
                                                    {renderCell(pivotData.DESPESA.categories[cat].total[m.key], false)}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-right font-bold text-slate-400 font-mono text-xs italic">
                                                {formatCurrency(months.reduce((acc, m) => acc + (pivotData.DESPESA.categories[cat].total[m.key]?.total || 0), 0))}
                                            </td>
                                        </tr>
                                        {isExpanded && Object.keys(pivotData.DESPESA.categories[cat].subcategories).sort().map(sub => (
                                            <tr key={`${cat}-${sub}`} className="border-t border-slate-50 bg-slate-50/30">
                                                <td className="px-14 py-2 text-xs text-slate-400 italic sticky left-0">{sub}</td>
                                                {months.map(m => (
                                                    <td key={m.key} className={`px-2 py-2 text-center border-l border-slate-50/50 ${m.isCurrent ? 'bg-blue-50/10' : ''}`}>
                                                        {renderCell(pivotData.DESPESA.categories[cat].subcategories[sub][m.key], false)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-2 text-right text-slate-300 font-mono text-[10px]">
                                                    {formatCurrency(months.reduce((acc, m) => acc + (pivotData.DESPESA.categories[cat].subcategories[sub][m.key]?.total || 0), 0))}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}

                            {/* --- SALDO FINAL --- */}
                            <tr className="bg-slate-900 text-white font-bold h-16">
                                <td className="px-6 py-3 uppercase tracking-widest text-xs sticky left-0 bg-slate-900 leading-relaxed">Resultado<br />Líquido</td>
                                {months.map(m => {
                                    const inc = pivotData.RECCEITA.total[m.key]?.total || 0;
                                    const exp = pivotData.DESPESA.total[m.key]?.total || 0;
                                    const realInc = pivotData.RECCEITA.total[m.key]?.real || 0;
                                    const realExp = pivotData.DESPESA.total[m.key]?.real || 0;
                                    const saldoReal = realInc - realExp;
                                    const saldoTotal = inc - exp;

                                    return (
                                        <td key={m.key} className={`px-2 py-3 text-center border-l border-slate-800 ${m.isCurrent ? 'bg-slate-800/50' : ''}`}>
                                            <div className="flex flex-col items-center leading-tight">
                                                <span className={`text-sm ${saldoReal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatCurrency(saldoReal)}
                                                </span>
                                                {Math.abs(saldoTotal - saldoReal) > 0.01 && (
                                                    <span className={`text-[10px] opacity-40 italic font-mono`}>
                                                        ({formatCurrency(saldoTotal)})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-3 text-right bg-slate-800">
                                    {formatCurrency(months.reduce((acc, m) => acc + ((pivotData.RECCEITA.total[m.key]?.total || 0) - (pivotData.DESPESA.total[m.key]?.total || 0)), 0))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                <Info className="text-blue-600 shrink-0 mt-1" size={20} />
                <div className="space-y-1">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Como funciona a Projeção Inteligente?</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        1. <strong>Gastos Variáveis:</strong> Calculamos a média dos últimos 3 meses (excluindo parcelas) para projetar gastos recorrentes.<br />
                        2. <strong>Parcelas:</strong> Custos parcelados são identificados e exibidos apenas nos meses em que ainda estão ativos. Quando uma parcela (ex: 12/12) termina, ela deixa de aparecer na projeção automaticamente, sem poluir a média futura.<br />
                        3. <strong>Visualização:</strong> O valor em destaque é o <strong>Real</strong> já registrado. O valor entre parênteses é o <strong>Total Projetado</strong> (Média + Diferença se o real for menor que a média).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Forecast;
