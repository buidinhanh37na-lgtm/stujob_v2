import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./complaints.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/stats", requireAdmin, ctrl.getStats);
router.get("/detail", requireAdmin, ctrl.getDetail);
router.post("/take", requireAdmin, ctrl.take);
router.post("/resolve", requireAdmin, ctrl.resolve);
router.post("/close", requireAdmin, ctrl.close);

export default router;