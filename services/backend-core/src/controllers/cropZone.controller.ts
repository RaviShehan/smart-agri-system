import { Request, Response } from "express";
import { CropZoneService } from "../services/cropZone.service";

export class CropZoneController {
  static async getCropZones(req: Request, res: Response) {
    try {
      const zones = await CropZoneService.getAllCropZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crop zones" });
    }
  }

  static async getCropZoneById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const zone = await CropZoneService.getCropZoneById(id);
      if (!zone) {
        return res.status(404).json({ error: "Crop zone not found" });
      }
      res.json(zone);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crop zone" });
    }
  }
}
