export type ExpenseCategory =
  | 'Utilities'
  | 'Rent'
  | 'Supplies'
  | 'Maintenance'
  | 'Salaries'
  | 'Marketing'
  | 'Insurance'
  | 'Taxes'
  | 'Transportation'
  | 'Equipment'
  | 'Other';

export type PaymentMethod =
  | 'Cash'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Check'
  | 'Other';

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  receipt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawExpense {
  _id: string | number;
  title?: string;
  amount?: number;
  category?: string;
  date?: string | Date;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  receipt?: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateExpenseData {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  receipt?: string | null;
}

export interface UpdateExpenseData {
  title?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  receipt?: string | null;
  isActive?: boolean;
}

export interface ExpenseSummary {
  totalExpenses: number;
  count: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities',
  'Rent',
  'Supplies',
  'Maintenance',
  'Salaries',
  'Marketing',
  'Insurance',
  'Taxes',
  'Transportation',
  'Equipment',
  'Other',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Other',
];
