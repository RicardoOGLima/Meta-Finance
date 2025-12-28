
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Asset, BudgetGoal, InvestmentGoal, AppState } from '../types';
import { INITIAL_BUDGET_GOALS, INITIAL_INVESTMENT_GOALS } from '../constants';
import toast from 'react-hot-toast';

interface AppContextType extends AppState {
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (t: Transaction) => void;
  addAsset: (a: Omit<Asset, 'id'>) => void;
  updateAsset: (a: Asset) => void;
  deleteAsset: (id: string) => void;
  updateBudgetGoals: (goals: BudgetGoal[]) => void;
  updateInvestmentGoals: (goals: InvestmentGoal[]) => void;
  toggleTheme: () => void;
  resetData: () => void;
  importData: (json: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('meta_finance_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robust reconstruction to ensure no property is undefined
        return {
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          assets: Array.isArray(parsed.assets) ? parsed.assets : [],
          budgetGoals: Array.isArray(parsed.budgetGoals) ? parsed.budgetGoals : INITIAL_BUDGET_GOALS,
          investmentGoals: Array.isArray(parsed.investmentGoals) ? parsed.investmentGoals : INITIAL_INVESTMENT_GOALS,
          theme: 'light' // Always forced to light as per previous request
        };
      } catch (e) {
        console.error("Erro ao carregar estado salvo:", e);
      }
    }
    return {
      transactions: [],
      assets: [],
      budgetGoals: INITIAL_BUDGET_GOALS,
      investmentGoals: INITIAL_INVESTMENT_GOALS,
      theme: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('meta_finance_state', JSON.stringify(state));
    document.documentElement.classList.remove('dark');
  }, [state]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const idPrefix = Math.random().toString(36).substr(2, 9);
    const newTransactions: Transaction[] = [];

    if (t.installments > 1) {
      const groupId = idPrefix;
      const baseDate = new Date(t.date);
      for (let i = 1; i <= t.installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
        newTransactions.push({
          ...t,
          id: `${groupId}-${i}`,
          groupId,
          currentInstallment: i,
          date: installmentDate.toISOString()
        });
      }
    } else {
      newTransactions.push({ ...t, id: idPrefix });
    }

    setState(prev => ({
      ...prev,
      transactions: [...(prev.transactions || []), ...newTransactions]
    }));
    toast.success('Transação adicionada!');
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: (prev.transactions || []).filter(t => t.id !== id)
    }));
    toast.success('Transação removida!');
  };

  const updateTransaction = (t: Transaction) => {
    setState(prev => ({
      ...prev,
      transactions: (prev.transactions || []).map(item => item.id === t.id ? t : item)
    }));
    toast.success('Transação atualizada!');
  };

  const addAsset = (a: Omit<Asset, 'id'>) => {
    setState(prev => ({
      ...prev,
      assets: [...(prev.assets || []), { ...a, id: Math.random().toString(36).substr(2, 9) }]
    }));
    toast.success('Ativo adicionado!');
  };

  const updateAsset = (a: Asset) => {
    setState(prev => ({
      ...prev,
      assets: (prev.assets || []).map(item => item.id === a.id ? a : item)
    }));
    toast.success('Ativo atualizado!');
  };

  const deleteAsset = (id: string) => {
    setState(prev => ({
      ...prev,
      assets: (prev.assets || []).filter(a => a.id !== id)
    }));
    toast.success('Ativo removido!');
  };

  const updateBudgetGoals = (goals: BudgetGoal[]) => {
    setState(prev => ({ ...prev, budgetGoals: goals }));
    toast.success('Metas salvas!');
  };

  const updateInvestmentGoals = (goals: InvestmentGoal[]) => {
    setState(prev => ({ ...prev, investmentGoals: goals }));
    toast.success('Metas de investimento salvas!');
  };

  const toggleTheme = () => {
    // Kept for interface compatibility but logic is forced light
    setState(prev => ({ ...prev, theme: 'light' }));
  };

  const resetData = () => {
    setState({
      transactions: [],
      assets: [],
      budgetGoals: INITIAL_BUDGET_GOALS,
      investmentGoals: INITIAL_INVESTMENT_GOALS,
      theme: 'light'
    });
    toast.success('Dados resetados!');
  };

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      // Explicit reconstruction during import to prevent schema mismatches
      setState({
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        assets: Array.isArray(parsed.assets) ? parsed.assets : [],
        budgetGoals: Array.isArray(parsed.budgetGoals) ? parsed.budgetGoals : INITIAL_BUDGET_GOALS,
        investmentGoals: Array.isArray(parsed.investmentGoals) ? parsed.investmentGoals : INITIAL_INVESTMENT_GOALS,
        theme: 'light'
      });
      toast.success('Dados importados com sucesso!');
    } catch (e) {
      console.error("Erro ao importar dados:", e);
      toast.error('Erro ao importar JSON. Verifique o formato do arquivo.');
    }
  };

  return (
    <AppContext.Provider value={{
      transactions: state.transactions || [],
      assets: state.assets || [],
      budgetGoals: state.budgetGoals || INITIAL_BUDGET_GOALS,
      investmentGoals: state.investmentGoals || INITIAL_INVESTMENT_GOALS,
      theme: 'light',
      addTransaction,
      deleteTransaction,
      updateTransaction,
      addAsset,
      updateAsset,
      deleteAsset,
      updateBudgetGoals,
      updateInvestmentGoals,
      toggleTheme,
      resetData,
      importData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
