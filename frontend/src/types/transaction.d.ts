import type { TransactionCategory, TransactionType } from '@/constants/enums';
import type { Store } from './store';

export interface Transaction {
  id: number;
  type: keyof typeof TransactionType;
  category: keyof typeof TransactionCategory;
  amount: number;
  description: string;
  relatedEmployeeId: number | null;
  storeId: number;
  date: string;
  receipt: string | null;
  reviewed: boolean;
  Store?: Store;
}
