import { Router } from "express";
import { requireStudent, requireEmployer, requireAdmin } from "../../middlewares/requireAuth";
import * as svCtrl from "./auth.controller";
import * as empCtrl from "./employer.controller";
import * as admCtrl from "./admin.controller";

const router = Router();

// Sinh viên
router.post("/student/register", svCtrl.registerStudent);
router.post("/student/login", svCtrl.loginStudent);
router.post("/student/logout", svCtrl.logoutStudent);
router.post("/student/refresh", svCtrl.refreshStudent);
router.post("/student/forgot", svCtrl.forgotPasswordStudent);
router.post("/student/reset", svCtrl.resetPasswordStudent);
router.get("/student/me", requireStudent, svCtrl.getMeStudent);

// Nhà tuyển dụng
router.post("/employer/register", empCtrl.registerEmployer);
router.post("/employer/login", empCtrl.loginEmployer);
router.post("/employer/logout", empCtrl.logoutEmployer);
router.post("/employer/refresh", empCtrl.refreshEmployer);
router.post("/employer/forgot", empCtrl.forgotPasswordEmployer);
router.post("/employer/reset", empCtrl.resetPasswordEmployer);
router.get("/employer/me", requireEmployer, empCtrl.getMeEmployer);

// Admin
router.post("/admin/login", admCtrl.loginAdmin);
router.post("/admin/logout", admCtrl.logoutAdmin);
router.post("/admin/refresh", admCtrl.refreshAdmin);
router.post("/admin/forgot", admCtrl.forgotPasswordAdmin);
router.post("/admin/reset", admCtrl.resetPasswordAdmin);
router.get("/admin/me", requireAdmin, admCtrl.getMeAdmin);
router.post("/admin/change-password", requireAdmin, admCtrl.changePasswordAdmin);

export default router;