import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./invitations.controller";

const router = Router();

router.get("/", requireStudent, ctrl.listInvitations);
router.get("/count", requireStudent, ctrl.countInvitations);
router.get("/:id", requireStudent, ctrl.getDetail);
router.post("/:id/accept", requireStudent, ctrl.accept);
router.post("/:id/reject", requireStudent, ctrl.reject);

export default router;