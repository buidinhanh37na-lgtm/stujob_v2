import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./messages.controller";

const router = Router();

router.get("/conversations", requireEmployer, ctrl.listConversations);
router.get("/count", requireEmployer, ctrl.countUnread);
router.get("/:svId", requireEmployer, ctrl.listMessages);
router.post("/:svId", requireEmployer, ctrl.sendMessage);

export default router;