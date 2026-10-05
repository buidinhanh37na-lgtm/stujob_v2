import { Request, Response } from "express";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./verify.service";

// POST /api/student/verify
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  if (!req.file) return fail(res, "Vui lòng chọn ảnh thẻ sinh viên");

  try {
    const result = await svc.verifyStudentCard(svId, req.file.path);
    // Xóa file sau khi OCR (không cần lưu trữ)
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
    return ok(res, result);
  } catch (e: unknown) {
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
    const err = e as { status?: number; message?: string };
    return fail(res, err.message || "Lỗi OCR", err.status || 500);
  }
});