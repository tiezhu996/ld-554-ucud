export const financeRoutes = [
  { path: '/finance', name: 'finance', component: () => import('@/pages/finance/FinanceList.vue'), meta: { roles: ['OWNER', 'MANAGER'] } },
  { path: '/finance/logs', name: 'finance-logs', component: () => import('@/pages/finance/AuditLogList.vue'), meta: { roles: ['OWNER', 'MANAGER'] } }
];
