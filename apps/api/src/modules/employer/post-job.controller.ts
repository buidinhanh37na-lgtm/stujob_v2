import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { okMsg, fail } from "../../utils/response";
import * as svc from "./post-job.service";

const postJobSchema = z.object({
  nhom_viec_id: z.coerce.number().int().optional().nullable(),
  tieu_de: z.string().min(1),
  mo_ta: z.string().optional(),
  ky_nang_can: z.string().optional(),
  thu_lao: z.coerce.number().positive(),
  loai_cong_viec: z.enum(["remote", "onsite"]),
  so_luong_can: z.coerce.number().int().min(1).optional(),
  so_buoi: z.coerce.number().int().min(1).optional(),
  gio_uoc_tinh: z.coerce.number().int().min(0).optional(),
  han_chot: z.string().min(1),
  ngay_bat_dau: z.string().nullable().optional(),
  ngay_ket_thuc: z.string().nullable().optional(),
  han_nop_file: z.string().min(1),
  dia_chi_lam_viec: z.string().optional(),
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const parsed = postJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }

  const result = await svc.createJob(ntdId, parsed.data);
  return okMsg(res, result.message, {
    id: result.id,
    service_fee: result.service_fee,
  });
});