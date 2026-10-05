import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./notifications.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.list);
router.get("/count", requireAdmin, ctrl.count);
router.put("/", requireAdmin, ctrl.markRead);
router.post("/", requireAdmin, ctrl.create);
router.delete("/", requireAdmin, ctrl.remove);

export default router;