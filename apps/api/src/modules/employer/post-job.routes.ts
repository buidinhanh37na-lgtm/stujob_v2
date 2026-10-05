import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./post-job.controller";

const router = Router();

router.post("/", requireEmployer, ctrl.createJob);

export default router;