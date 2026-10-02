import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./jobs.controller";

const router = Router();

router.get("/", requireStudent, ctrl.getJobs);

export default router;