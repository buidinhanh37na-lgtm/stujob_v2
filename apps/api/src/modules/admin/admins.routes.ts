import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./admins.controller";

const router = Router();

router.get("/list", requireAdmin, ctrl.list);
router.post("/create", requireAdmin, ctrl.create);
router.post("/update", requireAdmin, ctrl.update);
router.delete("/delete", requireAdmin, ctrl.remove);

export default router;