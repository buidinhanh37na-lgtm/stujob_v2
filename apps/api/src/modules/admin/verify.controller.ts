import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./verify.service";

// GET /api/admin/verify?status=cho_duyet&q=...
export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "cho_duyet";
  const q = (req.query.q as string) || "";
  const data = await svc.listRequests(status, q);
  return ok(res, data);
});

// GET /api/admin/verify/detail?id=...
export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt((req.query.id as string) || "0", 10);
  if (!id) return fail(res, "Thiếu ID");
  const data = await svc.getRequestDetail(id);
  return ok(res, data);
});

// POST /api/admin/verify/approve
const approveSchema = z.object({
  id: z.coerce.number().int().positive(),
  ghi_chu: z.string().optional(),
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = approveSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Dữ liệu không hợp lệ");
  const result = await svc.approveRequest(
    adminId,
    parsed.data.id,
    parsed.data.ghi_chu || ""
  );
  return okMsg(res, result.message);
});

// POST /api/admin/verify/reject
const rejectSchema = z.object({
  id: z.coerce.number().int().positive(),
  ly_do: z.string().min(1),
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Vui lòng nhập lý do");
  const result = await svc.rejectRequest(adminId, parsed.data.id, parsed.data.ly_do);
  return okMsg(res, result.message);
});

// POST /api/admin/verify/auto-verify
export const autoVerify = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const result = await svc.autoVerifyBatch(adminId);
  return okMsg(res, result.message, {
    success: result.success,
    failed: result.failed,
  });
});

// GET /api/admin/verify/stats
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});