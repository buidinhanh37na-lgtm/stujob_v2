import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./applications.service";

const createSchema = z.object({
  viec_lam_id: z.coerce.number().int().positive(),
  loi_nhan: z.string().optional(),
});

// GET /api/student/applications
export const listApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const data = await svc.listApplications(svId);
    return ok(res, data);
  }
);

// POST /api/student/applications
export const createApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.createApplication(
      svId,
      parsed.data.viec_lam_id,
      parsed.data.loi_nhan || ""
    );
    return okMsg(res, result.message, { id: result.id });
  }
);

// DELETE /api/student/applications/:id
export const cancelApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, "Thiếu ID");
    const result = await svc.cancelApplication(svId, id);
    return okMsg(res, result.message);
  }
);