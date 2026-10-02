import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./applications.controller";

const router = Router();

router.get("/", requireStudent, ctrl.listApplications);
router.post("/", requireStudent, ctrl.createApplication);
router.delete("/:id", requireStudent, ctrl.cancelApplication);

export default router;