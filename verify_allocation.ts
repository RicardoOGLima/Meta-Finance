
import { planContribution, calculatePortfolioDeficit } from './utils/calculations';
import { Asset, InvestmentGoal } from './types';

// Scenario: 
// Total Current: 1000.
// Actions: Target 40%. Current 10% (100). (Gap 30%) -> Needs huge boost.
// FIIs: Target 40%. Current 10% (100). (Gap 30%) -> Needs huge boost.
// Fixed: Target 20%. Current 80% (800). (Overweight).

// Dilution Math:
// Fixed is limiting factor. 800 needs to be 20%.
// Proj Total = 800 / 0.20 = 4000.
// Deficit = 4000 - 1000 = 3000.

// Plan:
// Actions Target = 40% of 4000 = 1600. Current 100. Gap = 1500.
// FIIs Target = 40% of 4000 = 1600. Current 100. Gap = 1500.
// Total Gap = 3000. Matches Deficit.

const goals: InvestmentGoal[] = [
    { class: 'Acoes', percentage: 40 },
    { class: 'FIIs', percentage: 40 },
    { class: 'Renda Fixa', percentage: 20 },
];

const assets: Asset[] = [
    { id: '1', ticker: 'PETR4', class: 'Acoes', quantity: 1, currentPrice: 100, score: 10, note: '', averagePrice: 90, idealPercentage: 0 },
    // Add multiple assets to clutter the list
    { id: '1b', ticker: 'VALE3', class: 'Acoes', quantity: 0, currentPrice: 100, score: 10, note: '', averagePrice: 0, idealPercentage: 0 },

    { id: '2', ticker: 'HGLG11', class: 'FIIs', quantity: 1, currentPrice: 100, score: 10, note: '', averagePrice: 90, idealPercentage: 0 },
    { id: '2b', ticker: 'KNIP11', class: 'FIIs', quantity: 0, currentPrice: 100, score: 10, note: '', averagePrice: 0, idealPercentage: 0 },

    { id: '3', ticker: 'TESOURO', class: 'Renda Fixa', quantity: 8, currentPrice: 100, score: 10, note: '', averagePrice: 100, idealPercentage: 0 },
];

const deficit = calculatePortfolioDeficit(assets, goals);
console.log(`Calculated Deficit: ${deficit} (Expected 3000)`);

console.log("\n--- Full Allocation (3000) ---");
const suggestionsFull = planContribution(assets, goals, deficit);
suggestionsFull.forEach(s => {
    console.log(`[${s.class}] ${s.ticker}: R$ ${s.suggestedValue.toFixed(2)} | Qty: ${s.suggestedQty}`);
});

console.log("\n--- Partial Allocation (1000) ---");
const suggestionsPartial = planContribution(assets, goals, 1000);
suggestionsPartial.forEach(s => {
    console.log(`[${s.class}] ${s.ticker}: R$ ${s.suggestedValue.toFixed(2)} | Qty: ${s.suggestedQty}`);
});
