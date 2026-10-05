import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./reports.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.getReport);
router.get("/export", requireEmployer, ctrl.exportReport);

export default router;