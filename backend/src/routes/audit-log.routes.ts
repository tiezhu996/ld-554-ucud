import { Router } from 'express';
import * as controller from '../controllers/audit-log.controller.js';
import { UserRole } from '../constants/enums.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

export const auditLogRoutes = Router();

auditLogRoutes.get('/', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.index);
auditLogRoutes.get('/operators', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.operators);
