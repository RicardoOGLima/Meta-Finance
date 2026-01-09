
import { Transaction, Asset, BudgetGoal, InvestmentGoal } from '../types';

export const getMonthYearKey = (date: Date) => {
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const calculateSummary = (transactions: Transaction[], month: number, year: number) => {
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const income = filtered.filter(t => t.type === 'RECCEITA').reduce((acc, t) => acc + t.value, 0);
  const expense = filtered.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.value, 0);

  return { income, expense, balance: income - expense };
};

/**
 * Calculates current portfolio state, computes 'idealPercentage' 
 * dynamically based on InvestmentGoals (Class Meta) and Asset Scores.
 */
export const calculatePortfolioMetrics = (assets: Asset[], investmentGoals: InvestmentGoal[]) => {
  const totalValue = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  const goalsMap = new Map(investmentGoals.map(g => [g.class, g.percentage]));

  const metrics = assets.map(a => {
    const assetValue = a.quantity * a.currentPrice;
    const currentPercentage = totalValue > 0 ? (assetValue / totalValue) * 100 : 0;

    // Only calculate weights for active assets (qty > 0)
    const classAssets = assets.filter(ca => ca.class === a.class && ca.quantity > 0);
    const sumWeights = classAssets.reduce((acc, ca) => acc + Math.max(ca.score || 0, 0.1), 0);

    let idealPercentage = 0;
    if (a.quantity > 0 && sumWeights > 0) {
      const relativeWeight = Math.max(a.score || 0, 0.1) / sumWeights;
      const classGoal = goalsMap.get(a.class) || 0;
      idealPercentage = classGoal * relativeWeight;
    }

    const gap = idealPercentage - currentPercentage;

    return {
      ...a,
      totalValue: assetValue,
      currentPercentage,
      idealPercentage,
      gap
    };
  });

  // Calculate allocation for ALL defined investment goals (classes)
  const classAllocation = investmentGoals.map(goal => {
    const classAssets = assets.filter(a => a.class === goal.class);
    const value = classAssets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
    const currentPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return {
      name: goal.class,
      value: currentPercentage,
      meta: goal.percentage
    };
  }).sort((a, b) => b.meta - a.meta);

  return { totalValue, metrics, classAllocation };
};

export interface ContributionSuggestion {
  id: string;
  ticker: string;
  class: string;
  suggestedValue: number;
  suggestedQty: number;
  currentPercentage: number;
  afterPercentage: number;
  idealPercentage: number;
  isNewClass?: boolean;
}

export const planContribution = (
  assets: Asset[],
  investmentGoals: InvestmentGoal[],
  amount: number
): ContributionSuggestion[] => {
  if (amount <= 0) return [];

  const activeAssets = assets.filter(a => a.quantity > 0);
  const totalValueCurrent = activeAssets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  const totalValuePost = totalValueCurrent + amount;
  const goalsMap = new Map(investmentGoals.map(g => [g.class, g.percentage]));

  const candidateItems: {
    id: string;
    ticker: string;
    class: string;
    currentValue: number;
    idealPercentage: number;
    isNewClass: boolean;
    price: number;
  }[] = [];

  // 1. Identify active assets (qty > 0) and their ideal percentages
  activeAssets.forEach(a => {
    const classAssets = activeAssets.filter(ca => ca.class === a.class);
    const sumWeights = classAssets.reduce((acc, ca) => acc + Math.max(ca.score || 0, 0.1), 0);
    const relativeWeight = Math.max(a.score || 0, 0.1) / sumWeights;
    const classMeta = goalsMap.get(a.class) || 0;

    candidateItems.push({
      id: a.id,
      ticker: a.ticker,
      class: a.class,
      currentValue: a.quantity * a.currentPrice,
      idealPercentage: classMeta * relativeWeight,
      isNewClass: false,
      price: a.currentPrice
    });
  });

  // 2. Identify classes with goals but NO active assets
  const classesWithActiveAssets = new Set(activeAssets.map(a => a.class));
  investmentGoals.forEach(goal => {
    if (goal.percentage > 0 && !classesWithActiveAssets.has(goal.class)) {
      candidateItems.push({
        id: `new-class-${goal.class}`,
        ticker: `Nova Compra`,
        class: goal.class,
        currentValue: 0,
        idealPercentage: goal.percentage,
        isNewClass: true,
        price: 1
      });
    }
  });

  // 3. Calculate target values and gaps
  let suggestions: ContributionSuggestion[] = candidateItems.map(item => {
    const targetValue = (item.idealPercentage / 100) * totalValuePost;
    const gapBrl = Math.max(0, targetValue - item.currentValue);

    return {
      id: item.id,
      ticker: item.ticker,
      class: item.class,
      suggestedValue: gapBrl,
      suggestedQty: 0,
      currentPercentage: totalValueCurrent > 0 ? (item.currentValue / totalValueCurrent) * 100 : 0,
      afterPercentage: 0,
      idealPercentage: item.idealPercentage,
      isNewClass: item.isNewClass
    };
  }).sort((a, b) => b.suggestedValue - a.suggestedValue);

  // 4. Allocate amount greedily
  let remainingAporte = amount;
  const finalResults: ContributionSuggestion[] = [];

  for (const s of suggestions) {
    if (remainingAporte <= 0) break;

    const allocation = Math.min(s.suggestedValue, remainingAporte);
    if (allocation > 0.01) {
      remainingAporte -= allocation;
      const item = candidateItems.find(ci => ci.id === s.id)!;
      const afterVal = item.currentValue + allocation;

      finalResults.push({
        ...s,
        suggestedValue: allocation,
        suggestedQty: !s.isNewClass ? (allocation / item.price) : 0,
        afterPercentage: (afterVal / totalValuePost) * 100
      });
    }
  }

  return finalResults.sort((a, b) => b.suggestedValue - a.suggestedValue);
};
