import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./verify.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.listRequests);
router.get("/detail", requireAdmin, ctrl.getDetail);
router.get("/stats", requireAdmin, ctrl.getStats);
router.post("/approve", requireAdmin, ctrl.approve);
router.post("/reject", requireAdmin, ctrl.reject);
router.post("/auto-verify", requireAdmin, ctrl.autoVerify);

export default router;