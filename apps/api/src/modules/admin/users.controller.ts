import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./users.service";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as string) || "sinh_vien";
  const q = (req.query.q as string) || "";
  const data = await svc.listUsers(type, q);
  return ok(res, data);
});

export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as string) || "sinh_vien";
  const id = parseInt((req.query.id as string) || "0", 10);
  if (!id) return fail(res, "Thiếu ID");
  const data = await svc.getUserDetail(type, id);
  return ok(res, data);
});

export const toggleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.userId;
    const { type, id, ly_do } = req.body;
    if (!id) return fail(res, "Thiếu ID");
    const result = await svc.toggleStatus(adminId, type, Number(id), ly_do || "");
    return okMsg(res, result.message, { bi_khoa: result.bi_khoa });
  }
);

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});