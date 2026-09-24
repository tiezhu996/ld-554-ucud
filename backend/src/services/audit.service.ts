import { Op, type Transaction as DbTransaction, type WhereOptions } from 'sequelize';
import { AuditLog, Store, User } from '../models/index.js';
import { UserRole } from '../constants/enums.js';
import { getPagination } from '../utils/pagination.js';
import type { AuthUser } from '../types/request.js';

export async function recordAudit(
  input: {
    operatorId: number | null;
    action: string;
    target: string;
    storeId?: number | null;
    oldValue?: unknown;
    newValue?: unknown;
    ip: string;
  },
  transaction?: DbTransaction
) {
  return AuditLog.create(
    {
      operatorId: input.operatorId,
      action: input.action,
      target: input.target,
      storeId: input.storeId ?? null,
      oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
      newValue: input.newValue ? JSON.stringify(input.newValue) : null,
      ip: input.ip
    },
    { transaction }
  );
}

export async function listAuditLogs(query: Record<string, unknown>, user?: AuthUser) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where: WhereOptions = {};
  if (user?.role === UserRole.MANAGER && user.storeId) {
    Object.assign(where, { storeId: user.storeId });
  } else if (query.storeId) {
    Object.assign(where, { storeId: query.storeId });
  }
  if (query.operatorId) Object.assign(where, { operatorId: query.operatorId });
  if (query.action) Object.assign(where, { action: query.action });
  if (query.startDate || query.endDate) {
    const range: Record<symbol, string> = {};
    if (query.startDate) range[Op.gte] = `${query.startDate} 00:00:00`;
    if (query.endDate) range[Op.lte] = `${query.endDate} 23:59:59`;
    Object.assign(where, { timestamp: range });
  }
  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: User, attributes: ['id', 'username'] },
      { model: Store, attributes: ['id', 'name'] }
    ],
    order: [['timestamp', 'DESC'], ['id', 'DESC']]
  });
  return { list: rows, total: count, page, pageSize };
}

export async function listAuditOperators(user?: AuthUser) {
  const where: WhereOptions = { operatorId: { [Op.ne]: null } };
  if (user?.role === UserRole.MANAGER && user.storeId) Object.assign(where, { storeId: user.storeId });
  const rows = await AuditLog.findAll({ attributes: ['operatorId'], where, group: ['operatorId'] });
  const ids = rows.map((row) => row.operatorId).filter((id): id is number => id !== null);
  if (!ids.length) return [];
  return User.findAll({ where: { id: ids }, attributes: ['id', 'username'], order: [['id', 'ASC']] });
}
