import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./jobs.service";

// GET /api/admin/jobs
export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.listJobs({
    status: (req.query.status as string) || "all",
    q: (req.query.q as string) || undefined,
    page: req.query.page ? Number(req.query.page) : 1,
  });
  return ok(res, data);
});

// GET /api/admin/jobs/stats
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.getStats());
});

// POST /api/admin/jobs/force-close
const forceSchema = z.object({
  id: z.coerce.number().int().positive(),
  ly_do: z.string().min(1, "Nhập lý do"),
});

export const forceClose = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = forceSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  const result = await svc.forceCloseJob(
    adminId,
    parsed.data.id,
    parsed.data.ly_do
  );
  return okMsg(res, result.message);
});

// DELETE /api/admin/jobs?id=
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = Number(req.query.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteJob(adminId, id);
  return okMsg(res, result.message);
});