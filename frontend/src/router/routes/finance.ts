export const financeRoutes = [
  { path: '/finance', name: 'finance', component: () => import('@/pages/finance/FinanceList.vue'), meta: { roles: ['OWNER', 'MANAGER'] } },
  { path: '/finance/audit-logs', name: 'finance-audit-logs', component: () => import('@/pages/finance/FinanceAuditLogs.vue'), meta: { roles: ['OWNER', 'MANAGER'] } }
];
