import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./acceptance.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listAcceptance);
router.get("/:id/file", requireEmployer, ctrl.getFile);
router.post("/:id", requireEmployer, ctrl.acceptTask);

export default router;