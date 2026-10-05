import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./dashboard.controller";

const router = Router();
router.get("/", requireEmployer, ctrl.getDashboard);
export default router;