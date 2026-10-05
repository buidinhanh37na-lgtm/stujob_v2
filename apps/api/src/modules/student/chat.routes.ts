import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./chat.controller";

const router = Router();

router.get("/partners", requireStudent, ctrl.listPartners);
router.get("/count", requireStudent, ctrl.countUnread);
router.get("/:ntdId", requireStudent, ctrl.listMessages);
router.post("/:ntdId", requireStudent, ctrl.sendMessage);

export default router;