import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.telemetry.deleteMany({});
  await prisma.cropZone.deleteMany({});

  const zones = [
    { name: 'North Field', cropType: 'Tomatoes', deviceId: randomUUID() },
    { name: 'South Field', cropType: 'Wheat', deviceId: randomUUID() },
    { name: 'East Greenhouse', cropType: 'Peppers', deviceId: randomUUID() },
  ];

  for (const zone of zones) {
    const created = await prisma.cropZone.create({
      data: zone,
    });
    console.log(`✅ Seeded CropZone: ${created.name} (${created.cropType}) with Device ID: ${created.deviceId}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
