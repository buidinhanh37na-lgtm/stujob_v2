import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./invitations.service";

// GET /api/student/invitations
export const listInvitations = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const status = (req.query.status as string) || "cho_duyet";
    const data = await svc.listInvitations(svId, status);
    return ok(res, data);
  }
);

// GET /api/student/invitations/count
export const countInvitations = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const data = await svc.countPending(svId);
    return ok(res, data);
  }
);

// GET /api/student/invitations/:id
export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const data = await svc.getInvitationDetail(svId, id);
  return ok(res, data);
});

// POST /api/student/invitations/:id/accept
export const accept = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.acceptInvitation(svId, id);
  return okMsg(res, result.message, { escrow_code: result.escrow_code });
});

// POST /api/student/invitations/:id/reject
const rejectSchema = z.object({ ly_do: z.string().optional() });

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const parsed = rejectSchema.safeParse(req.body);
  const lyDo = parsed.success ? parsed.data.ly_do || "" : "";
  const result = await svc.rejectInvitation(svId, id, lyDo);
  return okMsg(res, result.message);
});