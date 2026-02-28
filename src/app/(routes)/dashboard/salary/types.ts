export interface Payment {
  _id: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
}

export interface Salary {
  _id: string;
  employee: Employee;
  baseSalary: number;
  month: string;
  year: number;
  payments: Payment[];
  totalPaid: number;
  remainingBalance: number;
  status: 'pending' | 'partial' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawSalary {
  _id: string | number;
  employee?: {
    _id?: string | number;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  baseSalary?: number;
  month?: string;
  year?: number;
  payments?: Payment[];
  totalPaid?: number;
  remainingBalance?: number;
  status?: 'pending' | 'partial' | 'paid';
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateSalaryData {
  employeeId: string;
  baseSalary: number;
  month: string;
  year: number;
  notes?: string;
}

export interface UpdateSalaryData {
  baseSalary?: number;
  month?: string;
  year?: number;
  notes?: string;
}

export interface CreatePaymentData {
  amount: number;
  date: string;
  notes?: string;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export type Month = typeof MONTHS[number];
