import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./notifications.controller";

const router = Router();

router.get("/", requireStudent, ctrl.list);
router.get("/count", requireStudent, ctrl.count);
router.put("/", requireStudent, ctrl.markRead);
router.delete("/", requireStudent, ctrl.remove);

export default router;