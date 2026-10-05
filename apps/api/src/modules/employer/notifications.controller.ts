import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg } from "../../utils/response";
import * as svc from "./notifications.service";

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const data = await svc.listNotifications(ntdId);
    return ok(res, data);
  }
);

export const countUnread = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const data = await svc.countUnread(ntdId);
  return ok(res, data);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const result = await svc.markAllRead(ntdId);
  return okMsg(res, result.message);
});