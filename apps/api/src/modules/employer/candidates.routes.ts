import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./candidates.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listCandidates);

export default router;