import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./notifications.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listNotifications);
router.get("/count", requireEmployer, ctrl.countUnread);
router.put("/", requireEmployer, ctrl.markAllRead);

export default router;