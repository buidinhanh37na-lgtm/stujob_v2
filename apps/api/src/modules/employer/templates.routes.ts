import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./templates.controller";

const router = Router();

router.get("/categories", requireEmployer, ctrl.listCategories);
router.get("/templates", requireEmployer, ctrl.listTemplates);

export default router;