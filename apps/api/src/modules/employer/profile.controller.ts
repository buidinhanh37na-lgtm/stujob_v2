import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./profile.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.getProfile(ntdId);
  return ok(res, data);
});

const updateSchema = z.object({
  ten_cong_ty: z.string().min(1).optional(),
  nguoi_dai_dien: z.string().optional(),
  so_dien_thoai: z.string().optional(),
  dia_chi: z.string().optional(),
  linh_vuc: z.string().optional(),
  mo_ta: z.string().optional(),
  website: z.string().optional(),
  vi_do: z.union([z.coerce.number(), z.null()]).optional(),
  kinh_do: z.union([z.coerce.number(), z.null()]).optional(),
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.updateProfile(ntdId, parsed.data);
    return okMsg(res, result.message);
  }
);

const verifySchema = z.object({
  cccd: z.string().optional(),
  ma_so_thue: z.string().optional(),
  ma_so_hkd: z.string().optional(),
});

export const verifyIdentity = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return fail(res, "Dữ liệu không hợp lệ");
    const result = await svc.verifyIdentity(ntdId, parsed.data);
    return okMsg(res, result.message, { match: result.match });
  }
);