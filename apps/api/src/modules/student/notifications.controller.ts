import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./notifications.service";

// GET /api/student/notifications
export const list = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  return ok(res, await svc.listNotifications(svId));
});

// GET /api/student/notifications/count
export const count = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  return ok(res, await svc.countUnread(svId));
});

// PUT /api/student/notifications  body: { id? }
const markSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const parsed = markSchema.safeParse(req.body);
  const id = parsed.success ? parsed.data.id : undefined;
  const result = await svc.markRead(svId, id);
  return okMsg(res, result.message);
});

// DELETE /api/student/notifications?id=
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = Number(req.query.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteNotification(svId, id);
  return okMsg(res, result.message);
});