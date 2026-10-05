import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as svc from "./candidates.service";

// GET /api/employer/candidates
export const listCandidates = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const filter = {
      nhom_viec_id: req.query.nhom_viec_id
        ? parseInt(req.query.nhom_viec_id as string, 10)
        : undefined,
      ban_kinh: req.query.ban_kinh
        ? parseFloat(req.query.ban_kinh as string)
        : undefined,
      sap_xep: (req.query.sap_xep as any) || "phu_hop",
    };
    const data = await svc.listCandidates(ntdId, filter);
    return ok(res, data);
  }
);