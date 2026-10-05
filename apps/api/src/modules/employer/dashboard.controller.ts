import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as svc from "./dashboard.service";

export const getDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const data = await svc.getDashboard(ntdId);
    return ok(res, data);
  }
);