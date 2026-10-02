import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./profile.controller";

const router = Router();

router.get("/", requireStudent, ctrl.getProfile);
router.put("/", requireStudent, ctrl.updateProfile);

export default router;