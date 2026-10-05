import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./refunds.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const data = await svc.listRefunds(q);
  return ok(res, data);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});

const createSchema = z.object({
  nguoi_nhan_loai: z.enum(["sinh_vien", "nha_tuyen_dung"]),
  nguoi_nhan_id: z.coerce.number().int().positive(),
  so_tien: z.coerce.number().positive(),
  ly_do: z.string().min(1),
  khieu_nai_id: z.coerce.number().int().positive().optional().nullable(),
  bao_dam_id: z.coerce.number().int().positive().optional().nullable(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.createRefund(adminId, parsed.data);
  return okMsg(res, result.message);
});