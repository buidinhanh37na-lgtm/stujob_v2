import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./notifications.service";

// GET /api/admin/notifications
export const list = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  return ok(res, await svc.listNotifications(adminId));
});

// GET /api/admin/notifications/count
export const count = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  return ok(res, await svc.countUnread(adminId));
});

// PUT /api/admin/notifications  (body: { id? })
const markSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = markSchema.safeParse(req.body);
  const id = parsed.success ? parsed.data.id : undefined;
  const result = await svc.markRead(adminId, id);
  return okMsg(res, result.message);
});

// POST /api/admin/notifications  (chỉ super_admin/admin)
const createSchema = z.object({
  tieu_de: z.string().min(1),
  noi_dung: z.string().optional(),
  loai: z.string().optional(),
  admin_id: z.coerce.number().int().positive().nullable().optional(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user!.userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");

  const result = await svc.createNotification(senderId, {
    tieu_de: parsed.data.tieu_de,
    noi_dung: parsed.data.noi_dung || "",
    loai: parsed.data.loai || "info",
    admin_id: parsed.data.admin_id ?? null,
  });
  return okMsg(res, result.message, { id: result.id });
});

// DELETE /api/admin/notifications?id=
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = Number(req.query.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteNotification(adminId, id);
  return okMsg(res, result.message);
});