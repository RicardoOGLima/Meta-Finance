import { Transaction, Asset, Dividend, BudgetGoal, InvestmentGoal, AppState } from '../types';
import { storage } from './storage';

export class TophAI {
    /**
     * Generates a weekly or monthly report in HTML format
     */
    static generateReport(
        data: AppState,
        type: 'weekly' | 'monthly' = 'weekly',
        logoData?: string,
        badgesBase64?: { [key: string]: string },
        personalLogo?: string
    ): { name: string, content: string } {
        const now = new Date();
        const name = type === 'weekly'
            ? `Analise Semanal.html`
            : `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')} - Análise Mensal.html`;

        // 1. Calculations
        const totalNetWorth = data.assets.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
        const monthlyAportes = this.calculateMonthlyAportes(data.transactions);
        const monthlyDividends = this.calculateMonthlyDividends(data.dividends || []);

        const monthlyIncome = data.transactions
            .filter(t => t.type === 'RECCEITA' && this.isCurrentMonth(t.date))
            .reduce((acc, t) => acc + t.value, 0);
        const monthlyExpenses = data.transactions
            .filter(t => t.type === 'DESPESA' && this.isCurrentMonth(t.date))
            .reduce((acc, t) => acc + t.value, 0);

        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        // 2. Badge Detection
        const earnedBadges = this.detectBadges(data, savingsRate, monthlyDividends);

        // 3. Generate HTML
        let content = `
        <div id="toph-report" class="bg-[#F8FAFC] p-12 min-h-[1400px] font-sans text-[#1E293B] flex flex-col">
            <!-- Institutional Header -->
            <div class="border-b-4 border-[#001C44] pb-6 mb-10 flex justify-between items-end">
                <div class="flex items-center gap-6">
                    ${logoData ? `<img src="${logoData}" class="h-14 w-14 object-contain" />` : ''}
                    <div>
                        <h1 class="text-4xl font-serif font-black tracking-tighter text-[#001C44] uppercase leading-none mb-1">
                            Private Intelligence
                        </h1>
                        <p class="text-[10px] font-bold tracking-[0.3em] text-[#64748B] uppercase">
                            Toph AI Division • ${type === 'weekly' ? 'WEEKLY AUDIT' : 'MONTHLY CLOSURE'} • ${now.toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
                <div class="text-right font-mono text-[9px] text-[#94A3B8] leading-tight uppercase">
                    <p class="font-bold text-[#64748B]">INTERNAL_REF: MF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}</p>
                    <p>SECURITY_ENCRYPTION: AES-256-LOCAL</p>
                </div>
            </div>

            <!-- Executive Dashboard -->
            <div class="grid grid-cols-4 border border-[#E2E8F0] bg-white shadow-sm overflow-hidden mb-10">
                <div class="p-6 border-r border-[#E2E8F0]">
                    <p class="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Assets Managed</p>
                    <p class="text-xl font-black text-[#001C44] tracking-tight">${this.formatCurrency(totalNetWorth)}</p>
                </div>
                <div class="p-6 border-r border-[#E2E8F0]">
                    <p class="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Capital Injection</p>
                    <p class="text-xl font-black text-[#001C44] tracking-tight">${this.formatCurrency(monthlyAportes)}</p>
                </div>
                <div class="p-6 border-r border-[#E2E8F0]">
                    <p class="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Passive Cashflow</p>
                    <p class="text-xl font-black text-emerald-600 tracking-tight">${this.formatCurrency(monthlyDividends)}</p>
                </div>
                <div class="p-6 bg-[#001C44] text-white">
                    <p class="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Efficiency Ratio</p>
                    <p class="text-xl font-black tracking-tight">${savingsRate.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Analysis Grid -->
            <div class="grid grid-cols-12 gap-10 mb-10">
                <!-- Strategic Insights -->
                <div class="col-span-12 xl:col-span-5 space-y-8">
                    <div class="bg-white p-6 border border-[#E2E8F0] shadow-sm h-full">
                        <h4 class="text-[#001C44] text-[10px] font-bold uppercase tracking-widest border-l-4 border-[#001C44] pl-3 mb-6 flex justify-between items-center">
                            Behavioral Analytics & Trends
                            <span class="text-[8px] font-normal italic text-slate-400">Toph 2.0 Engine</span>
                        </h4>
                        <div class="space-y-6">
                            ${this.generateInsightList(savingsRate, monthlyAportes, monthlyDividends, data).map(insight => `
                                <div class="flex gap-4 p-4 bg-[#F8FAFC] border border-[#F1F5F9] italic text-[11px] text-[#475569] leading-relaxed">
                                    <span class="text-lg flex-shrink-0">${insight.icon}</span>
                                    <p>${insight.text}</p>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Spending Pulse -->
                        <div class="mt-8 border-t border-[#F1F5F9] pt-6">
                            <h5 class="text-[9px] font-bold text-[#64748B] uppercase mb-4 tracking-tighter">Category Concentration Radar</h5>
                            <div class="space-y-4">
                                ${Object.entries(this.groupTransactionsByCategory(data.transactions))
                .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, val]) => `
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-[10px] font-bold text-[#1E293B]">${cat}</span>
                                        <span class="text-[9px] text-[#64748B]">${this.formatCurrency(val)}</span>
                                    </div>
                                    <div class="h-1 bg-[#F1F5F9] w-full mb-3">
                                        <div class="h-full bg-[#001C44]/20" style="width: ${Math.min((val / monthlyExpenses) * 100, 100)}%"></div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Portfolio Tracking -->
                <div class="col-span-12 xl:col-span-7 space-y-8">
                    <div class="bg-white p-8 border border-[#E2E8F0] shadow-sm">
                        <h4 class="text-[#001C44] text-[10px] font-bold uppercase tracking-widest border-l-4 border-[#001C44] pl-3 mb-8">
                            Portfolio Allocation & Drift Audit
                        </h4>
                        <div class="space-y-6">
                            ${this.renderAllocationTable(data, data.assets)}
                        </div>
                    </div>

                    <!-- Freedom Clock Core Card -->
                    <div class="bg-[#001C44] p-8 text-white shadow-xl relative overflow-hidden">
                        <div class="absolute -right-4 -top-8 text-white/5 font-serif text-[180px] font-black italic select-none">FI</div>
                        <h4 class="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 opacity-60">Freedom Clock Projection</h4>
                        ${(() => {
                const fi = this.calculateFreedomClock(data);
                return `
                                <div class="grid grid-cols-2 gap-8 mb-8 relative z-10">
                                    <div>
                                        <p class="text-[9px] uppercase font-bold text-white/50 mb-1 tracking-widest">Est. Independence Horizon</p>
                                        <p class="text-5xl font-serif font-black italic text-emerald-400 leading-none">
                                            ${fi.years >= 99 ? 'Infinito' : `${fi.years.toFixed(1)} <span class="text-xl">Anos</span>`}
                                        </p>
                                    </div>
                                    <div class="text-right flex flex-col justify-end">
                                        <p class="text-[9px] uppercase font-bold text-white/50 mb-1 tracking-widest">Financial Coverage</p>
                                        <p class="text-2xl font-black">${fi.currentProgress.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div class="h-2 bg-white/10 w-full mb-6 relative z-10">
                                    <div class="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000" style="width: ${Math.min(fi.currentProgress, 100)}%"></div>
                                </div>
                                <div class="flex justify-between items-center text-[9px] font-medium text-white/40 italic relative z-10">
                                    <span>Model Parameters: 6% Real Yield | SWR 4%</span>
                                    <span>Target Capital: ${this.formatCurrency(fi.targetNW)}</span>
                                </div>
                            `;
            })()}
                    </div>
                </div>
            </div>

            <!-- Achievement Accreditations -->
            ${earnedBadges.length > 0 ? `
            <div class="bg-white p-6 border border-[#E2E8F0] shadow-sm mb-10">
                <h4 class="text-[#001C44] text-[10px] font-bold uppercase tracking-widest border-l-4 border-[#001C44] pl-4 mb-6">
                    Verified Performance Accreditations
                </h4>
                <div class="flex gap-4">
                    ${earnedBadges.map(b => {
                const b64 = badgesBase64?.[b.id];
                return `
                        <div class="flex items-center gap-4 bg-[#F8FAFC] p-3 border border-[#F1F5F9] flex-1">
                            <div class="h-10 w-10 flex-shrink-0 bg-white p-1">
                                ${(b64 && b64.length > 30) ? `<img src="${b64}" class="h-full w-full object-contain" />` : `💎`}
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">ID: ${b.id.toUpperCase()}</span>
                                <span class="text-[10px] font-black uppercase text-[#001C44] tracking-tight">${b.name}</span>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Strategic Footer -->
            <div class="mt-auto pt-10 border-t border-[#E2E8F0] grid grid-cols-12 gap-8 items-end">
                <div class="col-span-8">
                    <p class="text-[9px] font-black text-[#001C44] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 bg-[#001C44]"></span> Institutional Disclaimer
                    </p>
                    <p class="text-[8px] text-[#94A3B8] uppercase leading-relaxed text-left max-w-xl">
                        A TOPH AI NÃO É UMA ENTIDADE DE CONSULTORIA FINANCEIRA REGULAMENTADA. AS PROJEÇÕES DO FREEDOM CLOCK SÃO MODELOS MATEMÁTICOS BASEADOS EM MÉDIAS HISTÓRICAS E NÃO GARANTEM RENTABILIDADE FUTURA. OS DADOS SÃO ARMAZENADOS E PROCESSADOS LOCALMENTE PARA MÁXIMA PRIVACIDADE.
                    </p>
                </div>
                <div class="col-span-4 flex flex-col items-end">
                    <div class="flex items-center gap-4 bg-white p-4 border border-[#E2E8F0] shadow-sm w-full">
                        <div class="h-12 w-12 border-r border-slate-100 pr-4 flex-shrink-0">
                            ${personalLogo ? `<img src="${personalLogo}" class="h-full w-full object-contain grayscale" />` : ''}
                        </div>
                        <div>
                            <p class="text-2xl font-serif font-black italic text-[#001C44] leading-none mb-1">Toph AI</p>
                            <p class="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">Verified Analytical Unit</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        return { name, content };
    }

    private static renderAllocationTable(data: AppState, assets: Asset[]): string {
        const classAllocation = this.calculateClassAllocation(assets);
        let rows = '';

        // Group by class to ensure unique rows
        const uniqueClasses = Array.from(new Set([
            ...data.investmentGoals.map(g => g.class),
            ...Object.keys(classAllocation)
        ]));

        uniqueClasses.forEach(className => {
            const goal = data.investmentGoals.find(g => g.class === className);
            const target = goal ? goal.percentage : 0;
            const actual = classAllocation[className] || 0;
            const diff = target - actual;

            // Premium status colors
            const barColor = Math.abs(diff) < 2 ? '#10B981' : diff > 0 ? '#3B82F6' : '#F59E0B';

            rows += `
            <div class="space-y-2">
                <div class="flex justify-between items-end">
                    <span class="text-[10px] font-black uppercase tracking-wider text-[#475569]">${className}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-[9px] font-bold text-[#94A3B8]">Target: ${target}%</span>
                        <span class="text-xs font-black text-[#001C44]">${actual.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="h-1.5 bg-[#F1F5F9] rounded-none overflow-hidden flex relative">
                    <!-- Target Marker -->
                    ${target > 0 ? `<div class="absolute top-0 bottom-0 w-px bg-[#E2E8F0] z-10" style="left: ${target}%"></div>` : ''}
                    <!-- Actual Bar -->
                    <div class="h-full transition-all duration-500" style="width: ${actual}%; background-color: ${barColor}"></div>
                </div>
            </div>
            `;
        });

        return rows || '<p class="text-xs text-[#94A3B8] italic">No allocation data available for this analysis.</p>';
    }

    private static detectBadges(data: AppState, savingsRate: number, monthlyDividends: number): { id: string, name: string }[] {
        const badges: { id: string, name: string }[] = [];

        // Frugal Master (> 50% savings rate)
        if (savingsRate >= 50) {
            badges.push({ id: 'frugal_master', name: 'Frugal Master' });
        }

        // Diamond Hands (No sell transactions in the last 30 days)
        const hasSales = data.transactions.some(t =>
            t.type === 'RECCEITA' &&
            t.category === 'Investimentos' &&
            (t.description.toLowerCase().includes('venda') || t.description.toLowerCase().includes('liquid'))
        );
        if (!hasSales) {
            badges.push({ id: 'diamond_hands', name: 'Diamond Hands' });
        }

        // Dividend Rain (significant dividends)
        if (monthlyDividends > 0) {
            badges.push({ id: 'dividend_rain', name: 'Dividend Rain' });
        }

        return badges;
    }

    private static formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    private static isCurrentMonth(dateStr: string): boolean {
        const d = new Date(dateStr);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    private static calculateMonthlyAportes(transactions: Transaction[]): number {
        return transactions
            .filter(t => t.type === 'DESPESA' && this.isCurrentMonth(t.date) && (t.category === 'Metas' || t.category === 'Liberdade Financeira'))
            .reduce((acc, t) => acc + t.value, 0);
    }

    private static calculateMonthlyDividends(dividends: Dividend[]): number {
        return dividends
            .filter(d => this.isCurrentMonth(d.date))
            .reduce((acc, d) => acc + d.totalValue, 0);
    }

    private static calculateClassAllocation(assets: Asset[]): Record<string, number> {
        const total = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
        const result: Record<string, number> = {};
        if (total === 0) return result;

        assets.forEach(a => {
            result[a.class] = (result[a.class] || 0) + ((a.quantity * a.currentPrice) / total * 100);
        });
        return result;
    }

    private static groupTransactionsByCategory(transactions: Transaction[]): Record<string, number> {
        const result: Record<string, number> = {};
        transactions
            .filter(t => t.type === 'DESPESA' && this.isCurrentMonth(t.date))
            .forEach(t => {
                result[t.category] = (result[t.category] || 0) + t.value;
            });
        return result;
    }

    private static generateInsightList(savingsRate: number, aportes: number, dividends: number, data?: AppState): { icon: string, text: string }[] {
        const insights: { icon: string, text: string }[] = [];

        if (savingsRate < 10) {
            insights.push({ icon: '⚠️', text: "Efficiency Alert: Sua taxa de poupança está abaixo da zona de segurança (10%). O acúmulo de capital está sendo comprometido pelo consumo imediato." });
        } else if (savingsRate > 35) {
            insights.push({ icon: '💎', text: "Tier 1 Efficiency: Taxa de poupança excepcional. Você está convertendo renda em patrimônio na velocidade máxima permitida pelo modelo." });
        }

        if (dividends > 0) {
            const yieldOnNW = (dividends * 12) / (data?.assets.reduce((a, b) => a + (b.quantity * b.currentPrice), 0) || 1);
            insights.push({ icon: '🔥', text: `Cashflow Matrix: Renda passiva de ${this.formatCurrency(dividends)}. Yield on Cost estimado em ${(yieldOnNW * 100).toFixed(2)}% a.a.` });
        }

        // Toph AI 2.0: Portfolio Drift Analysis
        if (data && data.assets.length > 0) {
            const allocation = this.calculateClassAllocation(data.assets);
            const majorClass = Object.entries(allocation).sort((a, b) => b[1] - a[1])[0];
            if (majorClass && majorClass[1] > 50) {
                insights.push({ icon: '⚖️', text: `Risk Audit: Concentração elevada em ${majorClass[0]} (${majorClass[1].toFixed(1)}%). Recomenda-se diversificação para mitigar risco sistêmico.` });
            }
        }

        // Toph AI 2.0: Lifestyle Creep Detection
        if (data) {
            insights.push(this.detectLifestyleCreep(data));
        }

        return insights;
    }

    private static detectLifestyleCreep(data: AppState): { icon: string, text: string } {
        const now = new Date();
        const months: { income: number, comfort: number }[] = [];

        // Analysis of the last 4 months
        for (let i = 0; i < 4; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthTransactions = data.transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            });

            const income = monthTransactions.filter(t => t.type === 'RECCEITA').reduce((acc, t) => acc + t.value, 0);
            const comfort = monthTransactions.filter(t =>
                t.type === 'DESPESA' && (t.category === 'Lazer' || t.category === 'Conforto' || t.category === 'Assinaturas' || t.category === 'Restaurantes')
            ).reduce((acc, t) => acc + t.value, 0);

            if (income > 0 || comfort > 0) {
                months.push({ income, comfort });
            }
        }

        if (months.length < 3) {
            return {
                icon: '⏳',
                text: "Historical Audit: Base de dados insuficiente para análise de tendências comportamentais. Requeremos ao menos 90 dias de lançamentos contínuos."
            };
        }

        const reversed = [...months].reverse();
        const firstIncome = reversed[0].income;
        const lastIncome = reversed[months.length - 1].income;
        const firstComfort = reversed[0].comfort;
        const lastComfort = reversed[months.length - 1].comfort;

        if (firstIncome > 0 && lastIncome > firstIncome) {
            const incomeGrowth = (lastIncome / firstIncome) - 1;
            const comfortGrowth = (lastComfort / firstComfort) - 1;

            if (comfortGrowth > incomeGrowth * 1.5 && comfortGrowth > 0.05) {
                return {
                    icon: '🚨',
                    text: `Behavioral Creep Alert: Seus gastos de estilo de vida cresceram ${(comfortGrowth * 100).toFixed(0)}%, superando a expansão da sua renda (${(incomeGrowth * 100).toFixed(0)}%).`
                };
            }
        }

        return {
            icon: '🛡️',
            text: "Lifestyle Stability: Não detectamos desvio de padrão de vida em relação ao aumento de renda no período auditado."
        };
    }

    public static calculateFreedomClock(data: AppState): { years: number, targetNW: number, currentProgress: number } {
        const now = new Date();
        // Average expenses from the last 3 months
        const last3Months = [0, 1, 2].map(i => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return data.transactions
                .filter(t => {
                    const td = new Date(t.date);
                    return t.type === 'DESPESA' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
                })
                .reduce((acc, t) => acc + t.value, 0);
        });

        const avgExpenses = last3Months.reduce((a, b) => a + b, 0) / 3 || 1;
        const totalNetWorth = data.assets.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);

        // 4% SWR -> 25x Annual Expenses (Safe Withdrawal Rate)
        const targetNW = (avgExpenses * 12) / 0.04;

        // If already FIRE
        if (totalNetWorth >= targetNW) return { years: 0, targetNW, currentProgress: 100 };

        // Average monthly contribution
        const last3MonthsAportes = [0, 1, 2].map(i => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return data.transactions
                .filter(t => {
                    const td = new Date(t.date);
                    return t.type === 'DESPESA' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && (t.category === 'Metas' || t.category === 'Liberdade Financeira');
                })
                .reduce((acc, t) => acc + t.value, 0);
        });
        const avgAporte = last3MonthsAportes.reduce((a, b) => a + b, 0) / 3 || 0;

        // 6% Real Interest Rate (Monthly: ~0.486%)
        const monthlyRate = Math.pow(1.06, 1 / 12) - 1;

        // Future Value Formula: FV = PV(1+r)^n + PMT * [ ((1+r)^n - 1) / r ]
        // Solving for n: n = log( (FV*r + PMT) / (PV*r + PMT) ) / log(1+r)
        if (avgAporte <= 0 && totalNetWorth <= 0) return { years: 99, targetNW, currentProgress: 0 };

        const n = Math.log((targetNW * monthlyRate + avgAporte) / (totalNetWorth * monthlyRate + avgAporte)) / Math.log(1 + monthlyRate);

        return {
            years: n / 12,
            targetNW,
            currentProgress: (totalNetWorth / targetNW) * 100
        };
    }
}
