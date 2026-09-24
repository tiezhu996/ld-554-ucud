import { request } from '@/utils/request';

export function fetchAuditLogs(params = {}) {
  return request.get('/audit-logs', { params });
}

export function fetchAuditOperators() {
  return request.get('/audit-logs/operators');
}
