
import React from 'react';
import { useApp } from '../context/AppContext';
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
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-slate-900">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <PieChart size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Meta Finance</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-4">
          {/* Group: Finanças Pessoais */}
          <div className="space-y-1">
            <button
              onClick={() => onPageChange('dashboard')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                currentPage === 'dashboard' 
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'receitas' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp size={16} />
                Receitas
              </button>
              <button
                onClick={() => onPageChange('despesas')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'despesas' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingDown size={16} />
                Despesas
              </button>
              <button
                onClick={() => onPageChange('metas')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'metas' 
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                currentPage === 'investimentos' || currentPage === 'novo-ativo' || currentPage === 'metas-investimento'
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'novo-aporte' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <PiggyBank size={16} />
                Novo Aporte
              </button>
              <button
                onClick={() => onPageChange('metas-investimento')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'metas-investimento' 
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === 'configuracoes' 
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

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
