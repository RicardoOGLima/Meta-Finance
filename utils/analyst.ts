import { Transaction, Asset, Dividend, AppState } from '../types';

export class TophAI {
    /**
     * Generates a weekly or monthly report based on the provided state
     */
    static generateReport(state: AppState, type: 'weekly' | 'monthly'): { name: string, content: string } {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const monthStr = now.toISOString().slice(0, 7); // YYYY-MM

        const name = type === 'weekly'
            ? `Analise Semanal.md`
            : `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')} - Análise Mensal.md`;

        const transactions = state.transactions || [];
        const assets = state.assets || [];
        const dividends = state.dividends || [];

        // 1. Executive Summary Logic
        const totalNetWorth = assets.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
        const monthlyAportes = this.calculateMonthlyAportes(transactions);
        const monthlyDividends = this.calculateMonthlyDividends(dividends);

        // 2. Savings Rate Calculation
        const monthlyIncome = transactions
            .filter(t => t.type === 'RECCEITA' && this.isCurrentMonth(t.date))
            .reduce((acc, t) => acc + t.value, 0);
        const monthlyExpenses = transactions
            .filter(t => t.type === 'DESPESA' && this.isCurrentMonth(t.date))
            .reduce((acc, t) => acc + t.value, 0);

        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        // 3. Generate Markdown
        let content = `### **🤖 Toph AI - ${type === 'weekly' ? 'Update Semanal' : 'Fechamento Mensal'}**\n\n`;
        content += `_Relatório estratégico gerado em ${new Date().toLocaleString('pt-BR')}. Operando em modo de Inteligência Local 🔒_\n\n---\n\n`;

        content += `## 🚀 Resumo Executivo\n\n`;
        content += `| Métrica | Valor | Status |\n`;
        content += `| :--- | :--- | :--- |\n`;
        content += `| **Patrimônio em Ativos** | ${this.formatCurrency(totalNetWorth)} | 📈 Em Acompanhamento |\n`;
        content += `| **Aportes (Mês Atual)** | ${this.formatCurrency(monthlyAportes)} | ${monthlyAportes > 0 ? '✅ Ativo' : '⚪ Pendente'} |\n`;
        content += `| **Proventos (Mês Atual)** | ${this.formatCurrency(monthlyDividends)} | ${monthlyDividends > 0 ? '🔥 Recebendo' : '⏱️ Aguardando'} |\n`;
        content += `| **Taxa de Poupança** | ${savingsRate.toFixed(1)}% | ${savingsRate >= 20 ? '💎 Excelente' : '⚠️ Atenção'} |\n\n`;

        content += `---\n\n## 📉 Análise de Gastos\n\n`;
        content += `A regra 50/30/20 sugere 50% para Essenciais, 30% para Estilo de Vida e 20% para Investimentos. Veja como você está:\n\n`;

        const categoryData = this.groupTransactionsByCategory(transactions);
        content += `\`\`\`mermaid\npie title "Distribuição de Gastos do Mês"\n`;
        Object.entries(categoryData).forEach(([cat, val]) => {
            if (val > 0) content += `    "${cat}" : ${Math.round(val)}\n`;
        });
        content += `\`\`\`\n\n`;

        content += `---\n\n## 💰 Performance e Rebalanceamento\n\n`;
        content += `### Desvio de Alocação\n\n`;
        content += `| Classe | Atual | Ideal | Ação Sugerida |\n`;
        content += `| :--- | :--- | :--- | :--- |\n`;

        const classAllocation = this.calculateClassAllocation(assets);
        state.investmentGoals.forEach(goal => {
            const actual = classAllocation[goal.class] || 0;
            const diff = goal.percentage - actual;
            let action = 'Equilibrado';
            if (diff > 2) action = `**Aportar (~${this.formatCurrency(totalNetWorth * (diff / 100))})**`;
            else if (diff < -5) action = 'Excedente (Rever)';

            content += `| ${goal.class} | ${actual.toFixed(1)}% | ${goal.percentage}% | ${action} |\n`;
        });

        content += `\n---\n\n## 🎯 Insights da Toph\n\n`;
        content += this.generateInsights(savingsRate, monthlyAportes, monthlyDividends);

        content += `\n\n--- \n_Relatório assinado por **Toph AI**._`;

        return { name, content };
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
        // Assuming 'Metas' or 'Liberdade Financeira' categories count as investments/aportes or have a specific logic
        // For simplicity, let's treat any expense in 'Liberdade Financeira' or 'Metas' as an aporte
        return transactions
            .filter(t => t.type === 'DESPESA' && this.isCurrentMonth(t.date) && (t.category === 'Metas' || t.category === 'Liberdade Financeira'))
            .reduce((acc, t) => acc + t.value, 0);
    }

    private static calculateMonthlyDividends(dividends: Dividend[]): number {
        return dividends
            .filter(d => this.isCurrentMonth(d.date))
            .reduce((acc, d) => acc + d.totalValue, 0);
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

    private static calculateClassAllocation(assets: Asset[]): Record<string, number> {
        const total = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
        const result: Record<string, number> = {};
        if (total === 0) return result;

        assets.forEach(a => {
            result[a.class] = (result[a.class] || 0) + ((a.quantity * a.currentPrice) / total * 100);
        });
        return result;
    }

    private static generateInsights(savingsRate: number, aportes: number, dividends: number): string {
        let insights = '';
        if (savingsRate < 10) {
            insights += `- ⚠️ Sua taxa de poupança está baixa. Revise gastos em 'Conforto' e 'Prazeres'.\n`;
        } else if (savingsRate > 30) {
            insights += `- 💎 Parabéns! Você está poupando muito acima da média nacional.\n`;
        }

        if (dividends > 0) {
            insights += `- 🔥 Sua "máquina de renda" está girando. R$ ${dividends.toFixed(2)} em rendimento passivo este mês.\n`;
        }

        if (aportes === 0) {
            insights += `- ⚪ Ainda não detectei aportes significativos este mês. Não esqueça do seu futuro!\n`;
        }

        return insights || '- Continue mantendo o controle rigoroso dos seus lançamentos para insights mais precisos.';
    }
}
