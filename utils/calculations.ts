
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
  _classGap?: number;
}

export const planContribution = (
  assets: Asset[],
  investmentGoals: InvestmentGoal[],
  amount: number
): ContributionSuggestion[] => {
  if (amount <= 0) return [];

  // 1. Identify ALL valid candidates: 
  // - Assets you own (quantity > 0)
  // - Assets you want to own (score > 0, even if quantity == 0)
  const candidateAssets = assets.filter(a => a.quantity > 0 || (a.score && a.score > 0));

  // Calculate total current value (only considering what we actually HAVE)
  const totalValueCurrent = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  const totalValuePost = totalValueCurrent + amount;

  // Map goals for easy lookup
  const goalsMap = new Map(investmentGoals.map(g => [g.class, g.percentage]));

  // --- Step 2: Calculate Class-Level Metrics (Current vs Target) ---
  const classMetrics = new Map<string, { currentVal: number, currentPct: number, targetPct: number, gapPct: number }>();

  // A. Initialize with goals
  investmentGoals.forEach(g => {
    classMetrics.set(g.class, {
      currentVal: 0,
      currentPct: 0,
      targetPct: g.percentage,
      gapPct: 0
    });
  });

  // B. Aggregate current values per class
  assets.forEach(a => {
    if (a.quantity > 0) {
      const existing = classMetrics.get(a.class) || { currentVal: 0, currentPct: 0, targetPct: 0, gapPct: 0 };
      existing.currentVal += (a.quantity * a.currentPrice);
      classMetrics.set(a.class, existing);
    }
  });

  // C. Compute Class Gaps
  // Gap = Target% - Current% (Positive gap means we are UNDERWEIGHT and need to buy)
  for (const [cls, metric] of classMetrics.entries()) {
    metric.currentPct = totalValueCurrent > 0 ? (metric.currentVal / totalValueCurrent) * 100 : 0;
    metric.gapPct = metric.targetPct - metric.currentPct;
    classMetrics.set(cls, metric);
  }

  const candidateItems: {
    id: string;
    ticker: string;
    class: string;
    currentValue: number;
    idealPercentage: number;
    isNewClass: boolean;
    price: number;
    classGap: number; // Used for sorting
  }[] = [];

  // --- Step 3: Calculate Individual Ideal Percentages ---
  // We process per class to normalize weights
  const allClasses = new Set(candidateAssets.map(a => a.class));

  allClasses.forEach(className => {
    const classCandidates = candidateAssets.filter(a => a.class === className);
    // Sum of weights for this class
    const sumWeights = classCandidates.reduce((acc, a) => acc + Math.max(a.score || 0, 0.1), 0);
    const classGoalPct = goalsMap.get(className) || 0;
    const classMetric = classMetrics.get(className);
    const classGap = classMetric ? classMetric.gapPct : -999; // Default low priority if no meta

    classCandidates.forEach(a => {
      const relativeWeight = Math.max(a.score || 0, 0.1) / sumWeights;
      // The asset's ideal % of the TOTAL portfolio is: ClassGoal% * AssetRelativeWeight
      const assetIdealPct = classGoalPct * relativeWeight;

      candidateItems.push({
        id: a.id,
        ticker: a.ticker,
        class: a.class,
        currentValue: a.quantity * a.currentPrice,
        idealPercentage: assetIdealPct,
        isNewClass: a.quantity === 0,
        price: a.currentPrice,
        classGap: classGap
      });
    });
  });

  // --- Step 4: Two-Stage Allocation (Macro -> Micro) ---
  // The goal is to respect Class Priorities first. If a Class is overweight, it gets 0,
  // even if it contains "New Assets" that we want. Rebalancing > Picking.

  // A. Calculate Macro Deficits (Class Level)
  const classDeficits = new Map<string, number>();
  let totalMacroDeficit = 0;

  investmentGoals.forEach(g => {
    // Note: We use ALL assets for current value to get true class weight
    const currentClassVal = assets.filter(a => a.class === g.class).reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);

    // Target Value for this class based on the NEW total (Current + Contribution)
    const targetClassVal = (g.percentage / 100) * totalValuePost;

    // Deficit = How much MORE this class needs to reach its target
    const deficit = Math.max(0, targetClassVal - currentClassVal);

    classDeficits.set(g.class, deficit);
    totalMacroDeficit += deficit;
  });

  // B. Determine Global Scale Factor (How much of the total hole can we fill?)
  // If we have 5000 and total deficit is 10000, scale is 0.5. Everyone gets 50% of their need.
  // If we have 20000 and total deficit is 10000, scale is 1.0 (capped at filling the hole).
  // Note: We don't overfill classes in this version. Excess cash effectively "vanishes" from suggestion 
  // (or could be distributed to all? For now, let's target Equilibrium).
  const globalScale = totalMacroDeficit > 0 ? Math.min(1, amount / totalMacroDeficit) : 0;

  // C. Distribute to Assets constrained by Class Budget
  const finalResults: ContributionSuggestion[] = [];

  classDeficits.forEach((rawClassDeficit, className) => {
    const classBudget = rawClassDeficit * globalScale;

    if (classBudget > 1) { // Only process if class gets money
      // Find eligible assets in this class
      const classCandidates = candidateItems.filter(i => i.class === className);

      // Calculate Internal Gaps for these assets
      // (Asset Correct Value - Asset Current Value)
      let classInternalGapSum = 0;
      const candidatesWithGap = classCandidates.map(item => {
        const targetVal = (item.idealPercentage / 100) * totalValuePost;
        const gap = Math.max(0, targetVal - item.currentValue);
        classInternalGapSum += gap;
        return { ...item, gap };
      }).filter(i => i.gap > 0);

      // Distribute Class Budget among assets
      candidatesWithGap.forEach(c => {
        // Share of the class budget based on Asset Gap
        const share = classInternalGapSum > 0 ? (c.gap / classInternalGapSum) : 0;
        const allocation = classBudget * share;

        if (allocation > 1) {
          const item = candidateItems.find(ci => ci.id === c.id)!;
          const safePrice = item.price > 0 ? item.price : 1;
          const qty = item.price > 0 ? (allocation / safePrice) : 0;
          const afterVal = item.currentValue + allocation;

          finalResults.push({
            id: item.id,
            ticker: item.ticker,
            class: item.class,
            suggestedValue: allocation,
            suggestedQty: qty,
            currentPercentage: totalValueCurrent > 0 ? (item.currentValue / totalValueCurrent) * 100 : 0,
            afterPercentage: (afterVal / totalValuePost) * 100,
            idealPercentage: item.idealPercentage,
            isNewClass: item.isNewClass,
            _classGap: item.classGap
          });
        }
      });
    }
  });

  // Final sort by Amount Descending
  return finalResults.sort((a, b) => b.suggestedValue - a.suggestedValue);
};

export const calculateAdherenceScore = (assets: Asset[], investmentGoals: InvestmentGoal[]): number => {
  const totalValue = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  if (totalValue === 0) return 0;

  const validGoals = investmentGoals.filter(g => g.percentage > 0);
  let totalDeviation = 0;

  // Calculate deviation for each class target
  validGoals.forEach(goal => {
    const classAssets = assets.filter(a => a.class === goal.class);
    const classValue = classAssets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
    const currentPct = (classValue / totalValue) * 100;

    // Deviation is absolute difference
    totalDeviation += Math.abs(currentPct - goal.percentage);
  });

  // Add deviation for "Unknown" classes (assets not in any goal)
  const trackedClasses = new Set(validGoals.map(g => g.class));
  const unknownValue = assets
    .filter(a => !trackedClasses.has(a.class) && a.quantity > 0)
    .reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);

  if (unknownValue > 0) {
    totalDeviation += (unknownValue / totalValue) * 100;
  }

  // Max theoretical deviation is 200% (e.g. Target 100% A, Current 100% B -> Gap A=100, Gap B=100 -> Sum=200)
  // We want a score of 100 - (TotalDeviation / 2)
  const score = Math.max(0, 100 - (totalDeviation / 2));
  return Math.round(score);
};

export const calculatePortfolioDeficit = (assets: Asset[], investmentGoals: InvestmentGoal[]): number => {
  const totalValue = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
  if (totalValue === 0) return 0;

  let maxTheoreticalTotal = totalValue;

  // 1. Identify valid classes
  const validGoals = investmentGoals.filter(g => g.percentage > 0);

  // 2. For each class, calculate: 
  // "If this class value stayed the same, but was exactly at its Target %, what would the Total Portfolio Value be?"
  // Formula: TheoreticalTotal = CurrentClassValue / (Target% / 100)
  validGoals.forEach(goal => {
    const classAssets = assets.filter(a => a.class === goal.class);
    const classValue = classAssets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);

    if (goal.percentage > 0) {
      const theoreticalTotal = classValue / (goal.percentage / 100);
      if (theoreticalTotal > maxTheoreticalTotal) {
        maxTheoreticalTotal = theoreticalTotal;
      }
    }
  });

  // 3. The difference is the amount we need to inject to "dilute" the overweight assets
  // down to their target % without selling anything.
  return maxTheoreticalTotal - totalValue;
};
