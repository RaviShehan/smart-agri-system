import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

let pumpStatus = {
  active: false,
  lastUpdated: new Date().toISOString()
};

// GET Crop Zones
app.get('/api/crop-zones', async (req: Request, res: Response) => {
  try {
    const zones = await prisma.cropZone.findMany();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crop zones' });
  }
});

// POST Telemetry Ingestion (Stores in PostgreSQL)
app.post('/api/telemetry', async (req: Request, res: Response) => {
  const { moisture, temperature } = req.body;
  try {
    const reading = await prisma.telemetry.create({
      data: {
        moisture: Number(moisture),
        temperature: Number(temperature)
      }
    });
    res.status(201).json({ success: true, reading });
  } catch (error) {
    console.error('Database insertion error:', error);
    res.status(500).json({ error: 'Failed to persist telemetry reading' });
  }
});

// GET Recent Telemetry History (For initial dashboard load)
app.get('/api/telemetry/history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.telemetry.findMany({
      take: 15,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

// GET Pump Status
app.get('/api/pump/status', (req: Request, res: Response) => {
  res.json(pumpStatus);
});

// POST Relay Control
app.post('/api/pump/toggle', (req: Request, res: Response) => {
  const { active } = req.body;
  pumpStatus = {
    active: Boolean(active),
    lastUpdated: new Date().toISOString()
  };
  res.json({ success: true, pumpStatus });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(✅ Backend Core running on http://localhost:\);
});
