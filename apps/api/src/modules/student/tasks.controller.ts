import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import { makePreview } from "../../services/preview";
import * as svc from "./tasks.service";

// GET /api/student/tasks
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.listTasks(svId);
  return ok(res, data);
});

// POST /api/student/tasks
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

  // ⭐ Tạo preview thực sự (resize + watermark)
  let previewUrl: string | null = null;
  try {
    const preview = await makePreview(req.file.path, req.file.originalname);
    previewUrl = preview.previewPath;
    if (preview.error) {
      console.warn("[SUBMIT] Preview failed:", preview.error);
    } else {
      console.log(
        `[SUBMIT] Preview OK — ${preview.kind}` +
          (preview.totalPages
            ? ` (${preview.previewPages}/${preview.totalPages} trang)`
            : "")
      );
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.warn("[SUBMIT] Preview exception:", err.message);
  }

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