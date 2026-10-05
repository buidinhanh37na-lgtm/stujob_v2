import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./escrow.service";

// GET /api/employer/escrow/wallet
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.getWallet(ntdId);
  return ok(res, data);
});

// POST /api/employer/escrow/deposit
const depositSchema = z.object({
  so_tien: z.coerce.number().positive(),
});

export const deposit = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Số tiền không hợp lệ");
  const result = await svc.deposit(ntdId, parsed.data.so_tien);
  return okMsg(res, result.message);
});

// GET /api/employer/escrow
export const listEscrow = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.listEscrow(ntdId);
  return ok(res, data);
});

// POST /api/employer/escrow/activate
export const activate = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const id = Number(req.body.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.activateEscrow(ntdId, id);
  return okMsg(res, result.message);
});