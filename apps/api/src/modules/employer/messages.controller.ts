import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./messages.service";

export const listConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const data = await svc.listConversations(ntdId);
    return ok(res, data);
  }
);

export const countUnread = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.countUnread(ntdId);
  return ok(res, data);
});

export const listMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const svId = parseInt(req.params.svId, 10);
    if (!svId) return fail(res, "Thiếu SV ID");
    const data = await svc.listMessages(ntdId, svId);
    return ok(res, data);
  }
);

const sendSchema = z.object({
  noi_dung: z.string().min(1).max(2000),
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const svId = parseInt(req.params.svId, 10);
  if (!svId) return fail(res, "Thiếu SV ID");

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }

  const result = await svc.sendMessage(ntdId, svId, parsed.data.noi_dung);
  return okMsg(res, "Đã gửi", { message: result });
});