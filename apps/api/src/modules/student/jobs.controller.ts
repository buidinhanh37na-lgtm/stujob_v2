import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as svc from "./jobs.service";

// GET /api/student/jobs
export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const svId = req.user!.userId;
  const data = await svc.getJobsForStudent(svId);
  return ok(res, data);
});