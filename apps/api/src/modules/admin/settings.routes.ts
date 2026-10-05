import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./settings.controller";

const router = Router();

router.get("/list", requireAdmin, ctrl.list);
router.get("/get", requireAdmin, ctrl.get);
router.get("/system-info", requireAdmin, ctrl.systemInfo);
router.post("/update", requireAdmin, ctrl.update);

export default router;