import { prisma } from "../lib/prisma";

export class TelemetryService {
  static async getLatestTelemetry(deviceId: string) {
    return prisma.telemetryData.findFirst({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
    });
  }

  static async getTelemetryHistory(deviceId: string, limit = 50) {
    return prisma.telemetryData.findMany({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }
}
