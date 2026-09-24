import type { AuditAction } from '@/constants/enums';

export interface AuditLog {
  id: number;
  operatorId: number | null;
  action: keyof typeof AuditAction;
  target: string;
  storeId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ip: string;
  timestamp: string;
  User?: { id: number; username: string } | null;
  Store?: { id: number; name: string } | null;
}

export interface AuditOperator {
  id: number;
  username: string;
}
