import type { NextFunction, Request, Response } from 'express';
import * as auditService from '../services/audit.service.js';
import { success } from '../utils/response.js';

export async function index(req: Request, res: Response, next: NextFunction) {
  try {
    success(res, await auditService.listAuditLogs(req.query, req.user));
  } catch (error) {
    next(error);
  }
}

export async function operators(req: Request, res: Response, next: NextFunction) {
  try {
    success(res, await auditService.listAuditOperators(req.user));
  } catch (error) {
    next(error);
  }
}
