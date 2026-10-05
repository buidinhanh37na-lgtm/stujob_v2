import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./chat.service";

// GET /api/student/chat/partners
export const listPartners = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.listPartners(svId);
  return ok(res, data);
});

// GET /api/student/chat/count
export const countUnread = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.countUnread(svId);
  return ok(res, data);
});

// GET /api/student/chat/:ntdId
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const ntdId = parseInt(req.params.ntdId, 10);
  if (!ntdId) return fail(res, "Thiếu NTD ID");
  const data = await svc.listMessages(svId, ntdId);
  return ok(res, data);
});

// POST /api/student/chat/:ntdId
const sendSchema = z.object({
  noi_dung: z.string().min(1, "Tin nhắn rỗng").max(2000),
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const ntdId = parseInt(req.params.ntdId, 10);
  if (!ntdId) return fail(res, "Thiếu NTD ID");

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }

  const result = await svc.sendMessage(svId, ntdId, parsed.data.noi_dung);
  return okMsg(res, "Đã gửi", { message: result });
});