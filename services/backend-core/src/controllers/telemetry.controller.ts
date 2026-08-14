import { Request, Response } from "express";
import { TelemetryService } from "../services/telemetry.service";

export class TelemetryController {
  static async getLatestTelemetry(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const data = await TelemetryService.getLatestTelemetry(deviceId);
      if (!data) {
        return res.status(404).json({ error: "No telemetry found for this device" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest telemetry" });
    }
  }

  static async getTelemetryHistory(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await TelemetryService.getTelemetryHistory(deviceId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch telemetry history" });
    }
  }
}
