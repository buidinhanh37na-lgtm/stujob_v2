import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./revenue.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.getSummary);
router.get("/export", requireAdmin, ctrl.exportReport);

export default router;