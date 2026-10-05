import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./logs.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/admins", requireAdmin, ctrl.admins);
router.get("/actions", requireAdmin, ctrl.actions);
router.get("/stats", requireAdmin, ctrl.stats);
router.delete("/clean-old", requireAdmin, ctrl.cleanOld);

export default router;