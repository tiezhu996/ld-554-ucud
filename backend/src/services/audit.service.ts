import { Op, type Transaction as SequelizeTransaction, type WhereOptions } from 'sequelize';
import { AuditLog, Store, User } from '../models/index.js';
import { getPagination } from '../utils/pagination.js';
import type { AuthUser } from '../types/request.js';

export async function recordAudit(input: {
  operatorId: number | null;
  action: string;
  target: string;
  targetId?: number | null;
  storeId?: number | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip: string;
  transaction?: SequelizeTransaction;
}) {
  return AuditLog.create(
    {
      operatorId: input.operatorId,
      action: input.action,
      target: input.target,
      targetId: input.targetId ?? null,
      storeId: input.storeId ?? null,
      oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
      newValue: input.newValue ? JSON.stringify(input.newValue) : null,
      ip: input.ip
    },
    { transaction: input.transaction }
  );
}

/**
 * 财务变更追溯日志查询：
 * - Owner 可查全部门店；Manager 只能查自己负责的门店。
 * - 支持按经办人、动作、门店、日期区间筛选。
 */
export async function listAuditLogs(query: Record<string, unknown>, user?: AuthUser) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where: WhereOptions = { target: 'transactions' };

  if (user?.role === 'MANAGER') {
    // 店长只能查自己负责的门店；未归属门店的店长看不到任何日志
    where.storeId = user.storeId ?? -1;
  } else if (query.storeId) {
    where.storeId = query.storeId;
  }

  if (query.operatorId) where.operatorId = Number(query.operatorId);
  if (query.action) where.action = query.action;
  if (query.startDate || query.endDate) {
    where.timestamp = {
      ...(query.startDate ? { [Op.gte]: new Date(`${query.startDate}T00:00:00`) } : {}),
      ...(query.endDate ? { [Op.lte]: new Date(`${query.endDate}T23:59:59`) } : {})
    };
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: User, as: 'operator', attributes: ['id', 'username'] },
      { model: Store, as: 'store', attributes: ['id', 'name'] }
    ],
    order: [['timestamp', 'DESC'], ['id', 'DESC']]
  });
  return { list: rows, total: count, page, pageSize };
}

/** 经办人下拉：Owner 看全部财务操作经办人，Manager 只看本门店日志里出现过的经办人。 */
export async function listAuditOperators(user?: AuthUser) {
  const where: WhereOptions = { target: 'transactions', operatorId: { [Op.not]: null } };
  if (user?.role === 'MANAGER' && user.storeId) where.storeId = user.storeId;

  const logs = await AuditLog.findAll({ where, attributes: ['operatorId'], group: ['operatorId'] });
  const ids = logs.map((log) => log.operatorId) as number[];
  if (ids.length === 0) return [];
  const users = await User.findAll({ where: { id: ids }, attributes: ['id', 'username'] });
  return users;
}
