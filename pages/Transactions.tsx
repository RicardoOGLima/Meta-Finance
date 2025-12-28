
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType, Transaction, ExpenseCategory, IncomeCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import TransactionModal from '../components/TransactionModal';
import { 
  Plus, Search, Trash2, ShieldCheck, Coffee, Flag, 
  Gamepad2, Gem, BookOpen, Banknote, Key, Briefcase, 
  Store, MoreHorizontal, TrendingUp, Globe, Building2, 
  Building, Coins, Landmark, Globe2
} from 'lucide-react';

interface TransactionsPageProps {
  type: TransactionType;
}

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const getStyles = () => {
    switch (category) {
      case ExpenseCategory.CUSTO_FIXO:
        return { color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400', icon: <ShieldCheck size={14} /> };
      case ExpenseCategory.CONFORTO:
        return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: <Coffee size={14} /> };
      case ExpenseCategory.METAS:
        return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Flag size={14} /> };
      case ExpenseCategory.PRAZERES:
        return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', icon: <Gamepad2 size={14} /> };
      case ExpenseCategory.LIBERDADE_FINANCEIRA:
        return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Gem size={14} /> };
      case ExpenseCategory.CONHECIMENTO:
        return { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400', icon: <BookOpen size={14} /> };
      // Receitas
      case IncomeCategory.SALARIOS:
        return { color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400', icon: <Banknote size={14} /> };
      case IncomeCategory.ALUGUEL:
        return { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <Key size={14} /> };
      case IncomeCategory.CONSULTORIA:
        return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400', icon: <Briefcase size={14} /> };
      case IncomeCategory.NEGOCIOS:
        return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', icon: <Store size={14} /> };
      default:
        return { color: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400', icon: <MoreHorizontal size={14} /> };
    }
  };

  const { color, icon } = getStyles();

  return (
    <span className={`${color} px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit transition-all`}>
      {icon}
      {category}
    </span>
  );
};

export const InvestmentBadge: React.FC<{ className: string }> = ({ className }) => {
  const getStyles = () => {
    switch (className) {
      case 'Ações (BR)':
        return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: <TrendingUp size={14} /> };
      case 'Stocks':
        return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400', icon: <Globe size={14} /> };
      case 'FIIs':
        return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', icon: <Building2 size={14} /> };
      case 'REITs':
        return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: <Building size={14} /> };
      case 'Cripto':
        return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', icon: <Coins size={14} /> };
      case 'Renda Fixa (BR)':
        return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Landmark size={14} /> };
      case 'Renda Fixa Inter.':
        return { color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400', icon: <Globe2 size={14} /> };
      default:
        return { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: <Gem size={14} /> };
    }
  };

  const { color, icon } = getStyles();

  return (
    <span className={`${color} px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit uppercase tracking-wider transition-all shadow-sm`}>
      {icon}
      {className}
    </span>
  );
};

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

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
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
                    <CategoryBadge category={t.category} />
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
