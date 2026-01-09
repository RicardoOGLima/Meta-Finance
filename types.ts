
export type DividendType = 'Dividendos' | 'JSCP' | 'Rendimento';

export type TransactionType = 'RECCEITA' | 'DESPESA';

export enum ExpenseCategory {
  CUSTO_FIXO = 'Custo Fixo',
  CONFORTO = 'Conforto',
  METAS = 'Metas',
  PRAZERES = 'Prazeres',
  LIBERDADE_FINANCEIRA = 'Liberdade Financeira',
  CONHECIMENTO = 'Conhecimento'
}

export enum IncomeCategory {
  ALUGUEL = 'Aluguel',
  CONSULTORIA = 'Consultoria',
  NEGOCIOS = 'Negócios',
  SALARIOS = 'Salários',
  OUTROS = 'Outros'
}

export type PaymentMethod = 'Pix' | 'Débito' | 'Crédito' | 'Boleto' | 'Dinheiro';

export interface Transaction {
  id: string;
  date: string; // ISO format
  type: TransactionType;
  category: string; // Now holds either ExpenseCategory or IncomeCategory values
  subcategory: string;
  description: string;
  paymentMethod: PaymentMethod;
  installments: number;
  currentInstallment?: number;
  value: number;
  groupId?: string; // Links installments together
  createdAt?: string; // ISO format for creation time
}

export interface BudgetGoal {
  category: ExpenseCategory;
  percentage: number;
}

export interface InvestmentGoal {
  class: string;
  percentage: number;
}

export interface Asset {
  id: string;
  class: string;
  ticker: string;
  note: string; // Description/Observations
  score: number; // Numeric score 0-15
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  idealPercentage: number;
}

export interface Dividend {
  id: string;
  date: string; // ISO format
  assetId: string;
  ticker: string;
  class: string;
  type: DividendType;
  valuePerShare: number;
  totalValue: number;
}

export interface AppState {
  transactions: Transaction[];
  assets: Asset[];
  dividends?: Dividend[]; // Optional for backward compatibility with saved data
  budgetGoals: BudgetGoal[];
  investmentGoals: InvestmentGoal[];
  subcategories: string[];
  theme: 'light' | 'dark';
}
