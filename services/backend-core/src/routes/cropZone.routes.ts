import { Router } from "express";
import { CropZoneController } from "../controllers/cropZone.controller";

const router = Router();

router.get("/", CropZoneController.getCropZones);
router.get("/:id", CropZoneController.getCropZoneById);

export default router;
