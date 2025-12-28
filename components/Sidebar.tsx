
import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Settings,
  PiggyBank,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  return (
    <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
        <h1 className="text-xl font-bold tracking-tight">Meta Finance</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4">
        {/* Group: Finanças Pessoais */}
        <div className="space-y-1">
          <button
            onClick={() => onPageChange('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentPage === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} />
              Finanças Pessoais
            </div>
          </button>

          {/* Sub-pages of Finanças Pessoais */}
          <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1">
            <button
              onClick={() => onPageChange('receitas')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${currentPage === 'receitas'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <TrendingUp size={16} />
              Receitas
            </button>
            <button
              onClick={() => onPageChange('despesas')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${currentPage === 'despesas'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <TrendingDown size={16} />
              Despesas
            </button>
            <button
              onClick={() => onPageChange('metas')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${currentPage === 'metas'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Target size={16} />
              Metas de Gastos
            </button>
          </div>
        </div>

        {/* Group: Investimentos */}
        <div className="space-y-1">
          <button
            onClick={() => onPageChange('investimentos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentPage === 'investimentos' || currentPage === 'novo-ativo' || currentPage === 'metas-investimento'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <div className="flex items-center gap-3">
              <PieChart size={20} />
              Investimentos
            </div>
          </button>

          {/* Sub-pages of Investimentos */}
          <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1">
            <button
              onClick={() => onPageChange('novo-aporte')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${currentPage === 'novo-aporte'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <PiggyBank size={16} />
              Novo Aporte
            </button>
            <button
              onClick={() => onPageChange('metas-investimento')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${currentPage === 'metas-investimento'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <ShieldCheck size={16} />
              Metas de Investimento
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onPageChange('configuracoes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPage === 'configuracoes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <Settings size={20} />
            Configurações
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
