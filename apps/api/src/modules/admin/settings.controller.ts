import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./settings.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.listAll());
});

const updateSchema = z.object({
  items: z.record(z.string(), z.string()),
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Dữ liệu không hợp lệ");
  const result = await svc.updateMany(adminId, parsed.data.items);
  return okMsg(res, result.message);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const key = (req.query.key as string) || "";
  if (!key) return fail(res, "Thiếu key");
  return ok(res, await svc.getOne(key));
});

export const systemInfo = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await svc.getSystemInfo());
});