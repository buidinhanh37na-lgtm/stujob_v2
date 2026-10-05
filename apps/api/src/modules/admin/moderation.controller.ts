import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./moderation.service";

// ============ MODERATION ============
export const listPending = asyncHandler(async (req: Request, res: Response) => {
  const filter = (req.query.filter as string) || "all";
  const q = (req.query.q as string) || "";
  const data = await svc.listPending(filter, q);
  return ok(res, data);
});

export const analyze = asyncHandler(async (req: Request, res: Response) => {
  const jobId = parseInt((req.query.job_id as string) || "0", 10);
  if (!jobId) return fail(res, "Thiếu job_id");
  const data = await svc.analyzeSingleJob(jobId);
  return ok(res, data);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const jobId = Number(req.body.viec_lam_id);
  if (!jobId) return fail(res, "Thiếu viec_lam_id");
  const result = await svc.approveJob(adminId, jobId, req.body.ly_do || "");
  return okMsg(res, result.message);
});

export const block = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const { viec_lam_id, ly_do, diem_rui_ro, tu_khoa } = req.body;
  const result = await svc.blockJob(
    adminId,
    Number(viec_lam_id),
    ly_do || "",
    Number(diem_rui_ro) || 10,
    tu_khoa || ""
  );
  return okMsg(res, result.message);
});

export const warn = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const { viec_lam_id, ly_do, diem_rui_ro, tu_khoa } = req.body;
  const result = await svc.warnJob(
    adminId,
    Number(viec_lam_id),
    ly_do || "Nội dung có dấu hiệu không phù hợp",
    Number(diem_rui_ro) || 5,
    tu_khoa || ""
  );
  return okMsg(res, result.message);
});

export const autoScan = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const result = await svc.autoScan(adminId);
  return okMsg(res, result.message, {
    blocked: result.blocked,
    warned: result.warned,
    safe: result.safe,
  });
});

// ============ KEYWORDS ============
export const listKeywords = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.listKeywords();
  return ok(res, data);
});

const addKwSchema = z.object({
  tu_khoa: z.string().min(1),
  muc_do_rui_ro: z.coerce.number().int().min(1).max(10),
  loai: z.enum(["lua_dao", "rui_ro", "khong_phu_hop"]).optional(),
  hanh_dong: z.enum(["chan", "canh_bao"]).optional(),
  ghi_chu: z.string().optional(),
});

export const addKeyword = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const parsed = addKwSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Dữ liệu không hợp lệ");
  const d = parsed.data;
  const result = await svc.addKeyword(
    adminId,
    d.tu_khoa,
    d.muc_do_rui_ro,
    d.loai || "rui_ro",
    d.hanh_dong || "chan",
    d.ghi_chu || ""
  );
  return okMsg(res, result.message, { id: result.id });
});

export const updateKeyword = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = Number(req.body.id);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.updateKeyword(adminId, id, req.body);
  return okMsg(res, result.message);
});

export const deleteKeyword = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const id = parseInt((req.query.id as string) || "0", 10);
  if (!id) return fail(res, "Thiếu ID");
  const result = await svc.deleteKeyword(adminId, id);
  return okMsg(res, result.message);
});

export const keywordsStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await svc.keywordsStats();
  return ok(res, data);
});