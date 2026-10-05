import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./dashboard.controller";

const router = Router();

router.get("/", requireAdmin, ctrl.getDashboard);

export default router;