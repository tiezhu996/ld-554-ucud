import { type WhereOptions } from 'sequelize';
import { Transaction, Employee, Store } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { getPagination } from '../utils/pagination.js';
import { storeScope, assertStoreAllowed } from './scope.service.js';
import { recordAudit } from './audit.service.js';
import { FinanceAuditAction } from '../constants/enums.js';
import type { AuthUser } from '../types/request.js';

const AUDIT_TARGET = 'transactions';

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

/** 记账：账目与追溯日志在同一事务内提交，日志写入失败则记账不生效。 */
export async function createTransaction(payload: Record<string, unknown>, user: AuthUser, ip: string) {
  return sequelize.transaction(async (t) => {
    assertStoreAllowed(Number(payload.storeId), user);
    const created = await Transaction.create(payload as never, { transaction: t });
    await recordAudit({
      operatorId: user.id,
      action: FinanceAuditAction.CREATE_TRANSACTION,
      target: AUDIT_TARGET,
      targetId: created.id,
      storeId: created.storeId,
      newValue: created.toJSON(),
      ip,
      transaction: t
    });
    return created;
  });
}

/** 修改账目：保留修改前内容，日志与账目更新同事务提交。 */
export async function updateTransaction(id: number, payload: Record<string, unknown>, user: AuthUser, ip: string) {
  return sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    assertStoreAllowed(transaction.storeId, user);
    if (payload.storeId !== undefined) assertStoreAllowed(Number(payload.storeId), user);
    const oldValue = transaction.toJSON();
    await transaction.update(payload, { transaction: t });
    await recordAudit({
      operatorId: user.id,
      action: FinanceAuditAction.UPDATE_TRANSACTION,
      target: AUDIT_TARGET,
      targetId: transaction.id,
      storeId: transaction.storeId,
      oldValue,
      newValue: transaction.toJSON(),
      ip,
      transaction: t
    });
    return transaction;
  });
}

/** 删除账目：删除前留存完整内容，日志写入失败则删除回滚。 */
export async function deleteTransaction(id: number, user: AuthUser, ip: string) {
  await sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    const oldValue = transaction.toJSON();
    await transaction.destroy({ transaction: t });
    await recordAudit({
      operatorId: user.id,
      action: FinanceAuditAction.DELETE_TRANSACTION,
      target: AUDIT_TARGET,
      targetId: id,
      storeId: oldValue.storeId,
      oldValue,
      ip,
      transaction: t
    });
  });
}

/** 审核：记录审核前后的审核状态，老板专属。 */
export async function reviewTransaction(id: number, reviewed: boolean, user: AuthUser, ip: string) {
  return sequelize.transaction(async (t) => {
    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) throw Object.assign(new Error('财务记录不存在'), { status: 404 });
    const oldValue = transaction.toJSON();
    await transaction.update({ reviewed }, { transaction: t });
    await recordAudit({
      operatorId: user.id,
      action: FinanceAuditAction.REVIEW_TRANSACTION,
      target: AUDIT_TARGET,
      targetId: transaction.id,
      storeId: transaction.storeId,
      oldValue,
      newValue: transaction.toJSON(),
      ip,
      transaction: t
    });
    return transaction;
  });
}
