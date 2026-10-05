import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./users.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.listUsers);
router.get("/detail", requireAdmin, ctrl.getDetail);
router.get("/stats", requireAdmin, ctrl.getStats);
router.post("/toggle-status", requireAdmin, ctrl.toggleStatus);

export default router;