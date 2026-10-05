import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./templates.service";

export const listCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await svc.listCategories();
    return ok(res, data);
  }
);

export const listTemplates = asyncHandler(
  async (req: Request, res: Response) => {
    const nhomViecId = parseInt((req.query.nhom_viec_id as string) || "0", 10);
    if (!nhomViecId) return fail(res, "Thiếu nhóm việc");
    const data = await svc.listTemplates(nhomViecId);
    return ok(res, data);
  }
);