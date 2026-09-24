import { request } from '@/utils/request';

export function fetchTransactions(params = {}) {
  return request.get('/transactions', { params });
}

export function createTransaction(data: Record<string, unknown>) {
  return request.post('/transactions', data, { skipGlobalError: true });
}

export function updateTransaction(id: number, data: Record<string, unknown>) {
  return request.put(`/transactions/${id}`, data, { skipGlobalError: true });
}

export function reviewTransaction(id: number, reviewed: boolean) {
  return request.patch(`/transactions/${id}/review`, { reviewed }, { skipGlobalError: true });
}

export function deleteTransaction(id: number) {
  return request.delete(`/transactions/${id}`, { skipGlobalError: true });
}
