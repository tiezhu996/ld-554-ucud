import { Router } from 'express';
import * as controller from '../controllers/audit.controller.js';
import { UserRole } from '../constants/enums.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

export const auditRoutes = Router();

// 财务变更追溯日志：老板查全部门店，店长只看自己门店，数据范围在 service 中强制过滤
auditRoutes.get('/finance-logs', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.index);
auditRoutes.get('/finance-logs/operators', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.operators);
