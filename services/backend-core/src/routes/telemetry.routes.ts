import { Router } from "express";
import { TelemetryController } from "../controllers/telemetry.controller";

const router = Router();

router.get("/:deviceId/latest", TelemetryController.getLatestTelemetry);
router.get("/:deviceId/history", TelemetryController.getTelemetryHistory);

export default router;
