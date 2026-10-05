import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./acceptance.service";

// GET /api/employer/acceptance
export const listAcceptance = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const data = await svc.listAcceptance(ntdId);
    return ok(res, data);
  }
);

// GET /api/employer/acceptance/:id/file
export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");

  const { filePath, contentType, isDone } = await svc.getSubmissionFile(
    ntdId,
    id
  );

  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(require("path").basename(filePath))}"`
  );
  if (!isDone) res.setHeader("X-Preview-Only", "1");
  res.setHeader("Cache-Control", "no-store");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// POST /api/employer/acceptance/:id
const acceptSchema = z.object({
  chap_nhan: z.coerce.boolean(),
  nhan_xet: z.string().optional(),
});

export const acceptTask = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");

  const parsed = acceptSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }

  const result = await svc.acceptTask(
    ntdId,
    id,
    parsed.data.chap_nhan,
    parsed.data.nhan_xet || ""
  );
  return okMsg(res, result.message);
});