    import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as svc from "./dashboard.service";

export const getDashboard = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await svc.getDashboard();
    return ok(res, data);
  }
);