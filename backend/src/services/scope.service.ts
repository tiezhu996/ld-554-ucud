import { Op, type WhereOptions } from 'sequelize';
import { UserRole } from '../constants/enums.js';
import type { AuthUser } from '../types/request.js';

export function storeScope(user?: AuthUser): WhereOptions {
  if (!user || user.role === UserRole.OWNER) return {};
  if (user.role === UserRole.MANAGER && user.storeId) return { storeId: user.storeId };
  if (user.role === UserRole.EMPLOYEE) return { [Op.or]: [{ storeId: user.storeId }, { id: user.employeeId }] };
  return {};
}

export function directStoreScope(user?: AuthUser): WhereOptions {
  if (!user || user.role === UserRole.OWNER) return {};
  if (user.storeId) return { id: user.storeId };
  return {};
}

/** 写操作门店范围校验：店长只能操作自己负责门店的数据。 */
export function assertStoreAllowed(storeId: number, user?: AuthUser) {
  if (!user || user.role === UserRole.OWNER) return;
  if (!user.storeId || user.storeId !== Number(storeId)) {
    throw Object.assign(new Error('无权操作其他门店的数据'), { status: 403 });
  }
}
