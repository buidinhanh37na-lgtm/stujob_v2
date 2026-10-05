import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./admins.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.listAdmins());
});

const createSchema = z.object({
  ho_ten: z.string().min(1),
  email: z.string().email(),
  mat_khau: z.string().min(6),
  vai_tro: z.enum(["super_admin", "admin", "moderator", "support"]),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  const result = await svc.createAdmin(adminId, parsed.data);
  return okMsg(res, result.message);
});

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  ho_ten: z.string().optional(),
  vai_tro: z.enum(["super_admin", "admin", "moderator", "support"]).optional(),
  trang_thai: z.enum(["hoat_dong", "bi_khoa"]).optional(),
  mat_khau: z.string().min(6).optional(),
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  const result = await svc.updateAdmin(adminId, parsed.data);
  return okMsg(res, result.message);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = Number(req.query.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteAdmin(adminId, id);
  return okMsg(res, result.message);
});