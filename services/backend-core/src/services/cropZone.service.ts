import { prisma } from "../lib/prisma";

export class CropZoneService {
  static async getAllCropZones() {
    return prisma.cropZone.findMany({
      include: {
        devices: true,
      },
    });
  }

  static async getCropZoneById(id: string) {
    return prisma.cropZone.findUnique({
      where: { id },
      include: {
        devices: true,
      },
    });
  }
}
