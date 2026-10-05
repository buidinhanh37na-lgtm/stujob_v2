import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./chatbot.service";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

/**
 * POST /api/chatbot
 * Body: { message, history? }
 * Role lấy từ JWT (req.user.role)
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Tin nhắn không hợp lệ (1-2000 ký tự)");
  }

  // Role từ middleware auth — có thể là "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien"
  const role = req.user?.role as
    | "sinh_vien"
    | "nha_tuyen_dung"
    | "quan_tri_vien"
    | undefined;

  if (!role) {
    return fail(res, "Không xác định được role", 401);
  }

  const result = await svc.chatWithBot({
    role,
    message: parsed.data.message,
    history: parsed.data.history,
  });

  return ok(res, {
    reply: result.reply,
    job_draft: result.job_draft,
  });
});