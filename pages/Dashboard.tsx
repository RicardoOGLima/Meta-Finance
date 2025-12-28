
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateSummary, formatCurrency } from '../utils/calculations';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, BarChart, Cell
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, PiggyBank } from 'lucide-react';
import { ExpenseCategory } from '../types';
import { PageHeader, SummaryCard, Card, Badge } from '../components/ui';

const Dashboard: React.FC = () => {
  const { transactions, budgetGoals, theme } = useApp();
  const [date, setDate] = useState(new Date());

  const month = date.getMonth();
  const year = date.getFullYear();

  const summary = calculateSummary(transactions, month, year);

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const investmentsValue = currentMonthTransactions
    .filter(t => t.type === 'DESPESA' && t.category === ExpenseCategory.LIBERDADE_FINANCEIRA)
    .reduce((acc, t) => acc + t.value, 0);

  const operativeExpenses = currentMonthTransactions
    .filter(t => t.type === 'DESPESA' && t.category !== ExpenseCategory.LIBERDADE_FINANCEIRA)
    .reduce((acc, t) => acc + t.value, 0);

  const budgetComparison = budgetGoals.map(goal => {
    const real = currentMonthTransactions
      .filter(t => t.type === 'DESPESA' && t.category === goal.category)
      .reduce((acc, t) => acc + t.value, 0);

    const metaValue = summary.income * (goal.percentage / 100);
    const gap = metaValue - real;
    const percentAtingido = metaValue > 0 ? (real / metaValue) * 100 : 0;

    return {
      category: goal.category,
      real,
      meta: metaValue,
      gap,
      percent: percentAtingido
    };
  });

  const subcategoryMap = currentMonthTransactions
    .filter(t => t.type === 'DESPESA')
    .reduce((acc: Record<string, number>, t) => {
      const sub = t.subcategory || 'Outros';
      acc[sub] = (acc[sub] || 0) + t.value;
      return acc;
    }, {} as Record<string, number>);

  const subcategoryData = Object.entries(subcategoryMap)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  const barData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setMonth(d.getMonth() - (5 - (i as number)));
    const m = d.getMonth();
    const y = d.getFullYear();

    const filtered = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });

    const income = filtered.filter(t => t.type === 'RECCEITA').reduce((acc, t) => acc + t.value, 0);
    const investments = filtered.filter(t => t.type === 'DESPESA' && t.category === ExpenseCategory.LIBERDADE_FINANCEIRA).reduce((acc, t) => acc + t.value, 0);
    const operativeExp = filtered.filter(t => t.type === 'DESPESA' && t.category !== ExpenseCategory.LIBERDADE_FINANCEIRA).reduce((acc, t) => acc + t.value, 0);

    return {
      name: d.toLocaleString('pt-BR', { month: 'short' }),
      receita: income,
      despesa: operativeExp,
      investimentos: investments
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Finanças Pessoais"
        description="Acompanhe seu desempenho financeiro."
        action={
          <input
            type="month"
            className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm"
            value={`${year}-${String(month + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setDate(new Date(parseInt(y), parseInt(m) - 1));
            }}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Receitas"
          value={formatCurrency(summary.income)}
          icon={<ArrowUpCircle />}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Despesas"
          value={formatCurrency(operativeExpenses)}
          icon={<ArrowDownCircle />}
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600"
        />
        <SummaryCard
          title="Investimentos"
          value={formatCurrency(investmentsValue)}
          icon={<PiggyBank />}
          iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600"
        />
        <SummaryCard
          title="Saldo Atual"
          value={formatCurrency(summary.balance)}
          icon={<Wallet />}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receita vs Despesa (6 Meses)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis hide />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    formatCurrency(val),
                    name
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="investimentos"
                  name="Investimentos"
                  fill="#64748b"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                  label={{
                    position: 'top',
                    fill: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontSize: 10,
                    fontWeight: 'bold',
                    formatter: (val: number) => val > 0 ? formatCurrency(val) : ''
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  name="Despesa"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ef4444' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Gastos por Subcategoria">
          <div className="h-64">
            {subcategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subcategoryData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    name="Valor"
                    label={{
                      position: 'top',
                      fill: theme === 'dark' ? '#94a3b8' : '#64748b',
                      fontSize: 11,
                      fontWeight: 'bold',
                      formatter: (val: number) => val.toFixed(0)
                    }}
                  >
                    {subcategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Sem despesas registradas para este mês.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card
        padding="none"
        headerAction={
          summary.income === 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
              <AlertCircle size={14} /> Defina uma receita para calcular metas
            </span>
          )
        }
        title="Real vs Meta"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-center">Real (R$)</th>
                <th className="px-6 py-4 text-right">Meta (R$)</th>
                <th className="px-6 py-4 text-right">Gap (R$)</th>
                <th className="px-6 py-4 text-center">% Atingido</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              {budgetComparison.map((item) => (
                <tr key={item.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <Badge label={item.category} />
                  </td>
                  <td className="px-6 py-4 text-center font-mono">{formatCurrency(item.real)}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item.meta)}</td>
                  <td className={`px-6 py-4 text-right font-mono ${item.gap < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(item.gap)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
                      <div
                        className={`h-full transition-all ${item.percent > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.percent > 100 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.percent > 100 ? 'Excedido' : 'No Plano'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
