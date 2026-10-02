import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import * as svc from "./schedule.service";

const timeRegex = /^\d{1,2}:\d{2}$/;

const createScheduleSchema = z.object({
  thu: z.coerce.number().int().min(2).max(8),
  gio_bat_dau: z.string().regex(timeRegex, "Giờ không hợp lệ"),
  gio_ket_thuc: z.string().regex(timeRegex, "Giờ không hợp lệ"),
  mon_hoc: z.string().optional(),
  phong_hoc: z.string().optional(),
  ghi_chu: z.string().optional(),
});

const createFreeTimeSchema = z.object({
  thu: z.coerce.number().int().min(2).max(8),
  gio_bat_dau: z.string().regex(timeRegex),
  gio_ket_thuc: z.string().regex(timeRegex),
});

// ============ SCHEDULE ============
export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.getSchedule(svId);
  return ok(res, data);
});

export const createSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.createSchedule(svId, parsed.data);
    return okMsg(res, "Đã thêm lịch học", { lich_hoc: result });
  }
);

export const deleteSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, "Thiếu ID");
    const result = await svc.deleteSchedule(svId, id);
    return okMsg(res, result.message);
  }
);

export const deleteAllSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const result = await svc.deleteAllSchedule(svId);
    return okMsg(res, result.message);
  }
);

export const importSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    if (!req.file) return fail(res, "Vui lòng chọn file CSV");

    const content = fs.readFileSync(req.file.path, "utf-8");
    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    const result = await svc.importScheduleCSV(svId, content);
    return okMsg(
      res,
      `Import: ${result.success} thành công, ${result.failed} thất bại`,
      { result }
    );
  }
);

// ============ FREE TIME ============
export const getFreeTime = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const data = await svc.getFreeTime(svId);
    return ok(res, data);
  }
);

export const createFreeTime = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const parsed = createFreeTimeSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.createFreeTime(svId, parsed.data);
    return okMsg(res, "Đã thêm lịch rảnh", { lich_ranh: result });
  }
);

export const deleteFreeTime = asyncHandler(
  async (req: Request, res: Response) => {
    const svId = req.user!.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, "Thiếu ID");
    const result = await svc.deleteFreeTime(svId, id);
    return okMsg(res, result.message);
  }
);

// ============ CSV TEMPLATE ============
export const downloadTemplate = asyncHandler(
  async (_req: Request, res: Response) => {
    const csv = [
      "thu,gio_bat_dau,gio_ket_thuc,mon_hoc,phong_hoc,ghi_chu",
      "2,07:00,09:30,Lập trình hướng đối tượng,A101,",
      "2,13:30,16:00,Cơ sở dữ liệu,B202,",
      "3,07:00,09:30,Giải tích 2,A102,",
      "4,09:30,11:30,Kỹ thuật lập trình,Lab3,",
      "4,13:30,16:00,Tiếng Anh B1,D404,",
      "5,07:00,09:30,Mạng máy tính,B301,",
      "6,13:30,16:00,Lập trình Web,Lab1,",
      "7,07:00,10:00,Thể dục,Nhà thi đấu,",
    ].join("\n");

    const buffer = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(csv, "utf-8"),
    ]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="lich-hoc-mau.csv"'
    );
    res.send(buffer);
  }
);