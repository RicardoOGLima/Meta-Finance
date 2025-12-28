

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Metas from './pages/Metas';
import Investimentos from './pages/Investimentos';
import NovoAtivo from './pages/NovoAtivo';
import NovoAporte from './pages/NovoAporte';
import MetasInvestimento from './pages/MetasInvestimento';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'receitas': return <Transactions type="RECCEITA" />;
      case 'despesas': return <Transactions type="DESPESA" />;
      case 'metas': return <Metas />;
      case 'investimentos': return <Investimentos onPageChange={setCurrentPage} />;
      case 'novo-ativo': return <NovoAtivo onCancel={() => setCurrentPage('investimentos')} />;
      case 'novo-aporte': return <NovoAporte />;
      case 'metas-investimento': return <MetasInvestimento />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
