import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./profile.controller";

const router = Router();
router.get("/", requireEmployer, ctrl.getProfile);
router.put("/", requireEmployer, ctrl.updateProfile);
router.post("/verify", requireEmployer, ctrl.verifyIdentity);
export default router;