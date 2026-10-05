import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./applications.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listApplications);
router.get("/candidate/:id", requireEmployer, ctrl.getCandidateDetail);
router.post("/approve", requireEmployer, ctrl.approve);
router.post("/reject", requireEmployer, ctrl.reject);
router.post("/invite", requireEmployer, ctrl.invite);

export default router;