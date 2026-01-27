import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Brain, Sparkles, Clock, ChevronRight, Search, FileSignature, Download, Plus } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';
import { storage } from '../utils/storage';
import { TophAI } from '../utils/analyst';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

interface InsightItem {
    name: string;
    path: string;
}

interface SelectedInsight {
    name: string;
    content: string;
}

const Insights: React.FC = () => {
    const { transactions, assets, dividends, budgetGoals, investmentGoals, subcategories } = useApp();
    const [insights, setInsights] = useState<InsightItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInsight, setSelectedInsight] = useState<SelectedInsight | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        setLoading(true);
        const list = await storage.listInsights();
        const sortedList = list.sort((a, b) => b.name.localeCompare(a.name));
        setInsights(sortedList);

        if (sortedList.length > 0 && !selectedInsight) {
            handleSelectInsight(sortedList[0].name);
        }
        setLoading(false);
    };

    const handleManualGenerate = async (type: 'weekly' | 'monthly') => {
        try {
            const stateValues = {
                transactions, assets, dividends, budgetGoals, investmentGoals, subcategories
            };
            // Base64 Images for the report
            const assetsDir = await storage.getAssetsDir();

            const getB64Data = async (fileName: string) => {
                const b64 = await storage.readFileAsBase64(`${assetsDir}/${fileName}`);
                return (b64 && b64.length > 30) ? `data:image/png;base64,${b64}` : undefined;
            };

            const logoB64 = await getB64Data('logo.png');
            const personalLogoB64 = await getB64Data('personal_logo.png');

            console.log(`[Toph AI] Buscando assets em: ${assetsDir}`);
            if (!logoB64 || !personalLogoB64) {
                toast.error(`Aviso: Logos não encontrados. Caminho: ${assetsDir}`);
            }

            const badgesB64Data = {
                diamond_hands: await getB64Data('diamond_hands.png'),
                frugal_master: await getB64Data('frugal_master.png'),
                dividend_rain: await getB64Data('dividend_rain.png'),
            };

            const report = TophAI.generateReport(stateValues, type, logoB64, badgesB64Data, personalLogoB64);

            await storage.saveInsight(report.name, report.content);
            toast.success(`Toph AI: Relatório ${type === 'weekly' ? 'semanal' : 'mensal'} gerado com sucesso!`);
            loadInsights();
        } catch (err) {
            console.error('Error generating report:', err);
            toast.error('Erro ao gerar relatório.');
        }
    };

    const handleExportPDF = () => {
        if (!selectedInsight) return;

        const element = document.getElementById('toph-report');
        if (!element) {
            toast.error('Conteúdo do relatório não encontrado para exportação.');
            return;
        }

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: selectedInsight.name.replace('.html', '.pdf'),
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save();
        toast.success('PDF gerado com sucesso!');
    };

    const handleSelectInsight = async (name: string) => {
        const text = await storage.readInsight(name);
        if (!text) {
            setSelectedInsight({
                name: name,
                content: '### ⚠️ Erro ao carregar arquivo\n\nNão foi possível ler o conteúdo do arquivo ou ele está vazio.'
            });
        } else {
            setSelectedInsight({ name, content: text });
        }
    };

    const filteredInsights = insights.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPrioritizedInsights = () => {
        if (searchTerm) {
            return { priority: [], history: filteredInsights };
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

    const getDisplayName = (fileName: string) => {
        return fileName.replace('.md', '').replace('.html', '').replace(/_/g, ' ');
    };

    const { priority, history } = getPrioritizedInsights();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Toph AI"
                description="Relatórios estratégicos e análises analíticas geradas localmente."
                action={
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleManualGenerate('weekly')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl border border-blue-500 shadow-lg shadow-blue-500/20 transition-all font-bold text-sm"
                        >
                            <Sparkles size={18} />
                            Gerar Semanal
                        </button>
                        <button
                            onClick={() => handleManualGenerate('monthly')}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl border border-indigo-500 shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm"
                        >
                            <Plus size={18} />
                            Gerar Mensal
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
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
                                            selected={selectedInsight?.name === insight.name}
                                            onClick={() => handleSelectInsight(insight.name)}
                                            displayName={getDisplayName(insight.name)}
                                        />
                                    ))}

                                    {history.length > 0 && !searchTerm && (
                                        <div className="px-3 py-2 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico</div>
                                    )}
                                    {history.map((insight) => (
                                        <InsightButton
                                            key={insight.name}
                                            insight={insight}
                                            selected={selectedInsight?.name === insight.name}
                                            onClick={() => handleSelectInsight(insight.name)}
                                            displayName={getDisplayName(insight.name)}
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

                <div className="lg:col-span-3">
                    {selectedInsight ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-500" size={24} />
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                                        {getDisplayName(selectedInsight.name)}
                                    </h2>
                                </div>
                                {selectedInsight.name.endsWith('.html') && (
                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        <Download size={18} />
                                        <span>Exportar PDF</span>
                                    </button>
                                )}
                            </div>

                            <div className="pb-20">
                                {selectedInsight.name.endsWith('.html') ? (
                                    <div
                                        id="toph-report"
                                        className="toph-html-container bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
                                        dangerouslySetInnerHTML={{ __html: selectedInsight.content }}
                                    />
                                ) : (
                                    <div id="toph-report" className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm
                                        prose-h3:text-2xl prose-h3:font-black prose-h3:text-slate-900 dark:prose-h3:text-white prose-h3:mb-6
                                        prose-em:text-xs prose-em:text-slate-400 prose-em:font-medium prose-em:not-italic
                                        prose-p:text-slate-600 dark:prose-p:text-slate-400
                                        prose-li:text-slate-600 dark:prose-li:text-slate-400
                                        prose-hr:border-slate-100 dark:prose-hr:border-slate-800
                                        prose-table:text-sm prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:text-slate-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {selectedInsight.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
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
    onClick: () => void,
    displayName: string
}> = ({ insight, selected, onClick, displayName }) => {
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
                <p className="text-sm font-bold truncate">{displayName}</p>
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
