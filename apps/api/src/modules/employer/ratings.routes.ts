import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./ratings.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listRatings);
router.post("/", requireEmployer, ctrl.createRating);

export default router;