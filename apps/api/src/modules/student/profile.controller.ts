import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./profile.service";

const MUC_DO = ["co_ban", "trung_binh", "kha", "gioi", "xuat_sac"] as const;

const updateProfileSchema = z.object({
  ho_ten: z.string().min(1, "Họ tên không được rỗng").optional(),
  so_dien_thoai: z.string().optional(),
  truong: z.string().optional(),
  khoa: z.string().optional(),
  chuyen_nganh: z.string().optional(),
  nam_hoc: z
    .union([z.coerce.number().int().min(1).max(6), z.null()])
    .optional(),
  gpa: z.union([z.coerce.number().min(0).max(4), z.null()]).optional(),
  mo_ta: z.string().optional(),
  ky_nang: z
    .array(
      z.object({
        ten_ky_nang: z.string().min(1),
        muc_do: z.enum(MUC_DO),
      })
    )
    .optional(),
});

// GET /api/student/profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.getProfile(svId);
  return ok(res, data);
});

// PUT /api/student/profile
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ"
      );
    }
    const result = await svc.updateProfile(svId, parsed.data);
    return okMsg(res, result.message);
  }
);