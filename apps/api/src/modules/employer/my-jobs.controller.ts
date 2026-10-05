import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./my-jobs.service";

// GET /api/employer/my-jobs
export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const status = (req.query.status as string) || "all";
  const data = await svc.listJobs(ntdId, status);
  return ok(res, data);
});

// PUT /api/employer/my-jobs
const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  trang_thai: z.enum(["dang_mo", "da_dong"]),
});

export const toggleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.toggleStatus(
      ntdId,
      parsed.data.id,
      parsed.data.trang_thai
    );
    return okMsg(res, result.message);
  }
);

// DELETE /api/employer/my-jobs/:id
export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteJob(ntdId, id);
  return okMsg(res, result.message);
});