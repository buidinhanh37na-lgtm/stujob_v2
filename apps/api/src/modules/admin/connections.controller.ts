import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./connections.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "all";
  const q = (req.query.q as string) || "";
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const data = await svc.listConnections(status, q, page);
  return ok(res, data);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});

export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt((req.query.id as string) || "0", 10);
  if (!id) return fail(res, "Thiếu ID");
  const data = await svc.getConnectionDetail(id);
  return ok(res, data);
});
