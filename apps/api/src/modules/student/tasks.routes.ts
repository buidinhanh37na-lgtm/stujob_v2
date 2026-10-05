import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import { uploadSubmission } from "../../config/upload";
import * as ctrl from "./tasks.controller";

const router = Router();

router.get("/", requireStudent, ctrl.listTasks);
router.post("/", requireStudent, ctrl.createTask);
router.post(
  "/:id/submit",
  requireStudent,
  uploadSubmission.single("file"),
  ctrl.submitTask
);
router.delete("/:id", requireStudent, ctrl.deleteTask);

export default router;