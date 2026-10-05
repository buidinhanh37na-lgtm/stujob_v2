import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./moderation.controller";

const router = Router();

// ============ TỪ KHÓA (phải đặt trước /:xxx) ============
router.get("/keywords", requireAdmin, ctrl.listKeywords);
router.get("/keywords-stats", requireAdmin, ctrl.keywordsStats);
router.post("/add-keyword", requireAdmin, ctrl.addKeyword);
router.post("/update-keyword", requireAdmin, ctrl.updateKeyword);
router.delete("/delete-keyword", requireAdmin, ctrl.deleteKeyword);

// ============ KIỂM DUYỆT TIN ============
router.get("/pending", requireAdmin, ctrl.listPending);
router.get("/analyze", requireAdmin, ctrl.analyze);
router.post("/approve", requireAdmin, ctrl.approve);
router.post("/block", requireAdmin, ctrl.block);
router.post("/warn", requireAdmin, ctrl.warn);
router.post("/auto-scan", requireAdmin, ctrl.autoScan);

export default router;