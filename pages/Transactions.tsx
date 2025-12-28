
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import TransactionModal from '../components/TransactionModal';
import { Plus, Search, Filter, Trash2, Edit2, Calendar } from 'lucide-react';

interface TransactionsPageProps {
  type: TransactionType;
}

const Transactions: React.FC<TransactionsPageProps> = ({ type }) => {
  const { transactions, deleteTransaction, addTransaction } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {type === 'RECCEITA' ? 'Receitas' : 'Despesas'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seus fluxos financeiros.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus size={20} /> Nova {type === 'RECCEITA' ? 'Receita' : 'Despesa'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <select 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              {filtered.length > 0 ? filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-bold">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px]">{t.description}</td>
                  <td className="px-6 py-4">{t.paymentMethod}</td>
                  <td className="px-6 py-4 text-center">
                    {t.installments > 1 ? `${t.currentInstallment}/${t.installments}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${type === 'RECCEITA' ? 'text-green-600' : 'text-red-500'}`}>
                    {type === 'RECCEITA' ? '+' : '-'} {formatCurrency(t.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
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
      </div>

      <TransactionModal 
        type={type} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addTransaction}
      />
    </div>
  );
};

export default Transactions;
