import { type Transaction as DbTransaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Transaction, Employee, Store } from '../models/index.js';
import { AuditAction } from '../constants/enums.js';
import { getPagination } from '../utils/pagination.js';
import { recordAudit } from './audit.service.js';
import { storeScope } from './scope.service.js';
import type { AuthUser } from '../types/request.js';

export interface AuditContext {
  operatorId: number | null;
  ip: string;
}

export async function listTransactions(query: Record<string, unknown>, user?: AuthUser) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where: WhereOptions = { ...storeScope(user) };
  if (query.type) Object.assign(where, { type: query.type });
  if (query.category) Object.assign(where, { category: query.category });
  if (query.storeId) Object.assign(where, { storeId: query.storeId });
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    limit,
    offset,
    include: [{ model: Employee, as: 'relatedEmployee' }, Store],
    order: [['date', 'DESC']]
  });
  return { list: rows, total: count, page, pageSize };
}

export async function createTransaction(payload: Record<string, unknown>, audit: AuditContext) {
  return sequelize.transaction(async (t) => {
    const created = await Transaction.create(payload as never, { transaction: t });
    await writeTransactionAudit(audit, {
      action: AuditAction.CREATE_TRANSACTION,
      target: `transactions#${created.id}`,
      storeId: created.storeId,
      newValue: created.toJSON()
    }, t);
    return created;
  });
}

export async function updateTransaction(id: number, payload: Record<string, unknown>, audit: AuditContext) {
  return sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    const oldValue = transaction.toJSON();
    await transaction.update(payload, { transaction: t });
    await writeTransactionAudit(audit, {
      action: AuditAction.UPDATE_TRANSACTION,
      target: `transactions#${transaction.id}`,
      storeId: transaction.storeId,
      oldValue,
      newValue: transaction.toJSON()
    }, t);
    return transaction;
  });
}

export async function reviewTransaction(id: number, audit: AuditContext) {
  return sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    if (transaction.reviewed) throw Object.assign(new Error('该记录已审核'), { status: 400 });
    const oldValue = transaction.toJSON();
    await transaction.update({ reviewed: true }, { transaction: t });
    await writeTransactionAudit(audit, {
      action: AuditAction.REVIEW_TRANSACTION,
      target: `transactions#${transaction.id}`,
      storeId: transaction.storeId,
      oldValue,
      newValue: transaction.toJSON()
    }, t);
    return transaction;
  });
}

export async function deleteTransaction(id: number, audit: AuditContext) {
  return sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    const oldValue = transaction.toJSON();
    await transaction.destroy({ transaction: t });
    await writeTransactionAudit(audit, {
      action: AuditAction.DELETE_TRANSACTION,
      target: `transactions#${id}`,
      storeId: transaction.storeId,
      oldValue
    }, t);
  });
}

async function writeTransactionAudit(
  audit: AuditContext,
  entry: { action: string; target: string; storeId: number; oldValue?: unknown; newValue?: unknown },
  t: DbTransaction
) {
  try {
    await recordAudit({ operatorId: audit.operatorId, ip: audit.ip, ...entry }, t);
  } catch {
    throw Object.assign(new Error('操作日志写入失败，本次账目变动未生效'), { status: 500 });
  }
}
