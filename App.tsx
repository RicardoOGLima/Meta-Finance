

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import Forecast from './pages/Forecast';
import Login from './pages/Login';
import Proventos from './pages/Proventos';
import Insights from './pages/Insights';
import { Loader2 } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import toast, { Toaster } from 'react-hot-toast';
import { TophAI } from './utils/analyst';
import { storage } from './utils/storage';

const useTophAIAutomation = () => {
  const {
    transactions, assets, dividends, budgetGoals,
    investmentGoals, subcategories, isDataLoading
  } = useApp();

  React.useEffect(() => {
    if (isDataLoading) return;

    const checkAndGenerateReport = async () => {
      try {
        const lastInsightDate = await storage.getLastInsightDate();
        const now = new Date();
        const today = now.getDay(); // 0 is Sunday, 1 is Monday

        let shouldGenerate = false;
        let type: 'weekly' | 'monthly' = 'weekly';

        // 1. Check for Monthly Report (until 5th day of the month)
        if (now.getDate() <= 5) {
          const monthKey = now.toISOString().slice(0, 7);
          const insights = await storage.listInsights();
          const hasMonthly = insights.some(i => i.name.includes(`Relatorio_Mensal_${monthKey}`));
          if (!hasMonthly) {
            shouldGenerate = true;
            type = 'monthly';
          }
        }

        // 2. Check for Weekly Report (on Mondays, if more than 6 days since last)
        if (!shouldGenerate && today === 1) {
          if (!lastInsightDate || (now.getTime() - lastInsightDate.getTime()) > 6 * 24 * 60 * 60 * 1000) {
            shouldGenerate = true;
            type = 'weekly';
          }
        }

        if (shouldGenerate) {
          const stateValues = {
            transactions, assets, dividends, budgetGoals, investmentGoals, subcategories
          };

          const report = TophAI.generateReport(stateValues, type);
          await storage.saveInsight(report.name, report.content);

          toast.success(`Toph AI: Novo relatório ${type === 'weekly' ? 'semanal' : 'mensal'} gerado!`, {
            duration: 8000,
            icon: '🤖',
            position: 'top-center',
            style: {
              background: '#0f172a',
              color: '#fff',
              border: '1px solid #1e293b',
              padding: '16px',
              borderRadius: '16px',
              fontWeight: 'bold'
            }
          });
        }
      } catch (err) {
        console.error('Toph AI Automation Error:', err);
      }
    };

    checkAndGenerateReport();
  }, [isDataLoading, transactions, assets, dividends, budgetGoals, investmentGoals, subcategories]);
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDataLoading } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Activate Toph AI
  useTophAIAutomation();

  if (authLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Carregando seus dados...</p>
        </div>
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
      case 'forecast': return <Forecast />;
      case 'proventos': return <Proventos onPageChange={setCurrentPage} />;
      case 'insights': return <Insights />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const UpdateNotifier: React.FC = () => {
  React.useEffect(() => {
    const checkVersion = async () => {
      try {
        const currentVersion = await getVersion();
        const lastVersion = localStorage.getItem('last_app_version');

        if (lastVersion && lastVersion !== currentVersion) {
          toast.success(`Atualização concluída! Bem-vindo à versão ${currentVersion}.`, {
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            }
          });
        }
        localStorage.setItem('last_app_version', currentVersion);
      } catch (err) {
        console.error('Erro ao verificar versão:', err);
      }
    };
    checkVersion();
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Toaster position="top-right" />
        <UpdateNotifier />
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
