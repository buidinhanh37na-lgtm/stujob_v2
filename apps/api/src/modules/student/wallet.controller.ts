import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./wallet.service";

// GET /api/student/wallet
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.getWallet(svId);
  return ok(res, data);
});

// GET /api/student/wallet/withdraw-history
export const getWithdrawHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const data = await svc.getWithdrawHistory(svId);
    return ok(res, data);
  }
);

// POST /api/student/wallet/withdraw
const withdrawSchema = z.object({
  so_tien: z.coerce.number().positive(),
  ngan_hang: z.string().min(1, "Chọn ngân hàng"),
  so_tai_khoan: z.string().min(1, "Nhập số tài khoản"),
  chu_tai_khoan: z.string().min(1, "Nhập chủ tài khoản"),
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.createWithdrawRequest(svId, parsed.data);
  return okMsg(res, result.message, { request_id: result.request_id });
});