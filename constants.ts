
import { ExpenseCategory, IncomeCategory } from './types';

export const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);
export const INCOME_CATEGORIES = Object.values(IncomeCategory);

export const INVESTMENT_CLASSES = [
  'Ações (BR)', 
  'Stocks', 
  'FIIs', 
  'REITs', 
  'Cripto', 
  'Renda Fixa (BR)', 
  'Renda Fixa Inter.'
];

export const EXPENSE_SUBCATEGORIES = [
  "Academia", 
  "Almoço", 
  "Comidas e Roles", 
  "Condomínio", 
  "Educação", 
  "Eletrônicos", 
  "Impostos", 
  "Investimentos", 
  "Jogos", 
  "Luz", 
  "Médico",
  "Outros", 
  "Psicólogo", 
  "Streaming", 
  "Telefone/Internet", 
  "Transporte"
];

export const PAYMENT_METHODS = ['Pix', 'Débito', 'Crédito', 'Boleto', 'Dinheiro'];

export const INITIAL_BUDGET_GOALS = EXPENSE_CATEGORIES.map((cat, idx) => {
  const base = 100 / EXPENSE_CATEGORIES.length;
  let percentage = parseFloat(base.toFixed(1));
  
  if (idx === EXPENSE_CATEGORIES.length - 1) {
    const sumOthers = EXPENSE_CATEGORIES.slice(0, -1).reduce((acc, _, i) => {
      return acc + parseFloat((100 / EXPENSE_CATEGORIES.length).toFixed(1));
    }, 0);
    percentage = parseFloat((100 - sumOthers).toFixed(1));
  }

  return {
    category: cat,
    percentage: percentage
  };
});

export const INITIAL_INVESTMENT_GOALS = INVESTMENT_CLASSES.map((cls, idx) => {
  const base = 100 / INVESTMENT_CLASSES.length;
  let percentage = parseFloat(base.toFixed(1));
  
  if (idx === INVESTMENT_CLASSES.length - 1) {
    const sumOthers = INVESTMENT_CLASSES.slice(0, -1).reduce((acc, _, i) => {
      return acc + parseFloat((100 / INVESTMENT_CLASSES.length).toFixed(1));
    }, 0);
    percentage = parseFloat((100 - sumOthers).toFixed(1));
  }

  return {
    class: cls,
    percentage: percentage
  };
});
