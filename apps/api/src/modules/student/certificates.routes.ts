import { Router } from "express";
import { requireStudent } from "../../middlewares/requireAuth";
import { uploadCertificate } from "../../config/upload";
import * as ctrl from "./certificates.controller";

const router = Router();

router.get("/", requireStudent, ctrl.listCertificates);
router.post(
  "/",
  requireStudent,
  uploadCertificate.single("file"),
  ctrl.createCertificate
);
router.delete("/:id", requireStudent, ctrl.deleteCertificate);

export default router;