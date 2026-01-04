
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Transaction, Asset, BudgetGoal, InvestmentGoal, AppState, Dividend } from '../types';
import { INITIAL_BUDGET_GOALS, INITIAL_INVESTMENT_GOALS, EXPENSE_SUBCATEGORIES } from '../constants';
import { storage } from '../utils/storage';
import toast from 'react-hot-toast';

interface AppContextType extends AppState {
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (t: Transaction) => void;
  addAsset: (a: Omit<Asset, 'id'>) => void;
  updateAsset: (a: Asset) => void;
  deleteAsset: (id: string) => void;
  addDividend: (d: Omit<Dividend, 'id'>) => void;
  updateDividend: (d: Dividend) => void;
  deleteDividend: (id: string) => void;
  updateBudgetGoals: (goals: BudgetGoal[]) => void;
  updateInvestmentGoals: (goals: InvestmentGoal[]) => void;
  updateSubcategories: (subs: string[]) => void;
  toggleTheme: () => void;
  resetData: () => void;
  importData: (json: string) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    transactions: [],
    assets: [],
    dividends: [],
    budgetGoals: INITIAL_BUDGET_GOALS,
    investmentGoals: INITIAL_INVESTMENT_GOALS,
    subcategories: EXPENSE_SUBCATEGORIES,
    theme: 'light'
  });

  const hasLoaded = useRef(false);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      console.log("[AppContext] Starting initial data load...");
      try {
        const saved = await storage.load();
        if (saved) {
          console.log("[AppContext] Data loaded successfully from storage:", {
            transactionCount: saved.transactions?.length || 0,
            assetCount: saved.assets?.length || 0,
            hasBudgetGoals: !!saved.budgetGoals,
            hasInvestmentGoals: !!saved.investmentGoals
          });
          setState({
            transactions: Array.isArray(saved.transactions) ? saved.transactions : [],
            assets: Array.isArray(saved.assets) ? saved.assets : [],
            dividends: Array.isArray(saved.dividends) ? saved.dividends : [],
            budgetGoals: Array.isArray(saved.budgetGoals) ? saved.budgetGoals : INITIAL_BUDGET_GOALS,
            investmentGoals: Array.isArray(saved.investmentGoals) ? saved.investmentGoals : INITIAL_INVESTMENT_GOALS,
            subcategories: Array.isArray(saved.subcategories) ? saved.subcategories : EXPENSE_SUBCATEGORIES,
            theme: 'light'
          });
        } else {
          console.log("[AppContext] No saved data found, using defaults.");
        }
      } catch (e) {
        console.error("[AppContext] Error during initial data load:", e);
        toast.error("Erro ao carregar dados. Usando padrões.");
      } finally {
        setIsDataLoading(false);
        hasLoaded.current = true;
        console.log("[AppContext] Initial data load complete.");
      }
    };

    loadData();
  }, []);

  // Sync state to storage
  useEffect(() => {
    if (hasLoaded.current) {
      storage.save(state);
    }
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

  const updateSubcategories = (subs: string[]) => {
    setState(prev => ({ ...prev, subcategories: subs }));
    toast.success('Subcategorias atualizadas!');
  };

  const addDividend = (d: Omit<Dividend, 'id'>) => {
    const newDividend = { ...d, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      // Update the asset's total dividends as well
      const updatedAssets = (prev.assets || []).map(a =>
        a.id === d.assetId ? { ...a, totalDividends: (a.totalDividends || 0) + d.totalValue } : a
      );

      return {
        ...prev,
        dividends: [...(prev.dividends || []), newDividend],
        assets: updatedAssets
      };
    });
    toast.success('Provento registrado!');
  };

  const updateDividend = (updated: Dividend) => {
    setState(prev => {
      const oldDividend = (prev.dividends || []).find(d => d.id === updated.id);
      if (!oldDividend) return prev;

      const updatedAssets = (prev.assets || []).map(a => {
        let val = a.totalDividends || 0;
        if (a.id === oldDividend.assetId) val -= oldDividend.totalValue;
        if (a.id === updated.assetId) val += updated.totalValue;
        return { ...a, totalDividends: Math.max(0, val) };
      });

      return {
        ...prev,
        dividends: (prev.dividends || []).map(d => d.id === updated.id ? updated : d),
        assets: updatedAssets
      };
    });
    toast.success('Provento atualizado!');
  };

  const deleteDividend = (id: string) => {
    setState(prev => {
      const dividendToDelete = (prev.dividends || []).find(d => d.id === id);
      if (!dividendToDelete) return prev;

      const updatedAssets = (prev.assets || []).map(a =>
        a.id === dividendToDelete.assetId ? { ...a, totalDividends: Math.max(0, (a.totalDividends || 0) - dividendToDelete.totalValue) } : a
      );

      return {
        ...prev,
        dividends: (prev.dividends || []).filter(d => d.id !== id),
        assets: updatedAssets
      };
    });
    toast.success('Provento removido!');
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: 'light' }));
  };

  const resetData = () => {
    setState({
      transactions: [],
      assets: [],
      dividends: [],
      budgetGoals: INITIAL_BUDGET_GOALS,
      investmentGoals: INITIAL_INVESTMENT_GOALS,
      subcategories: EXPENSE_SUBCATEGORIES,
      theme: 'light'
    });
    toast.success('Dados resetados!');
  };

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setState({
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        assets: Array.isArray(parsed.assets) ? parsed.assets : [],
        dividends: Array.isArray(parsed.dividends) ? parsed.dividends : [],
        budgetGoals: Array.isArray(parsed.budgetGoals) ? parsed.budgetGoals : INITIAL_BUDGET_GOALS,
        investmentGoals: Array.isArray(parsed.investmentGoals) ? parsed.investmentGoals : INITIAL_INVESTMENT_GOALS,
        subcategories: Array.isArray(parsed.subcategories) ? parsed.subcategories : EXPENSE_SUBCATEGORIES,
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
      dividends: state.dividends || [],
      budgetGoals: state.budgetGoals || INITIAL_BUDGET_GOALS,
      investmentGoals: state.investmentGoals || INITIAL_INVESTMENT_GOALS,
      subcategories: state.subcategories || EXPENSE_SUBCATEGORIES,
      theme: 'light',
      addTransaction,
      deleteTransaction,
      updateTransaction,
      addAsset,
      updateAsset,
      deleteAsset,
      addDividend,
      updateDividend,
      deleteDividend,
      updateBudgetGoals,
      updateInvestmentGoals,
      updateSubcategories,
      toggleTheme,
      resetData,
      importData,
      isDataLoading
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
