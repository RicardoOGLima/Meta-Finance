import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Brain, Sparkles, Clock, ChevronRight, Search, FileSignature } from 'lucide-react';
import { PageHeader, Card, Badge } from '../components/ui';
import { storage } from '../utils/storage';
import { TophAI } from '../utils/analyst';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const Insights: React.FC = () => {
    const { transactions, assets, dividends, budgetGoals, investmentGoals, subcategories } = useApp();
    const [insights, setInsights] = useState<{ name: string, path: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        setLoading(true);
        const list = await storage.listInsights();
        // Sort by name (assuming dates in name like Analise_YYYY_MM_DD.md)
        const sortedList = list.sort((a, b) => b.name.localeCompare(a.name));
        setInsights(sortedList);

        if (sortedList.length > 0 && !selectedInsight) {
            handleSelectInsight(sortedList[0].name);
        }
        setLoading(false);
    };

    const handleManualGenerate = async () => {
        const stateValues = {
            transactions, assets, dividends, budgetGoals, investmentGoals, subcategories
        };

        const report = TophAI.generateReport(stateValues, 'weekly');
        await storage.saveInsight(report.name, report.content);
        toast.success("Toph AI: Novo relatório gerado sob demanda!");
        loadInsights();
    };

    const handleSelectInsight = async (name: string) => {
        setSelectedInsight(name);
        setContent(''); // Clear previous
        const text = await storage.readInsight(name);
        if (!text) {
            setContent('### ⚠️ Erro ao carregar arquivo\n\nNão foi possível ler o conteúdo do arquivo ou ele está vazio. Verifique se as permissões de acesso estão corretas ou tente reiniciar o aplicativo.');
        } else {
            setContent(text);
        }
    };

    const filteredInsights = insights.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPrioritizedInsights = () => {
        if (searchTerm) {
            return {
                priority: [],
                history: filteredInsights
            };
        }

        const weekly = filteredInsights.filter(i => i.name.toLowerCase().includes('semanal')).sort((a, b) => b.name.localeCompare(a.name));
        const monthly = filteredInsights.filter(i => i.name.toLowerCase().includes('mensal')).sort((a, b) => b.name.localeCompare(a.name));

        const topWeekly = weekly.slice(0, 1);
        const topMonthly = monthly.slice(0, 2);

        const priorityIds = new Set([...topWeekly, ...topMonthly].map(i => i.name));
        const historyList = filteredInsights.filter(i => !priorityIds.has(i.name));

        return {
            priority: [...topWeekly, ...topMonthly],
            history: historyList
        };
    };

    const { priority, history } = getPrioritizedInsights();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Toph AI"
                description="Relatórios estratégicos e análises analíticas geradas localmente."
                action={
                    <button
                        onClick={handleManualGenerate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl border border-blue-500 shadow-lg shadow-blue-500/20 transition-all font-bold text-sm"
                    >
                        <Sparkles size={18} />
                        Gerar Agora
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Sidebar de Documentos */}
                <div className="lg:col-span-1 space-y-4">
                    <Card title="Documentos" padding="none">
                        <div className="p-4 border-b dark:border-slate-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar análise..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                />
                            </div>
                        </div>

                        <div className="max-h-[440px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 animate-pulse">
                                    <Clock size={24} className="mx-auto mb-2" />
                                    Carregando...
                                </div>
                            ) : filteredInsights.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <FileText size={24} className="mx-auto mb-2 opacity-20" />
                                    Nenhum insight encontrado.
                                </div>
                            ) : (
                                <>
                                    {priority.length > 0 && !searchTerm && (
                                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Destaques</div>
                                    )}
                                    {priority.map((insight) => (
                                        <InsightButton
                                            key={insight.name}
                                            insight={insight}
                                            selected={selectedInsight === insight.name}
                                            onClick={() => handleSelectInsight(insight.name)}
                                        />
                                    ))}

                                    {history.length > 0 && !searchTerm && (
                                        <div className="px-3 py-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico</div>
                                    )}
                                    {history.map((insight) => (
                                        <InsightButton
                                            key={insight.name}
                                            insight={insight}
                                            selected={selectedInsight === insight.name}
                                            onClick={() => handleSelectInsight(insight.name)}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </Card>

                    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                            <Brain size={16} />
                            Toph AI Status
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">
                            A Toph AI analisa seus dados localmente toda <b>segunda-feira</b> e gera o fechamento mensal até o <b>5º dia</b> de cada mês.
                        </p>
                    </div>
                </div>

                {/* Conteúdo do Markdown */}
                <div className="lg:col-span-3">
                    {selectedInsight ? (
                        <Card padding="large">
                            <div className="prose prose-slate dark:prose-invert max-w-none 
                prose-headings:font-black prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8 prose-h1:text-blue-600 dark:prose-h1:text-blue-400
                prose-h2:text-xl prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b dark:prose-h2:border-slate-800
                prose-h3:text-2xl prose-h3:mb-4 prose-h3:text-slate-900 dark:prose-h3:text-white
                prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
                prose-em:text-[11px] prose-em:text-slate-400 dark:prose-em:text-slate-500 prose-em:not-italic
                prose-strong:text-slate-900 dark:prose-strong:text-white
                prose-table:border prose-table:rounded-xl prose-table:overflow-hidden 
                prose-th:bg-slate-50 dark:prose-th:bg-slate-900/50 prose-th:p-4
                prose-td:p-4 prose-td:border-t dark:prose-td:border-slate-800
                prose-li:text-slate-600 dark:prose-li:text-slate-400
              ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Brain size={48} className="opacity-10" />
                            <p className="font-medium">Selecione um documento para visualizar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InsightButton: React.FC<{
    insight: { name: string },
    selected: boolean,
    onClick: () => void
}> = ({ insight, selected, onClick }) => {
    const isMonthly = insight.name.includes('Mensal');
    const isWeekly = insight.name.includes('Semanal');

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
        >
            <div className={`p-2 rounded-lg ${selected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {isMonthly ? <FileSignature size={16} /> : <Brain size={16} />}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{insight.name.replace('.md', '')}</p>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1 rounded ${selected
                        ? 'bg-white/20 text-white'
                        : isMonthly
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                        }`}>
                        {isMonthly ? 'Mensal' : isWeekly ? 'Semanal' : 'Suporte'}
                    </span>
                </div>
            </div>
            <ChevronRight size={14} className={selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
        </button>
    );
};

export default Insights;
