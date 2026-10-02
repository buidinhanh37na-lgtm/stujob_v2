import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./certificates.service";

const createSchema = z.object({
  ten_chung_chi: z.string().min(1, "Tên chứng chỉ không được rỗng"),
  to_chuc: z.string().optional(),
  ngay_cap: z.string().optional().nullable(),
});

// GET /api/student/certificates
export const listCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const data = await svc.listCertificates(svId);
    return ok(res, data);
  }
);

// POST /api/student/certificates (multipart)
export const createCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;

    if (!req.file) {
      return fail(res, "Vui lòng chọn file (ảnh hoặc PDF)");
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      // Xóa file vừa upload nếu validate fail
      try {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      } catch {}
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }

    const fileUrl = `uploads/certificates/${req.file.filename}`;

    const cert = await svc.createCertificate(svId, {
      ten_chung_chi: parsed.data.ten_chung_chi,
      to_chuc: parsed.data.to_chuc,
      ngay_cap: parsed.data.ngay_cap || null,
      file_url: fileUrl,
    });

    return okMsg(res, "Đã tải lên chứng chỉ", { chung_chi: cert });
  }
);

// DELETE /api/student/certificates/:id
export const deleteCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, "Thiếu ID");

    const result = await svc.deleteCertificate(svId, id);
    return okMsg(res, result.message);
  }
);