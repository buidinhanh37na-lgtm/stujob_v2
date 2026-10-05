import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, fail } from "../../utils/response";
import * as svc from "./revenue.service";

function getRange(req: Request) {
  const from = (req.query.from as string) || "";
  const to = (req.query.to as string) || "";
  if (!from || !to) throw { status: 400, message: "Thiếu khoảng thời gian" };
  return { from, to };
}

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = getRange(req);
  const data = await svc.getFullReport(from, to);
  return ok(res, data);
});

export const exportReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to } = getRange(req);
    const buffer = await svc.exportCSV(from, to);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="doanh-thu-${from}-${to}.csv"`
    );
    res.send(buffer);
  }
);