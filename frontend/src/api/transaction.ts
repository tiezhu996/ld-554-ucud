import { request } from '@/utils/request';

export function fetchTransactions(params = {}) {
  return request.get('/transactions', { params });
}

export function createTransaction(data: Record<string, unknown>) {
  return request.post('/transactions', data);
}

export function updateTransaction(id: number, data: Record<string, unknown>) {
  return request.put(`/transactions/${id}`, data);
}

export function reviewTransaction(id: number) {
  return request.post(`/transactions/${id}/review`);
}

export function deleteTransaction(id: number) {
  return request.delete(`/transactions/${id}`);
}
