
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType, Transaction, ExpenseCategory, IncomeCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import TransactionModal from '../components/TransactionModal';
import {
  Plus, Search, Trash2, Pencil
} from 'lucide-react';
import { PageHeader, Badge, Card } from '../components/ui';

interface TransactionsPageProps {
  type: TransactionType;
}

const Transactions: React.FC<TransactionsPageProps> = ({ type }) => {
  const { transactions, deleteTransaction, addTransaction, updateTransaction } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todas');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format: YYYY-MM
  const [valueFilter, setValueFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('date');

  const filtered = transactions
    .filter(t => t.type === type)
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => selectedCategory === 'Todas' || t.category === selectedCategory)
    .filter(t => selectedSubcategory === 'Todas' || t.subcategory === selectedSubcategory)
    .filter(t => {
      if (!selectedMonth) return true;
      const [y, m] = selectedMonth.split('-');
      const d = new Date(t.date);
      return d.getFullYear() === parseInt(y) && d.getMonth() === (parseInt(m) - 1);
    })
    .filter(t => {
      if (!valueFilter.trim()) return true;
      const targetValue = parseFloat(valueFilter.replace(',', '.'));
      if (isNaN(targetValue)) return true;
      const min = targetValue * 0.95;
      const max = targetValue * 1.05;
      return t.value >= min && t.value <= max;
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const categories = ['Todas', ...Array.from(new Set(transactions.filter(t => t.type === type).map(t => t.category)))];
  const subcategories = ['Todas', ...Array.from(new Set(transactions.filter(t => t.type === type && (selectedCategory === 'Todas' || t.category === selectedCategory)).map(t => t.subcategory)))];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={type === 'RECCEITA' ? 'Receitas' : 'Despesas'}
        description="Gerencie seus fluxos financeiros."
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 text-sm font-bold shadow-sm text-slate-600 dark:text-slate-300"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="date">📅 Ordenar: Data</option>
              <option value="createdAt">🆕 Ordenar: Recentes</option>
            </select>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus size={20} /> {type === 'RECCEITA' ? 'Receita' : 'Despesa'}
            </button>
          </div>
        }
      />

      <Card padding="none">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full md:w-auto">
            <select
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 text-sm"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('Todas'); // Reset subcategory when category changes
              }}
            >
              <option disabled value="">Categoria</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 text-sm"
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
            >
              <option disabled value="">Subcategoria</option>
              {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input
              type="month"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />

            <input
              type="text"
              placeholder="Valor (±5%)"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              value={valueFilter}
              onChange={e => setValueFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4 text-center">Parc.</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.length > 0 ? filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <Badge label={t.category} />
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px] font-medium">{t.description}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.paymentMethod}</td>
                  <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                    {t.installments > 1 ? `${t.currentInstallment}/${t.installments}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${type === 'RECCEITA' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {type === 'RECCEITA' ? '+' : '-'} {formatCurrency(t.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TransactionModal
        type={type}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={(data) => {
          if ('id' in data) {
            updateTransaction(data as Transaction);
          } else {
            addTransaction(data);
          }
        }}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
