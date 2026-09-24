import { defineStore } from 'pinia';
import { fetchAuditLogs } from '@/api/auditLog';
import type { AuditLog } from '@/types/audit-log';

export const useAuditLogStore = defineStore('auditLogs', {
  state: () => ({ list: [] as AuditLog[], total: 0, page: 1, pageSize: 20 }),
  actions: {
    async load(params = {}) {
      const response = await fetchAuditLogs(params) as { data: { list: AuditLog[]; total: number; page: number; pageSize: number } };
      this.list = response.data.list;
      this.total = response.data.total;
      this.page = response.data.page;
      this.pageSize = response.data.pageSize;
    }
  }
});
