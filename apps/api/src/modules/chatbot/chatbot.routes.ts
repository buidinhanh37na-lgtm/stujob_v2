import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import * as ctrl from "./chatbot.controller";

const router = Router();

// Bất kỳ role nào đã login đều dùng được
router.post("/", requireAuth, ctrl.chat);

export default router;