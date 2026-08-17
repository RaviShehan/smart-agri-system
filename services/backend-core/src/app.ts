import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import client from 'prom-client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Enable default Node.js process metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({ register: client.register });

// Custom Prometheus Metric for Telemetry Ingestion
export const telemetryIngestCounter = new client.Counter({
  name: 'agri_telemetry_ingested_total',
  help: 'Total number of telemetry payloads ingested',
  labelNames: ['zone_id']
});

let pumpStatus = {
  active: false,
  lastUpdated: new Date().toISOString()
};

// Prometheus Metrics Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET Crop Zones
app.get('/api/crop-zones', async (req: Request, res: Response) => {
  try {
    const zones = await prisma.cropZone.findMany({ orderBy: { name: 'asc' } });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crop zones' });
  }
});

// PATCH Update Threshold
app.patch('/api/crop-zones/:id/threshold', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { moistureThreshold } = req.body;
  try {
    const updatedZone = await prisma.cropZone.update({
      where: { id },
      data: { moistureThreshold: Number(moistureThreshold) }
    });
    res.json({ success: true, zone: updatedZone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update threshold' });
  }
});

// GET Daily Analytics Aggregations
app.get('/api/telemetry/analytics', async (req: Request, res: Response) => {
  const { zoneId } = req.query;

  try {
    const rawData = await prisma.telemetry.findMany({
      where: zoneId && zoneId !== 'all' ? { cropZoneId: String(zoneId) } : {},
      orderBy: { recordedAt: 'asc' }
    });

    const grouped: { [key: string]: { moistureSum: number; tempSum: number; count: number } } = {};

    rawData.forEach(item => {
      const dateKey = new Date(item.recordedAt).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { moistureSum: 0, tempSum: 0, count: 0 };
      }
      grouped[dateKey].moistureSum += item.moisture;
      grouped[dateKey].tempSum += item.temperature;
      grouped[dateKey].count += 1;
    });

    const analytics = Object.keys(grouped).map(date => ({
      date,
      avgMoisture: Math.round((grouped[date].moistureSum / grouped[date].count) * 10) / 10,
      avgTemperature: Math.round((grouped[date].tempSum / grouped[date].count) * 10) / 10,
      totalReadings: grouped[date].count
    }));

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate daily aggregations' });
  }
});

// GET Export Telemetry CSV
app.get('/api/telemetry/export-csv', async (req: Request, res: Response) => {
  const { zoneId } = req.query;

  try {
    const data = await prisma.telemetry.findMany({
      where: zoneId && zoneId !== 'all' ? { cropZoneId: String(zoneId) } : {},
      include: { cropZone: true },
      orderBy: { recordedAt: 'desc' }
    });

    let csvContent = 'ID,Recorded At,Crop Zone,Moisture (%),Temperature (C)\n';

    data.forEach(item => {
      const zoneName = item.cropZone ? item.cropZone.name : 'Unassigned';
      const timeStr = new Date(item.recordedAt).toISOString();
      csvContent += item.id + ',' + timeStr + ',' + zoneName + ',' + item.moisture + ',' + item.temperature + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="agri_telemetry_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

// POST Telemetry Ingestion
app.post('/api/telemetry', async (req: Request, res: Response) => {
  const { moisture, temperature, cropZoneId } = req.body;
  try {
    const reading = await prisma.telemetry.create({
      data: {
        moisture: Number(moisture),
        temperature: Number(temperature),
        cropZoneId: cropZoneId || null
      }
    });

    // Increment Prometheus counter
    telemetryIngestCounter.inc({ zone_id: cropZoneId || 'unassigned' });

    res.status(201).json({ success: true, reading });
  } catch (error) {
    res.status(500).json({ error: 'Failed to persist telemetry' });
  }
});

// GET Telemetry History
app.get('/api/telemetry/history', async (req: Request, res: Response) => {
  const { zoneId } = req.query;
  try {
    const history = await prisma.telemetry.findMany({
      where: zoneId && zoneId !== 'all' ? { cropZoneId: String(zoneId) } : {},
      take: 15,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

// Relay Control
app.get('/api/pump/status', (req: Request, res: Response) => res.json(pumpStatus));
app.post('/api/pump/toggle', (req: Request, res: Response) => {
  pumpStatus = { active: Boolean(req.body.active), lastUpdated: new Date().toISOString() };
  res.json({ success: true, pumpStatus });
});

app.listen(4000, () => console.log('✅ Backend Core with Prometheus Metrics running on port 4000'));
