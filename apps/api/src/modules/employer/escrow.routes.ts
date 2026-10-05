import { Router } from "express";
import { requireEmployer } from "../../middlewares/requireAuth";
import * as ctrl from "./escrow.controller";

const router = Router();

router.get("/", requireEmployer, ctrl.listEscrow);
router.get("/wallet", requireEmployer, ctrl.getWallet);
router.post("/deposit", requireEmployer, ctrl.deposit);
router.post("/activate", requireEmployer, ctrl.activate);

export default router;