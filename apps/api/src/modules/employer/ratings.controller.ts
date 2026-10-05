import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./ratings.service";

export const listRatings = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.listRatings(ntdId);
  return ok(res, data);
});

const createSchema = z.object({
  sinh_vien_id: z.coerce.number().int().positive(),
  viec_lam_id: z.coerce.number().int().positive().optional().nullable(),
  diem: z.coerce.number().int().min(1).max(5),
  nhan_xet: z.string().optional(),
});

export const createRating = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.createRating(ntdId, parsed.data);
    return okMsg(res, result.message);
  }
);