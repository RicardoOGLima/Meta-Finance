
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

  const filtered = transactions
    .filter(t => t.type === type)
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => selectedCategory === 'Todas' || t.category === selectedCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categories = ['Todas', ...Array.from(new Set(transactions.map(t => t.category)))];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={type === 'RECCEITA' ? 'Receitas' : 'Despesas'}
        description="Gerencie seus fluxos financeiros."
        action={
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus size={20} /> Nova {type === 'RECCEITA' ? 'Receita' : 'Despesa'}
          </button>
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
          <div className="flex gap-2">
            <select
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
