import { request } from '@/utils/request';

export interface AuditLogQuery {
  operatorId?: number;
  action?: string;
  storeId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function fetchFinanceLogs(params: AuditLogQuery = {}) {
  return request.get('/audit-logs/finance-logs', { params });
}

export function fetchAuditOperators() {
  return request.get('/audit-logs/finance-logs/operators');
}
