import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import { UPLOAD_ROOT } from "../../config/upload";
import * as svc from "./tasks.service";

// GET /api/student/tasks
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.listTasks(svId);
  return ok(res, data);
});

// POST /api/student/tasks (tạo nhiệm vụ cá nhân)
const createSchema = z.object({
  ten_nhiem_vu: z.string().min(1, "Tên không được rỗng"),
  mo_ta: z.string().optional(),
  han_nop: z.string().optional().nullable(),
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.createTask(svId, parsed.data);
  return okMsg(res, "Đã thêm nhiệm vụ", { nhiem_vu: result });
});

// POST /api/student/tasks/:id/submit (multipart)
export const submitTask = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  if (!req.file) return fail(res, "Vui lòng chọn file");

  const fileUrl = `uploads/submissions/${req.file.filename}`;

  // Copy làm preview (đơn giản — sau này thêm watermark)
  let previewUrl: string | null = null;
  try {
    const previewDir = path.join(UPLOAD_ROOT, "previews");
    if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });
    const previewName = `pre_${req.file.filename}`;
    fs.copyFileSync(req.file.path, path.join(previewDir, previewName));
    previewUrl = `uploads/previews/${previewName}`;
  } catch {}

  const result = await svc.submitTask(svId, id, fileUrl, previewUrl);
  return okMsg(res, result.message, { file_url: fileUrl });
});

// DELETE /api/student/tasks/:id
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteTask(svId, id);
  return okMsg(res, result.message);
});