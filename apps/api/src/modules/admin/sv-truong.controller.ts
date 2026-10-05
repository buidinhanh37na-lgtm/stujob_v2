import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./sv-truong.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const status = (req.query.status as string) || "all";
  const data = await svc.listSvTruong(q, status);
  return ok(res, data);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});

const addSchema = z.object({
  ma_sinh_vien: z.string().min(1),
  ho_ten: z.string().min(1),
  ngay_sinh: z.string().optional().nullable(),
  khoa: z.string().optional(),
  chuyen_nganh: z.string().optional(),
  nam_hoc: z.coerce.number().int().min(1).max(7).optional().nullable(),
  lop: z.string().optional(),
  trang_thai: z.enum(["dang_hoc", "tot_nghiep", "bi_dinh_chi"]).optional(),
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.addSvTruong(adminId, parsed.data);
  return okMsg(res, result.message, { id: result.id });
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  if (!req.file) return fail(res, "Vui lòng chọn file CSV");

  const content = fs.readFileSync(req.file.path, "utf-8");
  try {
    fs.unlinkSync(req.file.path);
  } catch {}

  const result = await svc.importSvTruong(adminId, content);
  return okMsg(
    res,
    `Import: ${result.success} thành công, ${result.failed} thất bại`,
    { result }
  );
});

export const deleteSv = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = parseInt(req.params.id, 10);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteSvTruong(adminId, id);
  return okMsg(res, result.message);
});

export const downloadTemplate = asyncHandler(
  async (_req: Request, res: Response) => {
    const buffer = svc.getTemplate();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sinh-vien-truong-mau.csv"'
    );
    res.send(buffer);
  }
);