import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./complaints.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "all";
  const priority = (req.query.priority as string) || "all";
  const q = (req.query.q as string) || "";
  const data = await svc.listComplaints(status, priority, q);
  return ok(res, data);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.getStats();
  return ok(res, data);
});

export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt((req.query.id as string) || "0", 10);
  if (!id) return fail(res, "Thiếu ID");
  const data = await svc.getComplaintDetail(id);
  return ok(res, data);
});

const takeSchema = z.object({
  id: z.coerce.number().int().positive(),
  uu_tien: z.enum(["thap", "trung_binh", "cao", "khan_cap"]).optional(),
});

export const take = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = takeSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Dữ liệu không hợp lệ");
  const result = await svc.takeComplaint(
    adminId,
    parsed.data.id,
    parsed.data.uu_tien || "trung_binh"
  );
  return okMsg(res, result.message);
});

const resolveSchema = z.object({
  id: z.coerce.number().int().positive(),
  ket_qua: z.string().min(1, "Vui lòng nhập kết quả"),
  huong_xu_ly: z.enum([
    "hoan_tien_sv",
    "hoan_tien_ntd",
    "chia_doi",
    "khong_hoan",
    "khac",
  ]),
  so_tien_hoan: z.coerce.number().min(0).optional(),
});

export const resolve = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
  }
  const result = await svc.resolveComplaint(adminId, {
    id: parsed.data.id,
    ket_qua: parsed.data.ket_qua,
    huong_xu_ly: parsed.data.huong_xu_ly,
    so_tien_hoan: parsed.data.so_tien_hoan || 0,
  });
  return okMsg(res, result.message);
});

const closeSchema = z.object({
  id: z.coerce.number().int().positive(),
  ly_do: z.string().min(1),
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Vui lòng nhập lý do");
  const result = await svc.closeComplaint(adminId, parsed.data.id, parsed.data.ly_do);
  return okMsg(res, result.message);
});