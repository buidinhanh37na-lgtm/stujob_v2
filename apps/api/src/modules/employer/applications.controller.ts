import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./applications.service";

// GET /api/employer/applications
export const listApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const jobId = req.query.viec_lam_id
      ? parseInt(req.query.viec_lam_id as string, 10)
      : undefined;
    const data = await svc.listApplications(ntdId, jobId);
    return ok(res, data);
  }
);

// GET /api/employer/applications/candidate/:id
export const getCandidateDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const svId = parseInt(req.params.id, 10);
    if (!svId) return fail(res, "Thiếu ID");
    const data = await svc.getCandidateDetail(ntdId, svId);
    return ok(res, data);
  }
);

// POST /api/employer/applications/approve
export const approve = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const utId = Number(req.body.ung_tuyen_id);
  if (!utId) return fail(res, "Thiếu ID");
  const result = await svc.approveApplication(ntdId, utId);
  return okMsg(res, result.message, { escrow_code: result.escrow_code });
});

// POST /api/employer/applications/reject
export const reject = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const utId = Number(req.body.ung_tuyen_id);
  if (!utId) return fail(res, "Thiếu ID");
  const result = await svc.rejectApplication(ntdId, utId);
  return okMsg(res, result.message);
});

// POST /api/employer/applications/invite
const inviteSchema = z.object({
  sinh_vien_id: z.coerce.number().int().positive(),
  viec_lam_id: z.coerce.number().int().positive(),
  loi_nhan: z.string().optional(),
});

export const invite = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.inviteCandidate(
    ntdId,
    parsed.data.sinh_vien_id,
    parsed.data.viec_lam_id,
    parsed.data.loi_nhan || ""
  );
  return okMsg(res, result.message);
});