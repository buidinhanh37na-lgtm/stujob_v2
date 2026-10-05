import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./reports.service";

function getRange(req: Request) {
  const from = (req.query.from as string) || "";
  const to = (req.query.to as string) || "";
  if (!from || !to) throw { status: 400, message: "Thiếu khoảng thời gian" };
  return { from, to };
}

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const ntdId = req.user!.userId;
  const { from, to } = getRange(req);
  const data = await svc.getReport(ntdId, from, to);
  return ok(res, data);
});

export const exportReport = asyncHandler(
  async (req: Request, res: Response) => {
    const ntdId = req.user!.userId;
    const { from, to } = getRange(req);
    const buffer = await svc.exportCSV(ntdId, from, to);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-${from}-${to}.csv"`
    );
    res.send(buffer);
  }
);