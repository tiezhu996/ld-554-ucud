export interface AuditLogOperator {
  id: number;
  username: string;
}

export interface AuditLog {
  id: number;
  operatorId: number | null;
  action: string;
  target: string;
  targetId: number | null;
  storeId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ip: string;
  timestamp: string;
  operator?: AuditLogOperator | null;
  store?: { id: number; name: string } | null;
}

export interface AuditLogPage {
  list: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
