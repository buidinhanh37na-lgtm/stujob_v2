import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./jobs.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/stats", requireAdmin, ctrl.getStats);
router.post("/force-close", requireAdmin, ctrl.forceClose);
router.delete("/", requireAdmin, ctrl.remove);

export default router;