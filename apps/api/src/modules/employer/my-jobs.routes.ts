import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./my-jobs.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listJobs);
router.put("/", requireEmployer, ctrl.toggleStatus);
router.delete("/:id", requireEmployer, ctrl.deleteJob);

export default router;