import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./refunds.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/stats", requireAdmin, ctrl.getStats);
router.post("/", requireAdmin, ctrl.create);

export default router;