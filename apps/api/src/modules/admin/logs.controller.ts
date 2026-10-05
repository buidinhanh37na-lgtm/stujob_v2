import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./logs.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.listLogs({
    admin_id: req.query.admin_id ? Number(req.query.admin_id) : undefined,
    action: (req.query.action as string) || undefined,
    q: (req.query.q as string) || undefined,
    page: req.query.page ? Number(req.query.page) : 1,
  });
  return ok(res, data);
});

export const admins = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.listAdminOptions());
});

export const actions = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.listActions());
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.getLogsStats());
});

const cleanSchema = z.object({
  days: z.coerce.number().int().min(7).max(3650),
});

export const cleanOld = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = cleanSchema.safeParse(req.query);
  if (!parsed.success) return fail(res, "Số ngày không hợp lệ (7-3650)");
  const result = await svc.cleanOldLogs(adminId, parsed.data.days);
  return okMsg(res, result.message);
});