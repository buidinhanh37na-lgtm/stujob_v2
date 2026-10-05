import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./connections.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/stats", requireAdmin, ctrl.getStats);
router.get("/detail", requireAdmin, ctrl.getDetail);

export default router;