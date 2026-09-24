import { Router } from 'express';
import * as controller from '../controllers/transaction.controller.js';
import { UserRole } from '../constants/enums.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';
import { requireFields } from '../middlewares/validator.middleware.js';

export const transactionRoutes = Router();

transactionRoutes.get('/', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.index);
transactionRoutes.post('/', requireRoles([UserRole.OWNER, UserRole.MANAGER]), requireFields(['type', 'category', 'amount', 'description', 'storeId', 'date']), controller.create);
transactionRoutes.put('/:id', requireRoles([UserRole.OWNER, UserRole.MANAGER]), controller.update);
transactionRoutes.patch('/:id/review', requireRoles([UserRole.OWNER]), controller.review);
transactionRoutes.delete('/:id', requireRoles([UserRole.OWNER]), controller.remove);
