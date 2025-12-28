
import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Metas from './pages/Metas';
import Investimentos from './pages/Investimentos';
import NovoAtivo from './pages/NovoAtivo';
import NovoAporte from './pages/NovoAporte';
import MetasInvestimento from './pages/MetasInvestimento';
import Configuracoes from './pages/Configuracoes';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
