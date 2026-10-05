import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./wallet.controller";

const router = Router();

router.get("/", requireStudent, ctrl.getWallet);
router.get("/withdraw-history", requireStudent, ctrl.getWithdrawHistory);
router.post("/withdraw", requireStudent, ctrl.withdraw);

export default router;